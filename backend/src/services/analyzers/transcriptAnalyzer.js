const Anthropic = require('@anthropic-ai/sdk');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const calculateCost = (inputTokens, outputTokens) => {
    const inputCost = (inputTokens / 1_000_000) * 3;
    const outputCost = (outputTokens / 1_000_000) * 15;
    return inputCost + outputCost;
};

const buildPrompts = (transcript, segments, campaign, brand) => {
    const systemPrompt = `You are a brand safety and compliance reviewer for influencer marketing. You analyze video transcripts and return ONLY valid JSON. Never include markdown, code blocks, or explanation — pure JSON only.`;

    const formattedTranscript = segments.map(s => `[${new Date(s.start * 1000).toISOString().substr(14, 5)}] ${s.text}`).join('\n');

    const userPrompt = `
        Analyze the following video transcript for a sponsored post.

        **Campaign Brief:**
        ${campaign.briefText}

        **Required Keywords to Mention:**
        - ${campaign.keywordsMustMention.join('\n- ')}

        **Forbidden Keywords (must not be mentioned):**
        - ${campaign.keywordsForbidden.join('\n- ')}

        **Competitor Brands (must not be mentioned):**
        - ${brand.competitors.join('\n- ')}

        **Full Transcript:**
        ---
        ${formattedTranscript}
        ---

        Based on the brief and transcript, provide a JSON analysis with the following structure:
        {
          "brandMentioned": boolean,
          "brandMentionTimestamps": [{"start": float, "end": float, "text": string}],
          "competitorMentioned": boolean,
          "competitorMentionDetails": string,
          "profanityDetected": boolean,
          "profanityTimestamps": [{"start": float, "end": float}],
          "falseClaims": boolean,
          "falseClaimDetails": string,
          "requiredKeywordsCovered": {"keyword": boolean},
          "callToActionPresent": boolean,
          "overallToneScore": int (0-100),
          "transcriptSummary": string
        }
    `;
    return { systemPrompt, userPrompt };
};

async function analyze(transcript, segments, campaign, brand, retry = false) {
    logger.info(`Starting transcript analysis for campaign: ${campaign.name}`);
    const { systemPrompt, userPrompt } = buildPrompts(transcript, segments, campaign, brand);

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-sonnet-20240229', // Using Sonnet 3 as 4.2 is not available
            max_tokens: 1500,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
        });

        const jsonString = response.content[0].text;
        const result = JSON.parse(jsonString);
        const costUsd = calculateCost(response.usage.input_tokens, response.usage.output_tokens);

        logger.info(`Transcript analysis successful. Cost: $${costUsd}`);
        return { ...result, costUsd };

    } catch (error) {
        logger.error(`Transcript analysis failed: ${error.message}`);
        if (!retry && error instanceof SyntaxError) {
            logger.warn('JSON parsing failed, retrying with explicit instruction...');
            const { systemPrompt, userPrompt } = buildPrompts(transcript, segments, campaign, brand);
            const modifiedUserPrompt = userPrompt + "\n\nIMPORTANT: Your entire response must be ONLY the raw JSON object, starting with { and ending with }. Do not include any other text or formatting.";
            
            // This is a simplified retry. A more robust implementation would be better.
            try {
                 const retryResponse = await anthropic.messages.create({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1500,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: modifiedUserPrompt }],
                });
                const jsonString = retryResponse.content[0].text;
                const result = JSON.parse(jsonString);
                const costUsd = calculateCost(retryResponse.usage.input_tokens, retryResponse.usage.output_tokens);
                logger.info(`Transcript analysis successful on retry. Cost: $${costUsd}`);
                return { ...result, costUsd };
            } catch (retryError) {
                 logger.error(`Transcript analysis failed on retry: ${retryError.message}`);
                 throw new Error(`Claude transcript analysis failed: ${retryError.message}`);
            }
        }
        throw new Error(`Claude transcript analysis failed: ${error.message}`);
    }
}

module.exports = { analyze };
