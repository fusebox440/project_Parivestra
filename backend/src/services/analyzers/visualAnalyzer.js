const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');
const ffmpegHelper = require('../../utils/ffmpegHelper');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const buildPrompt = (base64Frames, campaign, brand) => {
    const systemPrompt = "You are a visual brand safety analyst. Your response must be ONLY a valid JSON object.";

    const userMessages = [
        {
            type: "text",
            text: `Analyze these frames from a sponsored creator video.
            Brand: ${campaign.brand.name}
            Competitors: ${brand.competitors.join(', ')}
            Check for product/logo visibility, brand safety, and visual quality.
            
            Return a JSON object with this exact structure:
            {
              "productVisible": boolean,
              "productVisibilityFrames": [int],
              "logoVisible": boolean,
              "logoVisibilityFrames": [int],
              "competitorProductVisible": boolean,
              "personOnScreen": boolean,
              "faceVisible": boolean,
              "brandUnsafeContent": boolean,
              "brandUnsafeDetails": string,
              "visualQualityScore": int (0-100),
              "lightingScore": int (0-100),
              "frameCompositionScore": int (0-100)
            }`
        }
    ];

    base64Frames.forEach(frame => {
        userMessages.push({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${frame}` }
        });
    });

    return { systemPrompt, userMessages };
};

async function analyze(videoPath, submissionId, campaign, brand) {
    logger.info(`Starting visual analysis for submission: ${submissionId}`);
    const tempDir = path.join('/tmp', submissionId, 'frames');
    let framePaths = [];

    try {
        framePaths = await ffmpegHelper.extractKeyframes(videoPath, tempDir);
        
        const base64Frames = await Promise.all(
            framePaths.map(p => fs.readFile(p, { encoding: 'base64' }))
        );

        const { systemPrompt, userMessages } = buildPrompt(base64Frames, campaign, brand);

        logger.info(`Calling GPT-4o for visual analysis for submission: ${submissionId}`);
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessages }
            ],
            max_tokens: 1000,
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(response.choices[0].message.content);
        const costUsd = 0.0459; // Fixed cost for 6 images

        logger.info(`Visual analysis successful for submission ${submissionId}. Cost: $${costUsd}`);
        return { ...result, costUsd };

    } catch (error) {
        logger.error(`Visual analysis failed for submission ${submissionId}: ${error.message}`);
        if (error.response) logger.error(JSON.stringify(error.response.data));
        throw new Error(`GPT-4o visual analysis failed: ${error.message}`);
    } finally {
        if (framePaths.length > 0) {
            try {
                await fs.rm(path.join('/tmp', submissionId), { recursive: true, force: true });
            } catch (e) {
                logger.warn(`Failed to cleanup temp frame files for submission ${submissionId}`);
            }
        }
    }
}

module.exports = { analyze };
