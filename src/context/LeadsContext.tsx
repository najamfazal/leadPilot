'use client';

import React, { createContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { Lead, Interaction, Task, Responsiveness, LeadSegment, InteractionFormData, LeadInterest, LeadIntent, Engagement, OutcomeType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { add, isPast } from 'date-fns';
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
      const leadsQuery = query(collection(db, "leads"));
      const leadsSnapshot = await getDocs(leadsQuery);
      const leadsData = leadsSnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
              id: doc.id, 
              ...data, 
              createdAt: (data.createdAt as Timestamp)?.toDate(),
              lastInteractionAt: (data.lastInteractionAt as Timestamp)?.toDate()
          } as Lead;
      });

      // Sort leads by last interaction date
      leadsData.sort((a, b) => {
        const dateA = a.lastInteractionAt ? (a.lastInteractionAt as Date).getTime() : 0;
        const dateB = b.lastInteractionAt ? (b.lastInteractionAt as Date).getTime() : 0;
        return dateB - dateA;
      });
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
    const lead = leads.find(l => l.id === leadId);
    if (!lead || !lead.lastInteractionAt) return 'cold';

    const hours = (new Date().getTime() - (lead.lastInteractionAt as Date).getTime()) / (1000 * 60 * 60);
    if (hours < 24) return 'hot';
    if (hours < 72) return 'warm';
    return 'cold';
  }, [leads]);
  
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
        status: 'Active' as const,
        segment: 'Standard Follow-up' as const,
        lastInteractionAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, "leads"), newLeadData);
      
      const newLeadForState: Lead = { 
          ...newLeadData, 
          id: docRef.id, 
          createdAt: new Date(),
          lastInteractionAt: new Date()
      };
      
      setLeads(prevLeads => [newLeadForState, ...prevLeads]);
      toast({
          title: 'Lead Added Successfully!',
          description: `${newLeadData.name} has been added to your pipeline.`,
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
        return { day: nextDay, date: add(new Date(), { days: nextDay }) };
    }
    return { day: 7, date: add(new Date(), { days: 7 }) };
  }

  const calculateInteractionScore = (interest: LeadInterest, intent: LeadIntent, engagement: Engagement) => {
    let score = 0;
    const interestScores = { 'Love': 20, 'High': 10, 'Unsure': -5, 'Low': -15, 'Hate': -30 };
    const intentScores = { 'High': 25, 'Neutral': 0, 'Low': -20 };
    const engagementScores = { 'Positive': 10, 'Neutral': -5, 'Negative': -15 };
    score += interestScores[interest] || 0;
    score += intentScores[intent] || 0;
    score += engagementScores[engagement] || 0;
    return score;
  }

  const addInteraction = useCallback(async (leadId: string, interactionData: InteractionFormData) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    setIsLoading(true);
    try {
      const interactionScore = calculateInteractionScore(interactionData.interest, interactionData.intent, interactionData.engagement);
      const updatedLeadScore = Math.max(0, Math.min(100, lead.score + interactionScore));
      
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
      let newSegment: LeadSegment = lead.segment;
      let newTaskData: Omit<Task, 'id' | 'completed'> | null = null;
      const outcome = interactionData.outcome;

      if (outcome === 'Demo' || outcome === 'Visit') {
        newSegment = 'Awaiting Event';
        newTaskData = { leadId, description: `🗓️ ${outcome} with ${lead.name}`, dueDate: new Date(interactionData.outcomeDetail!), segment: newSegment };
      } else if (outcome === 'PayLink') {
        newSegment = 'Payment Pending';
        newTaskData = { leadId, description: `💰 Close ${lead.name}: Follow up on payment link`, dueDate: add(new Date(), { days: 1 }), segment: newSegment };
      } else if (outcome === 'FollowLater') {
        newSegment = 'Standard Follow-up';
        newTaskData = { leadId, description: `Follow up with ${lead.name}`, dueDate: new Date(interactionData.outcomeDetail!), segment: newSegment };
      } else if (outcome === 'NeedsInfo') {
        newSegment = 'Action Required';
        newTaskData = { leadId, description: `🛠️ ${interactionData.outcomeDetail}`, dueDate: new Date(), segment: newSegment };
      } else if (
        (interactionData.interest === 'Unsure' || interactionData.interest === 'High') &&
        (interactionData.intent === 'Neutral' || interactionData.intent === 'Low')
      ) {
        newSegment = 'Needs Nurturing';
        newTaskData = { leadId, description: `Nurture ${lead.name}: Send value content`, dueDate: add(new Date(), { days: 2 }), segment: newSegment };
      } else {
        const { day, date } = getNextFollowUpDay(leadId);
        newSegment = 'Standard Follow-up';
        newTaskData = { leadId, description: `Follow up with ${lead.name} (Day ${day})`, dueDate: date, segment: newSegment };
      }

      if (newTaskData) {
        const finalTaskData = { ...newTaskData, completed: false };
        const taskRef = doc(collection(db, "tasks"));
        batch.set(taskRef, finalTaskData);

         // Invalidate old tasks for this lead
        const oldTasksQuery = query(collection(db, "tasks"), where("leadId", "==", leadId), where("completed", "==", false));
        const oldTasksSnapshot = await getDocs(oldTasksQuery);
        oldTasksSnapshot.forEach(doc => {
            batch.update(doc.ref, { completed: true });
        });
      }
      
      // 3. Update Lead
      const leadRef = doc(db, "leads", leadId);
      batch.update(leadRef, { 
        score: updatedLeadScore, 
        segment: newSegment, 
        status: 'Active', 
        lastInteractionAt: serverTimestamp() 
      });
      
      await batch.commit();

      // 4. Update State
      await fetchData(); // Refetch all data to ensure consistency

      toast({
        title: "Interaction Logged!",
        description: `Lead score for ${lead.name} is now ${updatedLeadScore}.`,
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
  }, [leads, toast, tasks, fetchData]);

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
