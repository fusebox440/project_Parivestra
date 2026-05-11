const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ffmpegHelper = require('../../utils/ffmpegHelper');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const buildPrompt = (campaign, brand) => {
    return `Analyze these frames from a sponsored creator video.
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
    }`;
};

async function analyze(videoPath, submissionId, campaign, brand, retry = 0) {
    logger.info(`Starting visual analysis for submission: ${submissionId}`);
    const tempDir = path.join('/tmp', submissionId, 'frames');
    let framePaths = [];

    try {
        framePaths = await ffmpegHelper.extractKeyframes(videoPath, tempDir);
        
        const imageParts = await Promise.all(
            framePaths.map(async (p) => ({
                inlineData: {
                    data: await fs.readFile(p, { encoding: 'base64' }),
                    mimeType: 'image/jpeg',
                },
            }))
        );

        const prompt = buildPrompt(campaign, brand);

        logger.info(`Calling Gemini for visual analysis for submission: ${submissionId}`);
        
        const result = await model.generateContent([prompt, ...imageParts]);
        const responseJson = result.response.text().replace(/```json\n?/, '').replace(/```$/, '');
        const analysisResult = JSON.parse(responseJson);

        const costUsd = 0; // Free tier for this prototype

        logger.info(`Visual analysis successful for submission ${submissionId}. Cost: $${costUsd}`);
        return { ...analysisResult, costUsd };

    } catch (error) {
        logger.error(`Visual analysis failed for submission ${submissionId}: ${error.message}`);
        if (retry < 1 && error instanceof SyntaxError) {
            logger.warn('JSON parsing failed, retrying visual analysis...');
            return analyze(videoPath, submissionId, campaign, brand, retry + 1);
        }
        throw new Error(`Gemini visual analysis failed: ${error.message}`);
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
