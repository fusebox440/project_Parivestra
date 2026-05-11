const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');
const ffmpegHelper = require('../../utils/ffmpegHelper');
const { redisConnection } = require('../../config/queue');
const env = require('../../config/env');
const logger = require('../../utils/logger');

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

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
        const audioBuffer = await fs.readFile(audioPath);

        logger.info(`Calling OpenAI Whisper API for submission: ${submissionId}`);
        const response = await openai.audio.transcriptions.create({
            model: 'whisper-1',
            file: audioBuffer,
            response_format: 'verbose_json',
        });

        const costUsd = (response.duration / 60) * 0.006;
        const result = {
            transcript: response.text,
            segments: response.segments.map(s => ({ start: s.start, end: s.end, text: s.text })),
            language: response.language,
            durationSecs: response.duration,
            costUsd,
        };

        try {
            await redisConnection.set(cacheKey, JSON.stringify(result), 'EX', 86400);
        } catch (error) {
            logger.warn(`Failed to cache transcript for ${submissionId}: ${error.message}`);
        }

        logger.info(`Transcription successful for submission: ${submissionId}. Cost: $${costUsd}`);
        return result;

    } catch (error) {
        logger.error(`Transcription failed for submission ${submissionId}: ${error.message}`);
        throw new Error(`Whisper transcription failed: ${error.message}`);
    } finally {
        try {
            await fs.unlink(audioPath);
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

module.exports = { transcribe };
