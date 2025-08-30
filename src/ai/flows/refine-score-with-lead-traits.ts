'use server';
/**
 * @fileOverview A Genkit flow to refine the lead score based on selected lead traits.
 *
 * - refineScoreWithLeadTraits - A function that refines the lead score based on lead traits.
 * - RefineScoreWithLeadTraitsInput - The input type for the refineScoreWithLeadTraits function.
 * - RefineScoreWithLeadTraitsOutput - The return type for the refineScoreWithLeadTraits function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineScoreWithLeadTraitsInputSchema = z.object({
  currentScore: z.number().describe('The current lead score.'),
  leadTraits: z
    .array(z.enum(['Haggling', 'Price Sensitive', 'Time Constraint', 'Pays for Value', 'Browser-not-Buyer']))
    .describe('The lead traits selected.'),
});
export type RefineScoreWithLeadTraitsInput = z.infer<typeof RefineScoreWithLeadTraitsInputSchema>;

const RefineScoreWithLeadTraitsOutputSchema = z.object({
  refinedScore: z.number().describe('The refined lead score.'),
});
export type RefineScoreWithLeadTraitsOutput = z.infer<typeof RefineScoreWithLeadTraitsOutputSchema>;

export async function refineScoreWithLeadTraits(input: RefineScoreWithLeadTraitsInput): Promise<RefineScoreWithLeadTraitsOutput> {
  return refineScoreWithLeadTraitsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineScoreWithLeadTraitsPrompt',
  input: {schema: RefineScoreWithLeadTraitsInputSchema},
  output: {schema: RefineScoreWithLeadTraitsOutputSchema},
  prompt: `You are an expert sales strategist, refining lead scores based on observed traits.

  Current Lead Score: {{{currentScore}}}
  Lead Traits: {{#if leadTraits}}{{#each leadTraits}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}

  Based on the current lead score and the selected lead traits, determine a refined lead score.
  Consider the following adjustments based on lead traits:
  - Haggling: -5 points
  - Price Sensitive: -5 points
  - Time Constraint: No change
  - Pays for Value: +10 points
  - Browser-not-Buyer: -20 points

The refined score should be within the range of 0 to 100.

Return the refined score.

Refined Score: {{refinedScore}}`,
});

const refineScoreWithLeadTraitsFlow = ai.defineFlow(
  {
    name: 'refineScoreWithLeadTraitsFlow',
    inputSchema: RefineScoreWithLeadTraitsInputSchema,
    outputSchema: RefineScoreWithLeadTraitsOutputSchema,
  },
  async input => {
    let interactionScore = 0;

    for (const trait of input.leadTraits) {
      switch (trait) {
        case 'Haggling':
        case 'Price Sensitive':
          interactionScore -= 5;
          break;
        case 'Pays for Value':
          interactionScore += 10;
          break;
        case 'Browser-not-Buyer':
          interactionScore -= 20;
          break;
      }
    }

    let refinedScore = input.currentScore + interactionScore;

    refinedScore = Math.max(0, Math.min(100, refinedScore));

    return {refinedScore};
  }
);
