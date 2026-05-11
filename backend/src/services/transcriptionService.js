const fs = require('fs').promises;
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ffmpegHelper = require('../utils/ffmpegHelper');
const { redisConnection } = require('../config/queue');
const env = require('../config/env');
const logger = require('../utils/logger');

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

async function transcribe(videoPath, submissionId) {
  const cacheKey = `transcript:${submissionId}`;
  logger.info(`Starting transcription for submission: ${submissionId}`);

  try {
    const cached = await redisConnection.get(cacheKey);
    if (cached) {
      logger.info(`Found cached transcript for submission: ${submissionId}`);
      return JSON.parse(cached);
    }
  } catch (error) {
    logger.warn(`Redis cache check failed for ${submissionId}: ${error.message}`);
  }

  const tempDir = path.join('/tmp', submissionId);
  const audioPath = path.join(tempDir, 'audio.mp3');

  try {
    await ffmpegHelper.extractAudio(videoPath, audioPath);
    const audioBase64 = await fs.readFile(audioPath, { encoding: 'base64' });

    logger.info(`Calling Gemini API for transcription: ${submissionId}`);

    const prompt = `Transcribe this audio exactly. Return JSON with fields: transcript (full text), segments (array of {start, end, text} with estimated timestamps), language, durationSecs`;

    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: 'audio/mp3',
      },
    };

    const result = await model.generateContent([prompt, audioPart]);
    const responseJson = result.response.text().replace(/```json\n?/, '').replace(/```$/, '');
    const response = JSON.parse(responseJson);
    
    const costUsd = 0; // Free tier for this prototype

    const transcriptionResult = {
      transcript: response.transcript,
      segments: response.segments,
      language: response.language,
      durationSecs: response.durationSecs,
      costUsd,
    };

    try {
      await redisConnection.set(cacheKey, JSON.stringify(transcriptionResult), 'EX', 86400);
    } catch (error) {
      logger.warn(`Failed to cache transcript for ${submissionId}: ${error.message}`);
    }

    logger.info(`Transcription successful for submission: ${submissionId}. Cost: $${costUsd}`);
    return transcriptionResult;

  } catch (error) {
    logger.error(`Transcription failed for submission ${submissionId}: ${error.message}`);
    throw new Error(`Gemini transcription failed: ${error.message}`);
  } finally {
    try {
      await fs.unlink(audioPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

module.exports = { transcribe };
