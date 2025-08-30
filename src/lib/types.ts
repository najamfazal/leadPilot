import { Timestamp } from 'firebase/firestore';

export const LEAD_STATUSES = ['Active', 'Archived'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SEGMENTS = [
    'Standard Follow-up',
    'Awaiting Event',
    'Action Required',
    'On Hold',
    'Needs Persuasion',
    'Special Follow-up'
] as const;
export type LeadSegment = (typeof LEAD_SEGMENTS)[number];


export type Lead = {
  id: string;
  name: string;
  phone: string;
  course: string;
  score: number;
  createdAt: Date | Timestamp;
  status: LeadStatus;
  segment: LeadSegment;
};

export const BLOCKER_TYPE_OPTIONS = ['Circumstantial Blocker', 'Decisional Blocker'] as const;
export type BlockerType = (typeof BLOCKER_TYPE_OPTIONS)[number];

export type Interaction = {
  id: string;
  leadId: string;
  date: Date | Timestamp;
  intent: 'High' | 'Medium' | 'Low';
  interest: 'High' | 'Medium' | 'Low';
  action: 'None' | 'Demo Scheduled' | 'Visit Scheduled' | 'Payment Link Sent';
  traits: LeadTrait[];
  interactionScore: number;
  previousScore: number;
  newScore: number;
  specialFollowUpDate?: Date;
  preWorkRequired?: boolean;
  preWorkDescription?: string;
  blockerType?: BlockerType;
};

export interface InteractionFormData extends Omit<Interaction, 'id' | 'leadId' | 'date' | 'interactionScore' | 'previousScore' | 'newScore'> {
    // all fields are optional in the form, but will be processed in context
}

export type Task = {
  id: string;
  leadId: string;
  description: string;
  dueDate: Date | Timestamp;
  completed: boolean;
  segment: LeadSegment;
};

export type Responsiveness = 'hot' | 'warm' | 'cold';


export const LEAD_TRAITS = [
  'Haggling',
  'Price Sensitive',
  'Time Constraint',
  'Pays for Value',
  'Browser-not-Buyer',
] as const;

export type LeadTrait = (typeof LEAD_TRAITS)[number];

export const LEAD_INTENT_OPTIONS: readonly Interaction['intent'][] = ['High', 'Medium', 'Low'];
export const LEAD_INTEREST_OPTIONS: readonly Interaction['interest'][] = ['High', 'Medium', 'Low'];
export const ACTION_COMMITTED_OPTIONS: readonly Interaction['action'][] = ['None', 'Demo Scheduled', 'Visit Scheduled', 'Payment Link Sent'];
