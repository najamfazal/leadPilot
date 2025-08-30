'use client';

import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { Lead, Interaction, LeadTrait } from '@/lib/types';
import { calculateLeadScore } from '@/ai/flows/automatic-scoring-algorithm';
import { useToast } from '@/hooks/use-toast';

interface LeadsContextType {
  leads: Lead[];
  interactions: Interaction[];
  addLead: (lead: Omit<Lead, 'id' | 'score' | 'createdAt'>) => void;
  addInteraction: (
    leadId: string,
    interactionData: Omit<Interaction, 'id' | 'leadId' | 'date' | 'interactionScore' | 'previousScore' | 'newScore'>
  ) => Promise<void>;
  isLoading: boolean;
}

export const LeadsContext = createContext<LeadsContextType>({
  leads: [],
  interactions: [],
  addLead: () => {},
  addInteraction: async () => {},
  isLoading: false,
});

const initialLeads: Lead[] = [
  { id: '1', name: 'Alice Johnson', phone: '123-456-7890', course: 'Web Development', score: 85, createdAt: new Date() },
  { id: '2', name: 'Bob Williams', phone: '234-567-8901', course: 'Data Science', score: 35, createdAt: new Date() },
  { id: '3', name: 'Charlie Brown', phone: '345-678-9012', course: 'UX Design', score: 60, createdAt: new Date() },
];

const initialInteractions: Interaction[] = [
    { id: '101', leadId: '1', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), intent: 'High', interest: 'High', action: 'Demo Scheduled', traits: ['Pays for Value'], interactionScore: 60, previousScore: 25, newScore: 85},
];

export const LeadsProvider = ({ children }: { children: ReactNode }) => {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [interactions, setInteractions] = useState<Interaction[]>(initialInteractions);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

      toast({
        title: "Interaction Logged!",
        description: `Lead score for ${lead.name} is now ${updatedLeadScore}.`,
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
  }, [leads, toast]);

  return (
    <LeadsContext.Provider value={{ leads, interactions, addLead, addInteraction, isLoading }}>
      {children}
    </LeadsContext.Provider>
  );
};
