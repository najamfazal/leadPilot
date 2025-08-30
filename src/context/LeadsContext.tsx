'use client';

import React, { createContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { Lead, Interaction, LeadTrait, Task, Responsiveness, LeadSegment, BlockerType, InteractionFormData } from '@/lib/types';
import { calculateLeadScore } from '@/ai/flows/automatic-scoring-algorithm';
import { useToast } from '@/hooks/use-toast';
import { add, differenceInHours } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp, orderBy, doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';


interface LeadsContextType {
  leads: Lead[];
  interactions: Interaction[];
  tasks: Task[];
  addLead: (lead: Omit<Lead, 'id' | 'score' | 'createdAt' | 'status' | 'segment'>) => void;
  addInteraction: (leadId: string, interactionData: InteractionFormData) => Promise<void>;
  isLoading: boolean;
  getLeadResponsiveness: (leadId: string) => Responsiveness;
  completeTask: (taskId: string, leadId: string, isDay7FollowUp: boolean) => Promise<void>;
}

export const LeadsContext = createContext<LeadsContextType>({
  leads: [],
  interactions: [],
  tasks: [],
  addLead: () => {},
  addInteraction: async () => {},
  isLoading: true,
  getLeadResponsiveness: () => 'cold',
  completeTask: async () => {},
});

export const LeadsProvider = ({ children }: { children: ReactNode }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const leadsQuery = query(collection(db, "leads"), orderBy("createdAt", "desc"));
      const leadsSnapshot = await getDocs(leadsQuery);
      const leadsData = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: (doc.data().createdAt as Timestamp)?.toDate() })) as Lead[];
      setLeads(leadsData);

      if (leadsData.length > 0) {
        const leadIds = leadsData.map(l => l.id);
        
        const interactionsQuery = query(collection(db, "interactions"), where("leadId", "in", leadIds));
        const interactionsSnapshot = await getDocs(interactionsQuery);
        const interactionsData = interactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: (doc.data().date as Timestamp).toDate() })) as Interaction[];
        setInteractions(interactionsData);

        const tasksQuery = query(collection(db, "tasks"), where("leadId", "in", leadIds), where("completed", "==", false));
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasksData = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), dueDate: (doc.data().dueDate as Timestamp).toDate() })) as Task[];
        setTasks(tasksData);
      } else {
        setInteractions([]);
        setTasks([]);
      }

    } catch (error) {
      console.error("Error fetching data from Firestore:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data from the database.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getLeadResponsiveness = useCallback((leadId: string): Responsiveness => {
    const lastInteraction = interactions
        .filter(i => i.leadId === leadId)
        .sort((a,b) => (b.date as Date).getTime() - (a.date as Date).getTime())[0];
    if (!lastInteraction) return 'cold';

    const hours = differenceInHours(new Date(), lastInteraction.date as Date);
    if (hours < 24) return 'hot';
    if (hours < 72) return 'warm';
    return 'cold';
  }, [interactions]);
  
  const completeTask = useCallback(async (taskId: string, leadId: string, isDay7FollowUp: boolean) => {
    const batch = writeBatch(db);
    const taskRef = doc(db, "tasks", taskId);
    batch.update(taskRef, { completed: true });

    if (isDay7FollowUp) {
      const leadRef = doc(db, "leads", leadId);
      batch.update(leadRef, { status: "Archived" });
    }

    try {
        await batch.commit();
        setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
        if (isDay7FollowUp) {
            setLeads(prevLeads => prevLeads.map(l => l.id === leadId ? { ...l, status: 'Archived' } : l));
             toast({
                title: "Task Completed & Lead Archived",
                description: "The Day 7 follow-up was completed, and the lead has been archived.",
            });
        } else {
            toast({
                title: "Task Completed!",
                description: "The task has been marked as complete.",
            });
        }
    } catch (error) {
        console.error("Error completing task: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not complete the task.",
        });
    }

  }, [toast]);


  const addLead = useCallback(async (leadData: Omit<Lead, 'id' | 'score' | 'createdAt' | 'status' | 'segment'>) => {
    setIsLoading(true);
    try {
      const newLeadData = {
        ...leadData,
        score: 50,
        createdAt: serverTimestamp(),
        status: 'Active',
        segment: 'Standard Follow-up'
      };
      const docRef = await addDoc(collection(db, "leads"), newLeadData);
      
      const newLeadForState: Lead = { 
          ...newLeadData, 
          id: docRef.id, 
          createdAt: new Date(),
      };
      
      setLeads(prevLeads => [newLeadForState, ...prevLeads]);
      toast({
          title: 'Lead Added Successfully!',
          description: `${newLeadForState.name} has been added to your pipeline.`,
      });
    } catch (error) {
       console.error("Error adding lead:", error);
       toast({
           variant: "destructive",
           title: "Database Error",
           description: "Could not add the new lead.",
       });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  const getNextFollowUpDay = (leadId: string): { day: number, date: Date } => {
    const followUpTasks = tasks.filter(t => t.leadId === leadId && t.description.includes('Follow up'));
    const sequence = [1, 3, 5, 7];
    if (followUpTasks.length === 0) {
        return { day: 1, date: add(new Date(), { days: 1 }) };
    }
    const lastFollowUpDayMatch = [...followUpTasks].sort((a,b) => (b.dueDate as Date).getTime() - (a.dueDate as Date).getTime())[0].description.match(/Day (\d+)/);
    const lastFollowUpDay = lastFollowUpDayMatch ? parseInt(lastFollowUpDayMatch[1]) : 0;
    const nextIndex = sequence.indexOf(lastFollowUpDay) + 1;

    if (nextIndex < sequence.length) {
        const nextDay = sequence[nextIndex];
        const daysToAdd = nextDay - (lastFollowUpDay || 0);
        return { day: nextDay, date: add(new Date(), { days: daysToAdd }) };
    }
    return { day: 7, date: add(new Date(), { days: 7 }) };
  }


  const addInteraction = useCallback(async (leadId: string, interactionData: InteractionFormData) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    setIsLoading(true);
    try {
      const scoringResult = await calculateLeadScore({
        currentLeadScore: lead.score,
        leadIntent: interactionData.intent,
        leadInterest: interactionData.interest,
        actionCommitted: interactionData.action,
        leadTraits: interactionData.traits,
      });
      
      const { updatedLeadScore, interactionScore } = scoringResult;
      const batch = writeBatch(db);

      // 1. Create New Interaction
      const newInteractionData = {
        ...interactionData,
        leadId,
        date: serverTimestamp(),
        interactionScore,
        previousScore: lead.score,
        newScore: updatedLeadScore,
      };
      const interactionRef = doc(collection(db, "interactions"));
      batch.set(interactionRef, newInteractionData);
      
      // 2. Determine New Segment and Task
      let newSegment: LeadSegment = 'Standard Follow-up';
      let newTaskData: Omit<Task, 'id' | 'completed'>;

      if (interactionData.action === 'Demo Scheduled' || interactionData.action === 'Visit Scheduled') {
          newSegment = 'Awaiting Event';
          newTaskData = { leadId, description: `🗓️ Confirm ${interactionData.action} with ${lead.name}`, dueDate: add(new Date(), {days: -1}), segment: newSegment };
      } else if (interactionData.preWorkRequired && interactionData.preWorkDescription) {
          newSegment = 'Action Required';
          newTaskData = { leadId, description: `🛠️ ${interactionData.preWorkDescription}`, dueDate: new Date(), segment: newSegment };
      } else if (interactionData.blockerType === 'Circumstantial Blocker') {
          newSegment = 'On Hold';
          newTaskData = { leadId, description: `Check-in with ${lead.name}`, dueDate: add(new Date(), { days: 30 }), segment: newSegment };
      } else if (interactionData.blockerType === 'Decisional Blocker') {
          newSegment = 'Needs Persuasion';
          newTaskData = { leadId, description: `Nurture ${lead.name}: Send value content`, dueDate: add(new Date(), { days: 2 }), segment: newSegment };
      } else if (interactionData.specialFollowUpDate) {
          newSegment = 'Special Follow-up';
          newTaskData = { leadId, description: `Special follow-up with ${lead.name}`, dueDate: interactionData.specialFollowUpDate, segment: newSegment };
      } else {
          const { day, date } = getNextFollowUpDay(leadId);
          newSegment = 'Standard Follow-up';
          newTaskData = { leadId, description: `Follow up with ${lead.name} (Day ${day})`, dueDate: date, segment: newSegment };
      }

      const finalTaskData = { ...newTaskData, completed: false };
      const taskRef = doc(collection(db, "tasks"));
      batch.set(taskRef, finalTaskData);

      // 3. Update Lead
      const leadRef = doc(db, "leads", leadId);
      batch.update(leadRef, { score: updatedLeadScore, segment: newSegment, status: 'Active' });
      
      await batch.commit();

      // 4. Update State
      const newInteractionForState: Interaction = { ...newInteractionData, id: interactionRef.id, date: new Date() };
      const newTaskForState: Task = { ...finalTaskData, id: taskRef.id };

      setLeads(prevLeads =>
        prevLeads.map(l => (l.id === leadId ? { ...l, score: updatedLeadScore, segment: newSegment, status: 'Active' } : l))
      );
      setInteractions(prevInteractions => [newInteractionForState, ...prevInteractions]);
      setTasks(prevTasks => [...prevTasks.filter(t => t.leadId !== leadId), newTaskForState]); // remove old tasks for this lead and add new one.

      toast({
        title: "Interaction Logged!",
        description: `Lead score for ${lead.name} is now ${updatedLeadScore}. New task created.`,
      });

    } catch (error) {
        console.error("Failed to process interaction:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not log interaction due to an unexpected error.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [leads, toast, tasks]);

  const contextValue = useMemo(() => ({
      leads,
      interactions,
      tasks: tasks.filter(t => !t.completed),
      addLead,
      addInteraction,
      isLoading,
      getLeadResponsiveness,
      completeTask,
  }), [leads, interactions, tasks, addLead, addInteraction, isLoading, getLeadResponsiveness, completeTask]);

  return (
    <LeadsContext.Provider value={contextValue}>
      {children}
    </LeadsContext.Provider>
  );
};
