
'use client';

import React, { createContext, useState, useCallback, ReactNode, useMemo, useEffect } from 'react';
import { Lead, Interaction, Task, Responsiveness, LeadSegment, InteractionFormData, Interaction as InteractionType, LeadStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { add, subDays } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, Timestamp, orderBy, doc, updateDoc, writeBatch, serverTimestamp, runTransaction, getDoc, setDoc } from 'firebase/firestore';

interface LeadsContextType {
  leads: Lead[];
  interactions: Interaction[];
  tasks: Task[];
  addLead: (lead: Omit<Lead, 'id' | 'score' | 'createdAt' | 'status' | 'segment' | 'lastInteractionAt' | 'insights'>) => void;
  addInteraction: (leadId: string, interactionData: InteractionFormData, type: 'Engagement' | 'Touchpoint' | 'Creation', notes?: string) => Promise<void>;
  isLoading: boolean;
  getLeadResponsiveness: (leadId: string) => Responsiveness;
  completeTask: (taskId: string, leadId: string, isDay7FollowUp: boolean, isTouchpoint: boolean) => Promise<void>;
  manualSeedDatabase: () => Promise<void>;
  updateLeadDetails: (leadId: string, details: Partial<Pick<Lead, 'note' | 'traits' | 'insights'>>) => Promise<void>;
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
  manualSeedDatabase: async () => {},
  updateLeadDetails: async () => {},
});

