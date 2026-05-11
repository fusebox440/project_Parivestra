const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const calculateCost = (inputTokens, outputTokens) => {
    // For this prototype, we are using the free tier of Gemini
    return 0;
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

async function analyze(transcript, segments, campaign, brand, retry = 0) {
    logger.info(`Starting transcript analysis for campaign: ${campaign.name}`);
    const { systemPrompt, userPrompt } = buildPrompts(transcript, segments, campaign, brand);

    try {
        const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
        const result = await model.generateContent(fullPrompt);
        const responseJson = result.response.text().replace(/```json\n?/, '').replace(/```$/, '');
        const analysisResult = JSON.parse(responseJson);
        
        const costUsd = 0; // Free tier for this prototype

        logger.info(`Transcript analysis successful. Cost: $${costUsd}`);
        return { ...analysisResult, costUsd };

    } catch (error) {
        logger.error(`Transcript analysis failed: ${error.message}`);
        if (retry < 1 && error instanceof SyntaxError) {
            logger.warn('JSON parsing failed, retrying with explicit instruction...');
            return analyze(transcript, segments, campaign, brand, retry + 1);
        }
        throw new Error(`Gemini transcript analysis failed: ${error.message}`);
    }
}

module.exports = { analyze };
