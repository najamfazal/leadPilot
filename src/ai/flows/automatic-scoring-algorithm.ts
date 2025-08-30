'use server';

/**
 * @fileOverview An AI agent to calculate a lead score based on interaction details.
 *
 * - calculateLeadScore - A function that calculates the lead score.
 * - CalculateLeadScoreInput - The input type for the calculateLeadScore function.
 * - CalculateLeadScoreOutput - The return type for the calculateLeadScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateLeadScoreInputSchema = z.object({
  leadIntent: z.enum(['High', 'Medium', 'Low']).describe('The intent of the lead.'),
  leadInterest: z.enum(['High', 'Medium', 'Low']).describe('The interest level of the lead.'),
  actionCommitted: z
    .enum(['None', 'Demo Scheduled', 'Visit Scheduled', 'Payment Link Sent'])
    .describe('The action committed by the lead.'),
  leadTraits: z
    .array(z.enum(['Haggling', 'Price Sensitive', 'Time Constraint', 'Pays for Value', 'Browser-not-Buyer']))
    .describe('Traits exhibited by the lead.'),
  currentLeadScore: z.number().describe('The current lead score before this interaction.'),
});
export type CalculateLeadScoreInput = z.infer<typeof CalculateLeadScoreInputSchema>;

const CalculateLeadScoreOutputSchema = z.object({
  updatedLeadScore: z
    .number()
    .describe('The updated lead score after applying the interaction score, capped between 0 and 100.'),
  interactionScore: z.number().describe('The score calculated based on the interaction details.'),
});
export type CalculateLeadScoreOutput = z.infer<typeof CalculateLeadScoreOutputSchema>;

export async function calculateLeadScore(input: CalculateLeadScoreInput): Promise<CalculateLeadScoreOutput> {
  return calculateLeadScoreFlow(input);
}

const calculateLeadScorePrompt = ai.definePrompt({
  name: 'calculateLeadScorePrompt',
  input: {schema: CalculateLeadScoreInputSchema},
  output: {schema: CalculateLeadScoreOutputSchema},
  prompt: `You are an AI assistant specialized in calculating lead scores based on interaction details.

You will receive information about a lead interaction, including the lead's intent, interest, actions committed, and traits.
Based on this information, you will calculate an "interaction score" and update the lead's current score.

Here is the scoring logic:

For Lead Intent:
- High: +20 points
- Medium: +5 points
- Low: -15 points

For Lead Interest:
- High: +15 points
- Medium: +5 points
- Low: -10 points

For Action Committed:
- Payment Link Sent: +30 points
- Demo Scheduled or Visit Scheduled: +25 points
- None: +0 points

For Lead Traits:
- Pays for Value: +10 points
- Haggling or Price Sensitive: -5 points each
- Browser-not-Buyer: -20 points
- Time Constraint: 0 points

Calculate the interaction score and add it to the currentLeadScore. The final lead score must be between 0 and 100.

Lead Intent: {{{leadIntent}}}
Lead Interest: {{{leadInterest}}}
Action Committed: {{{actionCommitted}}}
Lead Traits: {{#each leadTraits}}{{{this}}} {{/each}}
Current Lead Score: {{{currentLeadScore}}}

Return the updatedLeadScore and the interactionScore.
`,
});

const calculateLeadScoreFlow = ai.defineFlow(
  {
    name: 'calculateLeadScoreFlow',
    inputSchema: CalculateLeadScoreInputSchema,
    outputSchema: CalculateLeadScoreOutputSchema,
  },
  async input => {
    let interactionScore = 0;

    switch (input.leadIntent) {
      case 'High':
        interactionScore += 20;
        break;
      case 'Medium':
        interactionScore += 5;
        break;
      case 'Low':
        interactionScore -= 15;
        break;
    }

    switch (input.leadInterest) {
      case 'High':
        interactionScore += 15;
        break;
      case 'Medium':
        interactionScore += 5;
        break;
      case 'Low':
        interactionScore -= 10;
        break;
    }

    switch (input.actionCommitted) {
      case 'Payment Link Sent':
        interactionScore += 30;
        break;
      case 'Demo Scheduled':
      case 'Visit Scheduled':
        interactionScore += 25;
        break;
      case 'None':
        interactionScore += 0;
        break;
    }

    if (input.leadTraits) {
      input.leadTraits.forEach(trait => {
        switch (trait) {
          case 'Pays for Value':
            interactionScore += 10;
            break;
          case 'Haggling':
          case 'Price Sensitive':
            interactionScore -= 5;
            break;
          case 'Browser-not-Buyer':
            interactionScore -= 20;
            break;
        }
      });
    }

    let updatedLeadScore = input.currentLeadScore + interactionScore;
    updatedLeadScore = Math.max(0, Math.min(100, updatedLeadScore));

    return {
      updatedLeadScore,
      interactionScore,
    };
  }
);
