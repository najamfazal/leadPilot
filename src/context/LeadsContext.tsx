'use client';

import React, { createContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { Lead, Interaction, LeadTrait, Task, Responsiveness } from '@/lib/types';
import { calculateLeadScore } from '@/ai/flows/automatic-scoring-algorithm';
import { useToast } from '@/hooks/use-toast';
import { add, differenceInHours } from 'date-fns';

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

const initialLeads: Lead[] = [
  { id: '1', name: 'Alice Johnson', phone: '123-456-7890', course: 'Web Development', score: 85, createdAt: new Date() },
  { id: '2', name: 'Bob Williams', phone: '234-567-8901', course: 'Data Science', score: 35, createdAt: new Date() },
  { id: '3', name: 'Charlie Brown', phone: '345-678-9012', course: 'UX Design', score: 60, createdAt: new Date() },
];

const initialInteractions: Interaction[] = [
    { id: '101', leadId: '1', date: new Date(Date.now() - 8 * 60 * 60 * 1000), intent: 'High', interest: 'High', action: 'Demo Scheduled', traits: ['Pays for Value'], interactionScore: 60, previousScore: 25, newScore: 85},
    { id: '102', leadId: '2', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), intent: 'Low', interest: 'Low', action: 'None', traits: ['Browser-not-Buyer'], interactionScore: -45, previousScore: 80, newScore: 35},
    { id: '103', leadId: '3', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), intent: 'Medium', interest: 'Medium', action: 'None', traits: [], interactionScore: 10, previousScore: 50, newScore: 60},
];

const initialTasks: Task[] = [
    { id: '201', leadId: '1', description: 'Follow up with Alice Johnson (Day 1)', dueDate: add(new Date(), {days: 1}), completed: false },
    { id: '202', leadId: '2', description: 'Follow up with Bob Williams (Day 3)', dueDate: new Date(), completed: false },
]

export const LeadsProvider = ({ children }: { children: ReactNode }) => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [interactions, setInteractions] = useState<Interaction[]>(initialInteractions);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

  const addLead = useCallback((leadData: Omit<Lead, 'id' | 'score' | 'createdAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: new Date().toISOString(),
      score: 50,
      createdAt: new Date(),
    };
    setLeads(prevLeads => [newLead, ...prevLeads]);
    toast({
        title: 'Lead Added Successfully!',
        description: `${newLead.name} has been added to your pipeline.`,
    });
  }, [toast]);

  const getNextFollowUpDay = (leadId: string): { day: number, date: Date } => {
    const followUpTasks = tasks.filter(t => t.leadId === leadId && t.description.includes('Follow up'));
    const sequence = [1, 3, 5, 7];
    if (followUpTasks.length === 0) {
        return { day: 1, date: add(new Date(), { days: 1 }) };
    }
    const lastFollowUpDayMatch = followUpTasks[followUpTasks.length - 1].description.match(/Day (\d+)/);
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

      const newInteraction: Interaction = {
        ...interactionData,
        id: new Date().toISOString(),
        leadId,
        date: new Date(),
        interactionScore,
        previousScore: lead.score,
        newScore: updatedLeadScore,
      };

      setLeads(prevLeads =>
        prevLeads.map(l => (l.id === leadId ? { ...l, score: updatedLeadScore } : l))
      );
      setInteractions(prevInteractions => [newInteraction, ...prevInteractions]);

      const { day, date } = getNextFollowUpDay(leadId);
      const newTask: Task = {
        id: new Date().toISOString(),
        leadId,
        description: `Follow up with ${lead.name} (Day ${day})`,
        dueDate: date,
        completed: false,
      };
      setTasks(prevTasks => [...prevTasks, newTask]);


      toast({
        title: "Interaction Logged!",
        description: `Lead score for ${lead.name} is now ${updatedLeadScore}. A new task has been created.`,
      });

    } catch (error) {
        console.error("Failed to calculate lead score:", error);
        toast({
            variant: "destructive",
            title: "Scoring Error",
            description: "Could not update lead score due to an AI error.",
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