const seedDatabase = async () => {
    return runTransaction(db, async (transaction) => {
        const now = new Date();

        const leadsToCreate = [
            { id: 'lead1', name: 'Alex Johnson', phone: '111-222-3333', course: 'UX Design', score: 85, status: 'Active' as const, segment: 'Standard Follow-up' as const, lastInteractionAt: subDays(now, 1), traits: ['Pays for Value'], insights: ['Mentioned they are evaluating two other bootcamps.'], note: ''},
            { id: 'lead2', name: 'Brenda Smith', phone: '222-333-4444', course: 'Data Science', score: 95, status: 'Active' as const, segment: 'Awaiting Event' as const, lastInteractionAt: subDays(now, 2), traits: ['Self-starter'], insights: [], note: '' },
            { id: 'lead3', name: 'Charlie Brown', phone: '333-444-5555', course: 'Web Development', score: 60, status: 'Active' as const, segment: 'Needs Nurturing' as const, lastInteractionAt: subDays(now, 4), traits: ['Price Sensitive', 'Needs Hand-holding'], insights: ['Concerned about the total cost.'], note: '' },
            { id: 'lead4', name: 'Diana Prince', phone: '444-555-6666', course: 'AI Engineering', score: 70, status: 'Active' as const, segment: 'Action Required' as const, lastInteractionAt: subDays(now, 0), traits: [], insights: [], note: '' },
            { id: 'lead5', name: 'Ethan Hunt', phone: '555-666-7777', course: 'Cybersecurity', score: 90, status: 'Active' as const, segment: 'Payment Pending' as const, lastInteractionAt: subDays(now, 1), traits: [], insights: ['Ready to sign up, just needs the payment link.'], note: '' },
            { id: 'lead6', name: 'Fiona Glenanne', phone: '666-777-8888', course: 'UX Design', score: 25, status: 'Archived' as const, segment: 'Standard Follow-up' as const, lastInteractionAt: subDays(now, 10), traits: [], insights: ['Went with a competitor.'], note: '' },
            { id: 'lead7', name: 'George Costanza', phone: '777-888-9999', course: 'Product Management', score: 55, status: 'Active' as const, segment: 'Standard Follow-up' as const, lastInteractionAt: subDays(now, 6), traits: [], insights: [], note: '' }
        ];

        const tasksToCreate = [
            { leadId: 'lead1', description: 'Follow up with Alex Johnson (Day 3)', dueDate: add(now, { days: 2 }), segment: 'Standard Follow-up' as const, completed: false },
            { leadId: 'lead2', description: '🗓️ Demo with Brenda Smith', dueDate: add(now, { days: 3 }), segment: 'Awaiting Event' as const, completed: false },
            { leadId: 'lead3', description: 'Nurture Charlie Brown: Send value content', dueDate: add(now, { days: 1 }), segment: 'Needs Nurturing' as const, completed: false },
            { leadId: 'lead4', description: '🛠️ Send course brochure', dueDate: now, segment: 'Action Required' as const, completed: false },
            { leadId: 'lead5', description: '💰 Close Ethan Hunt: Follow up on payment link', dueDate: add(now, { days: 1 }), segment: 'Payment Pending' as const, completed: false },
            { leadId: 'lead7', description: 'Follow up with George Costanza (Day 7)', dueDate: add(now, { days: 1 }), segment: 'Standard Follow-up' as const, completed: false }
        ];
        
        const interactionsToCreate: Omit<Interaction, 'id'>[] = [
            { leadId: 'lead1', date: subDays(now, 1), type: 'Engagement', interest: 'High', intent: 'High', engagement: 'Positive', interactionScore: 55, previousScore: 30, newScore: 85},
            { leadId: 'lead2', date: subDays(now, 2), type: 'Engagement', interest: 'Love', intent: 'High', engagement: 'Positive', interactionScore: 55, previousScore: 40, newScore: 95, outcome: 'Demo', outcomeDetail: add(now, {days: 3}).toISOString()},
            { leadId: 'lead3', date: subDays(now, 4), type: 'Engagement', interest: 'Unsure', intent: 'Neutral', engagement: 'Neutral', interactionScore: -10, previousScore: 70, newScore: 60},
            { leadId: 'lead4', date: now, type: 'Engagement', interest: 'High', intent: 'Neutral', engagement: 'Positive', interactionScore: 5, previousScore: 65, newScore: 70, outcome: 'NeedsInfo', outcomeDetail: 'Send course brochure'},
            { leadId: 'lead5', date: subDays(now, 1), type: 'Engagement', interest: 'Love', intent: 'High', engagement: 'Positive', interactionScore: 55, previousScore: 35, newScore: 90, outcome: 'PayLink'},
            { leadId: 'lead6', date: subDays(now, 10), type: 'Engagement', interest: 'Low', intent: 'Low', engagement: 'Negative', interactionScore: -50, previousScore: 75, newScore: 25},
            { leadId: 'lead7', date: subDays(now, 6), type: 'Touchpoint', interest: 'Unsure', intent: 'Neutral', engagement: 'Neutral', interactionScore: 0, previousScore: 55, newScore: 55, notes: 'Day 5 follow-up sent.'},
        ];

        for (const leadData of leadsToCreate) {
            const leadRef = doc(db, "leads", leadData.id);
            transaction.set(leadRef, { ...leadData, createdAt: serverTimestamp() });
        }

        for (const taskData of tasksToCreate) {
            const taskRef = doc(collection(db, "tasks"));
            transaction.set(taskRef, taskData);
        }

        for (const interactionData of interactionsToCreate) {
            const interactionRef = doc(collection(db, "interactions"));
            transaction.set(interactionRef, interactionData);
        }
    });
}


