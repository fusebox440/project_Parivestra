const { Worker } = require('bullmq');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { redisConnection, queue } = require('../config/queue');
const logger = require('../utils/logger');

// Analyzers
const formatAnalyzer = require('../services/analyzers/formatAnalyzer');
const transcriptionService = require('../services/transcriptionService');
const transcriptAnalyzer = require('../services/analyzers/transcriptAnalyzer');
const visualAnalyzer = require('../services/analyzers/visualAnalyzer');
const audioQualityAnalyzer = require('../services/analyzers/audioQualityAnalyzer');

// Mock services to be created in later parts
const scoringEngine = { calculate: async () => ({ qcScore: 90, goodnessScore: 85, decision: 'APPROVED', hardFailReasons: [] }) };
const qcResultService = { save: async () => ({ id: 'qc-result-id' }) };
const feedbackService = { sendCreatorFeedback: async () => {} };


const prisma = new PrismaClient();

const videoProcessor = new Worker('video-processing', async job => {
    const { submissionId } = job.data;
    logger.info(`Processing job ${job.id} for submission ${submissionId}`);
    const startTime = Date.now();

    const tempDir = path.join('/tmp', submissionId);
    const videoPath = path.join(tempDir, 'video.mp4');

    try {
        await prisma.videoSubmission.update({
            where: { id: submissionId },
            data: { status: 'PROCESSING' },
        });

        const submission = await prisma.videoSubmission.findUnique({
            where: { id: submissionId },
            include: {
                deliverable: {
                    include: {
                        campaign: {
                            include: {
                                brand: true,
                            },
                        },
                        creator: true,
                    },
                },
            },
        });

        if (!submission) throw new Error(`Submission ${submissionId} not found.`);

        // Download video
        await fs.mkdir(tempDir, { recursive: true });
        const writer = fs.createWriteStream(videoPath);
        const response = await axios({ url: submission.videoUrl, method: 'GET', responseType: 'stream' });
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        const { campaign, creator } = submission.deliverable;
        const { brand } = campaign;

        // Run analyses
        const formatResult = await formatAnalyzer.analyze(videoPath, campaign);
        const transcriptionResult = await transcriptionService.transcribe(videoPath, submissionId);

        const [transcriptAnalysisResult, visualAnalysisResult, audioQualityResult] = await Promise.allSettled([
            transcriptAnalyzer.analyze(transcriptionResult.transcript, transcriptionResult.segments, campaign, brand),
            visualAnalyzer.analyze(videoPath, submissionId, campaign, brand),
            audioQualityAnalyzer.analyze(videoPath),
        ]);

        const analysisResults = {
            format: formatResult,
            transcription: transcriptionResult,
            transcript: transcriptAnalysisResult.status === 'fulfilled' ? transcriptAnalysisResult.value : { error: transcriptAnalysisResult.reason.message, costUsd: 0 },
            visual: visualAnalysisResult.status === 'fulfilled' ? visualAnalysisResult.value : { error: visualAnalysisResult.reason.message, costUsd: 0 },
            audio: audioQualityResult.status === 'fulfilled' ? audioQualityResult.value : { error: audioQualityResult.reason.message, costUsd: 0 },
        };
        
        // Scoring and Decision (mocked for now)
        const finalDecision = await scoringEngine.calculate(analysisResults);

        // Save results (mocked for now)
        await qcResultService.save(submissionId, finalDecision, analysisResults);

        // Send feedback (mocked for now)
        await feedbackService.sendCreatorFeedback(submission.id);

        await prisma.videoSubmission.update({
            where: { id: submissionId },
            data: { status: 'COMPLETED' },
        });

        const totalCost = Object.values(analysisResults).reduce((sum, result) => sum + (result.costUsd || 0), 0);
        const processingTime = Date.now() - startTime;
        logger.info(`Job ${job.id} completed for submission ${submissionId}. Decision: ${finalDecision.decision}. Cost: $${totalCost.toFixed(4)}. Time: ${processingTime}ms`);

    } catch (error) {
        logger.error(`Job ${job.id} failed for submission ${submissionId}: ${error.message}`);
        await prisma.videoSubmission.update({
            where: { id: submissionId },
            data: { status: 'FAILED' },
        });
        throw error; // Re-throw to let BullMQ handle the failure and retry logic
    } finally {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(e => logger.warn(`Failed to cleanup temp dir: ${tempDir}`));
    }
}, {
    connection: redisConnection,
    concurrency: 5,
});

videoProcessor.on('failed', (job, err) => {
    logger.error(`Job ${job.id} ultimately failed after all retries for submission ${job.data.submissionId}: ${err.message}`);
});

module.exports = videoProcessor;
