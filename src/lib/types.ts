export type Lead = {
  id: string;
  name: string;
  phone: string;
  course: string;
  score: number;
  createdAt: Date;
};

export type Interaction = {
  id: string;
  leadId: string;
  date: Date;
  intent: 'High' | 'Medium' | 'Low';
  interest: 'High' | 'Medium' | 'Low';
  action: 'None' | 'Demo Scheduled' | 'Visit Scheduled' | 'Payment Link Sent';
  traits: LeadTrait[];
  interactionScore: number;
  previousScore: number;
  newScore: number;
};

export const LEAD_TRAITS = [
  'Haggling',
  'Price Sensitive',
  'Time Constraint',
  'Pays for Value',
  'Browser-not-Buyer',
] as const;

export type LeadTrait = (typeof LEAD_TRAITS)[number];

export const LEAD_INTENT_OPTIONS: Interaction['intent'][] = ['High', 'Medium', 'Low'];
export const LEAD_INTEREST_OPTIONS: Interaction['interest'][] = ['High', 'Medium', 'Low'];
export const ACTION_COMMITTED_OPTIONS: Interaction['action'][] = ['None', 'Demo Scheduled', 'Visit Scheduled', 'Payment Link Sent'];