export const LeadsProvider = ({ children }: { children: ReactNode }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
        const leadsColl = collection(db, "leads");
        const leadsQuery = query(leadsColl, orderBy('lastInteractionAt', 'desc'));
        const leadsSnapshot = await getDocs(leadsQuery);
        const leadsData = leadsSnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                ...data, 
                createdAt: (data.createdAt as Timestamp)?.toDate(),
                lastInteractionAt: (data.lastInteractionAt as Timestamp)?.toDate(),
                note: data.note || '',
                traits: data.traits || [],
                insights: data.insights || [],
            } as Lead;
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

  const manualSeedDatabase = useCallback(async () => {
    setIsLoading(true);
    try {
        await seedDatabase();
        await fetchData(); // Fetch fresh data after seeding
        toast({
            title: "Success!",
            description: "Dummy data has been added to your CRM.",
        });
    } catch (error) {
        console.error("Error seeding database:", error);
        toast({
            variant: "destructive",
            title: "Seeding Failed",
            description: "Could not add dummy data.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [fetchData, toast]);

  const getLeadResponsiveness = useCallback((leadId: string): Responsiveness => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || !lead.lastInteractionAt) return 'cold';

    const hours = (new Date().getTime() - (lead.lastInteractionAt as Date).getTime()) / (1000 * 60 * 60);
    if (hours < 24) return 'hot';
    if (hours < 72) return 'warm';
    return 'cold';
  }, [leads]);
  
  const getNextFollowUpDay = (leadId: string): { day: number, date: Date } => {
    const leadInteractions = interactions.filter(i => i.leadId === leadId).sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime());
    const followUpTasks = leadInteractions.filter(i => i.notes?.includes('Follow up'));
    const sequence = [1, 3, 5, 7];
    if (followUpTasks.length === 0) {
        return { day: 1, date: add(new Date(), { days: 1 }) };
    }
    const lastFollowUpNote = followUpTasks[0].notes;
    const lastFollowUpDayMatch = lastFollowUpNote?.match(/Day (\d+)/);
    const lastFollowUpDay = lastFollowUpDayMatch ? parseInt(lastFollowUpDayMatch[1]) : 0;
    const nextIndex = sequence.indexOf(lastFollowUpDay) + 1;

    if (nextIndex < sequence.length) {
        const nextDay = sequence[nextIndex];
        return { day: nextDay, date: add(new Date(), { days: nextDay }) };
    }
    return { day: 7, date: add(new Date(), { days: 7 }) };
  }

  const calculateInteractionScore = (interest: InteractionType['interest'], intent: InteractionType['intent'], engagement: InteractionType['engagement']) => {
    let score = 0;
    const interestScores = { 'Love': 20, 'High': 10, 'Unsure': -5, 'Low': -15, 'Hate': -30 };
    const intentScores = { 'High': 25, 'Neutral': 0, 'Low': -20 };
    const engagementScores = { 'Positive': 10, 'Neutral': -5, 'Negative': -15 };
    score += interestScores[interest] || 0;
    score += intentScores[intent] || 0;
    score += engagementScores[engagement] || 0;
    return score;
  }
  
  const addInteraction = useCallback(async (leadId: string, interactionData: InteractionFormData, type: 'Engagement' | 'Touchpoint' | 'Creation', notes?: string) => {
    setIsLoading(true);
    try {
        const leadRef = doc(db, "leads", leadId);
        const leadDoc = await getDoc(leadRef);
        if (!leadDoc.exists()) throw new Error("Lead not found!");

        const currentLead = { id: leadDoc.id, ...leadDoc.data() } as Lead;
        let interactionScore = 0;
        let updatedLeadScore = currentLead.score;

        // --- Start Local State Update ---
        const now = new Date();
        let newSegment: LeadSegment = currentLead.segment;
        let newTask: Task | null = null;
        const newInteractionId = doc(collection(db, "interactions")).id;
        const newTaskId = doc(collection(db, "tasks")).id;

        if (type === 'Engagement') {
            interactionScore = calculateInteractionScore(interactionData.interest, interactionData.intent, interactionData.engagement);
            updatedLeadScore = Math.max(0, Math.min(100, currentLead.score + interactionScore));
            const outcome = interactionData.outcome;

            if (outcome === 'Demo' || outcome === 'Visit') {
                newSegment = 'Awaiting Event';
                newTask = { id: newTaskId, leadId, description: `🗓️ ${outcome} with ${currentLead.name}`, dueDate: new Date(interactionData.outcomeDetail!), segment: newSegment, completed: false };
            } else if (outcome === 'PayLink') {
                newSegment = 'Payment Pending';
                newTask = { id: newTaskId, leadId, description: `💰 Close ${currentLead.name}: Follow up on payment link`, dueDate: add(now, { days: 1 }), segment: newSegment, completed: false };
            } else if (outcome === 'FollowLater') {
                newSegment = 'Standard Follow-up';
                newTask = { id: newTaskId, leadId, description: `Follow up with ${currentLead.name}`, dueDate: new Date(interactionData.outcomeDetail!), segment: newSegment, completed: false };
            } else if (outcome === 'NeedsInfo') {
                newSegment = 'Action Required';
                newTask = { id: newTaskId, leadId, description: `🛠️ ${interactionData.outcomeDetail}`, dueDate: now, segment: newSegment, completed: false };
            } else if (
                (interactionData.interest === 'Unsure' || interactionData.interest === 'High') &&
                (interactionData.intent === 'Neutral' || interactionData.intent === 'Low')
            ) {
                newSegment = 'Needs Nurturing';
                newTask = { id: newTaskId, leadId, description: `Nurture ${currentLead.name}: Send value content`, dueDate: add(now, { days: 2 }), segment: newSegment, completed: false };
            } else {
                const { day, date } = getNextFollowUpDay(leadId);
                newSegment = 'Standard Follow-up';
                newTask = { id: newTaskId, leadId, description: `Follow up with ${currentLead.name} (Day ${day})`, dueDate: date, segment: newSegment, completed: false };
            }
        } else if (type === 'Touchpoint') { 
            updatedLeadScore = Math.max(0, Math.min(100, currentLead.score - 2)); // Score decay
            const { day, date } = getNextFollowUpDay(leadId);
            newSegment = 'Standard Follow-up';
            newTask = { id: newTaskId, leadId, description: `Follow up with ${currentLead.name} (Day ${day})`, dueDate: date, segment: newSegment, completed: false };
        } else { // Creation
             const { day, date } = getNextFollowUpDay(leadId);
             newSegment = 'Standard Follow-up';
             newTask = { id: newTaskId, leadId, description: `Follow up with ${currentLead.name} (Day ${day})`, dueDate: date, segment: newSegment, completed: false };
        }

        const newInteraction: Interaction = {
            id: newInteractionId,
            ...interactionData,
            leadId,
            date: now,
            interactionScore,
            previousScore: currentLead.score,
            newScore: updatedLeadScore,
            type,
            notes: notes || '',
        };
        
        // --- Update React State Immediately ---
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, score: updatedLeadScore, segment: newSegment, status: 'Active' as LeadStatus, lastInteractionAt: now } : l).sort((a, b) => (b.lastInteractionAt as Date).getTime() - (a.lastInteractionAt as Date).getTime()));
        setInteractions(prev => [...prev, newInteraction]);
        setTasks(prev => {
            const otherTasks = prev.filter(t => t.leadId !== leadId);
            return newTask ? [...otherTasks, newTask] : otherTasks;
        });
        
        // --- Persist to Firestore in the Background ---
        const batch = writeBatch(db);
        batch.update(leadRef, { score: updatedLeadScore, segment: newSegment, status: 'Active', lastInteractionAt: serverTimestamp() });
        batch.set(doc(db, "interactions", newInteractionId), { ...newInteraction, date: serverTimestamp() });
        
        const existingTaskQuery = query(collection(db, "tasks"), where("leadId", "==", leadId), where("completed", "==", false));
        const existingTaskSnapshot = await getDocs(existingTaskQuery);
        existingTaskSnapshot.forEach(taskDoc => {
            batch.update(taskDoc.ref, { completed: true });
        });

        if(newTask) {
            batch.set(doc(db, "tasks", newTaskId), { ...newTask, dueDate: Timestamp.fromDate(newTask.dueDate as Date) });
        }
        
        await batch.commit();
      
      if(type !== 'Creation') {
        toast({
            title: "Interaction Logged!",
            description: `Workflow updated successfully.`,
        });
      }

    } catch (error) {
        console.error("Failed to process interaction:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not log interaction due to an unexpected error.",
        });
        await fetchData(); // Rollback local state on error
    } finally {
        setIsLoading(false);
    }
  }, [toast, interactions, getNextFollowUpDay, fetchData]);


  const addLead = useCallback(async (leadData: Omit<Lead, 'id' | 'score' | 'createdAt' | 'status' | 'segment' | 'lastInteractionAt' | 'insights'>) => {
    setIsLoading(true);
    const newLeadId = doc(collection(db, "leads")).id;
    const now = new Date();
    try {
        const newLead: Lead = {
            id: newLeadId,
            ...leadData,
            score: 50,
            createdAt: now,
            status: 'Active',
            segment: 'Standard Follow-up',
            lastInteractionAt: now,
            note: leadData.note || '',
            traits: leadData.traits || [],
            insights: [],
        };

        setLeads(prev => [...prev, newLead].sort((a,b) => (b.lastInteractionAt as Date).getTime() - (a.lastInteractionAt as Date).getTime()));
        
        const leadDocRef = doc(db, "leads", newLeadId);
        await setDoc(leadDocRef, { ...newLead, createdAt: serverTimestamp(), lastInteractionAt: serverTimestamp() });
        
        await addInteraction(newLeadId, {} as InteractionFormData, 'Creation', 'Lead Created');
      
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
       setLeads(prev => prev.filter(l => l.id !== newLeadId));
    } finally {
        setIsLoading(false);
    }
  }, [toast, addInteraction]);

  const completeTask = useCallback(async (taskId: string, leadId: string, isDay7FollowUp: boolean, isTouchpoint: boolean) => {
    if (isTouchpoint) {
      const taskDescription = tasks.find(t => t.id === taskId)?.description || 'Task';
      const touchpointNotes = `${taskDescription} sent.`;
      await addInteraction(leadId, {} as InteractionFormData, 'Touchpoint', touchpointNotes);
    } else {
        setIsLoading(true);
        setTasks(prev => prev.filter(t => t.id !== taskId));
        if (isDay7FollowUp) {
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'Archived' as LeadStatus } : l));
        }
        try {
            const batch = writeBatch(db);
            const taskRef = doc(db, "tasks", taskId);
            batch.update(taskRef, { completed: true });

            if (isDay7FollowUp) {
                const leadRef = doc(db, "leads", leadId);
                batch.update(leadRef, { status: "Archived" });
            }
            await batch.commit();
        } catch(error) {
            console.error("Error completing task:", error);
            await fetchData(); // Rollback
        } finally {
            setIsLoading(false);
        }
    }
  }, [tasks, addInteraction, fetchData]);

  const updateLeadDetails = useCallback(async (leadId: string, details: Partial<Pick<Lead, 'note' | 'traits' | 'insights'>>) => {
    const originalLeads = leads;
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...details } : l));
    
    try {
        const leadRef = doc(db, "leads", leadId);
        await updateDoc(leadRef, details);
        toast({
            title: "Lead Updated",
            description: "Details have been saved.",
        });
    } catch (error) {
        console.error("Error updating lead details:", error);
        setLeads(originalLeads); // Rollback on error
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not save lead details.",
        });
    }
  }, [toast, leads]);

  const contextValue = useMemo(() => ({
      leads,
      interactions,
      tasks: tasks.filter(t => !t.completed),
      addLead,
      addInteraction,
      isLoading,
      getLeadResponsiveness,
      completeTask,
      manualSeedDatabase,
      updateLeadDetails
  }), [leads, interactions, tasks, addLead, addInteraction, isLoading, getLeadResponsiveness, completeTask, manualSeedDatabase, updateLeadDetails]);

  return (
    <LeadsContext.Provider value={contextValue}>
      {children}
    </LeadsContext.Provider>
  );
};

    