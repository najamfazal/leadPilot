'use client';

import React, { createContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { Lead, Interaction, LeadTrait, Task, Responsiveness } from '@/lib/types';
import { calculateLeadScore } from '@/ai/flows/automatic-scoring-algorithm';
import { useToast } from '@/hooks/use-toast';
import { add, differenceInHours } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';


interface LeadsContextType {
  leads: Lead[];
  interactions: Interaction[];
  tasks: Task[];
  addLead: (lead: Omit<Lead, 'id' | 'score' | 'createdAt'>) => void;
  addInteraction: (
    leadId: string,
    interactionData: Omit<Interaction, 'id' | 'leadId' | 'date' | 'interactionScore' | 'previousScore' | 'newScore'>
  ) => Promise<void>;
  isLoading: boolean;
  getLeadResponsiveness: (leadId: string) => Responsiveness;
}

export const LeadsContext = createContext<LeadsContextType>({
  leads: [],
  interactions: [],
  tasks: [],
  addLead: () => {},
  addInteraction: async () => {},
  isLoading: false,
  getLeadResponsiveness: () => 'cold',
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
      const leadsData = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), createdAt: (doc.data().createdAt as Timestamp).toDate() })) as Lead[];
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
        .sort((a,b) => b.date.getTime() - a.date.getTime())[0];
    if (!lastInteraction) return 'cold';

    const hours = differenceInHours(new Date(), lastInteraction.date);
    if (hours < 24) return 'hot';
    if (hours < 72) return 'warm';
    return 'cold';
  }, [interactions]);

  const addLead = useCallback(async (leadData: Omit<Lead, 'id' | 'score' | 'createdAt'>) => {
    setIsLoading(true);
    try {
      const newLeadData = {
        ...leadData,
        score: 50,
        createdAt: new Date(),
      };
      const docRef = await addDoc(collection(db, "leads"), newLeadData);
      const newLead: Lead = { ...newLeadData, id: docRef.id };
      setLeads(prevLeads => [newLead, ...prevLeads]);
      toast({
          title: 'Lead Added Successfully!',
          description: `${newLead.name} has been added to your pipeline.`,
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
    const lastFollowUpDayMatch = [...followUpTasks].sort((a,b) => b.dueDate.getTime() - a.dueDate.getTime())[0].description.match(/Day (\d+)/);
    const lastFollowUpDay = lastFollowUpDayMatch ? parseInt(lastFollowUpDayMatch[1]) : 0;
    const nextIndex = sequence.indexOf(lastFollowUpDay) + 1;

    if (nextIndex < sequence.length) {
        const nextDay = sequence[nextIndex];
        const daysToAdd = nextDay - (lastFollowUpDay || 0);
        return { day: nextDay, date: add(new Date(), { days: daysToAdd }) };
    }
    // If sequence is finished, schedule for 7 days later
    return { day: 7, date: add(new Date(), { days: 7 }) };
  }


  const addInteraction = useCallback(async (
    leadId: string,
    interactionData: { intent: "High" | "Medium" | "Low", interest: "High" | "Medium" | "Low", action: "None" | "Demo Scheduled" | "Visit Scheduled" | "Payment Link Sent", traits: LeadTrait[] }
  ) => {
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

      const newInteractionData = {
        ...interactionData,
        leadId,
        date: new Date(),
        interactionScore,
        previousScore: lead.score,
        newScore: updatedLeadScore,
      };

      const interactionRef = doc(collection(db, "interactions"));
      batch.set(interactionRef, newInteractionData);
      
      const leadRef = doc(db, "leads", leadId);
      batch.update(leadRef, { score: updatedLeadScore });

      const { day, date } = getNextFollowUpDay(leadId);
      const newTaskData = {
        leadId,
        description: `Follow up with ${lead.name} (Day ${day})`,
        dueDate: date,
        completed: false,
      };
      const taskRef = doc(collection(db, "tasks"));
      batch.set(taskRef, newTaskData);
      
      await batch.commit();

      const newInteraction: Interaction = { ...newInteractionData, id: interactionRef.id };
      const newTask: Task = { ...newTaskData, id: taskRef.id };

      setLeads(prevLeads =>
        prevLeads.map(l => (l.id === leadId ? { ...l, score: updatedLeadScore } : l))
      );
      setInteractions(prevInteractions => [newInteraction, ...prevInteractions]);
      setTasks(prevTasks => [...prevTasks, newTask]);

      toast({
        title: "Interaction Logged!",
        description: `Lead score for ${lead.name} is now ${updatedLeadScore}. A new task has been created.`,
      });

    } catch (error) {
        console.error("Failed to calculate lead score or update database:", error);
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
      getLeadResponsiveness
  }), [leads, interactions, tasks, addLead, addInteraction, isLoading, getLeadResponsiveness]);

  return (
    <LeadsContext.Provider value={contextValue}>
      {children}
    </LeadsContext.Provider>
  );
};
