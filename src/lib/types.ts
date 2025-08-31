import { Timestamp } from 'firebase/firestore';

export const LEAD_STATUSES = ['Active', 'Archived'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SEGMENTS = [
    'Standard Follow-up',
    'Awaiting Event',
    'Action Required',
    'Needs Nurturing',
    'Payment Pending'
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
  lastInteractionAt?: Date | Timestamp;
  traits: string[];
  note: string;
};

export const LEAD_INTEREST_OPTIONS = ['Love', 'High', 'Unsure', 'Low', 'Hate'] as const;
export type LeadInterest = typeof LEAD_INTEREST_OPTIONS[number];

export const LEAD_INTENT_OPTIONS = ['High', 'Neutral', 'Low'] as const;
export type LeadIntent = typeof LEAD_INTENT_OPTIONS[number];

export const ENGAGEMENT_OPTIONS = ['Positive', 'Neutral', 'Negative'] as const;
export type Engagement = typeof ENGAGEMENT_OPTIONS[number];

export const OUTCOME_TYPES = ['Demo', 'Visit', 'PayLink', 'FollowLater', 'NeedsInfo'] as const;
export type OutcomeType = typeof OUTCOME_TYPES[number];

export type Interaction = {
  id: string;
  leadId: string;
  date: Date | Timestamp;
  interest: LeadInterest;
  intent: LeadIntent;
  engagement: Engagement;
  outcome?: OutcomeType;
  outcomeDetail?: string; // For date from FollowLater or text from NeedsInfo
  interactionScore: number;
  previousScore: number;
  newScore: number;
  type: 'Engagement' | 'Touchpoint' | 'Creation'; // Added to distinguish log types
  notes?: string;
};

export interface InteractionFormData extends Omit<Interaction, 'id' | 'leadId' | 'date' | 'interactionScore' | 'previousScore' | 'newScore' | 'type' | 'notes'> {
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

export const LEAD_TRAITS_OPTIONS = [
  "Price Sensitive", "Pays for Value", "Needs Hand-holding", "Self-starter", 
  "Referral Source", "Influencer", "Competitor Info", "Past Client"
];
