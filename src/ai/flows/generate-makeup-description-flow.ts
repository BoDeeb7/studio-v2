'use server';
/**
 * @fileOverview An AI agent that generates creative names and descriptive text
 * for new makeup looks and services.
 *
 * - generateMakeupDescription - A function that handles the makeup description generation process.
 * - GenerateMakeupDescriptionInput - The input type for the generateMakeupDescription function.
 * - GenerateMakeupDescriptionOutput - The return type for the generateMakeupDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMakeupDescriptionInputSchema = z.object({
  theme: z.string().describe('The overall theme or style for the makeup look (e.g., "vintage glam", "natural glow", "bold artistic").'),
  keywords: z.array(z.string()).optional().describe('Optional keywords for more specific details (e.g., ["shimmer", "smokey eye", "peachy blush"]).'),
});
export type GenerateMakeupDescriptionInput = z.infer<typeof GenerateMakeupDescriptionInputSchema>;

const GenerateMakeupDescriptionOutputSchema = z.object({
  name: z.string().describe('A creative and appealing name for the makeup service.'),
  description: z.string().describe('A detailed, engaging, and unique description for the makeup service, highlighting its key features and appeal.'),
});
export type GenerateMakeupDescriptionOutput = z.infer<typeof GenerateMakeupDescriptionOutputSchema>;

export async function generateMakeupDescription(input: GenerateMakeupDescriptionInput): Promise<GenerateMakeupDescriptionOutput> {
  return generateMakeupDescriptionFlow(input);
}

const generateMakeupDescriptionPrompt = ai.definePrompt({
  name: 'generateMakeupDescriptionPrompt',
  input: { schema: GenerateMakeupDescriptionInputSchema },
  output: { schema: GenerateMakeupDescriptionOutputSchema },
  prompt: `You are an expert makeup artist marketing assistant with a talent for creating catchy names and captivating descriptions for new makeup services.

Generate a creative name and a detailed, engaging description for a new makeup service based on the following information:

Theme: {{{theme}}}
{{#if keywords}}
Keywords: {{#each keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

The description should highlight the key features and appeal of the service. Ensure the tone is elegant, sophisticated, and inviting, reflecting high-quality beauty services.

Your output must be a JSON object conforming to the following schema:

`,
});

const generateMakeupDescriptionFlow = ai.defineFlow(
  {
    name: 'generateMakeupDescriptionFlow',
    inputSchema: GenerateMakeupDescriptionInputSchema,
    outputSchema: GenerateMakeupDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await generateMakeupDescriptionPrompt(input);
    if (!output) {
      throw new Error('Failed to generate makeup description.');
    }
    return output;
  }
);
