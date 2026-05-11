const ffmpegHelper = require('../../utils/ffmpegHelper');
const logger = require('../../utils/logger');

async function analyze(videoPath, campaign) {
    logger.info(`Running format analysis for video: ${videoPath}`);
    const flags = [];
    let formatScore = 0;

    try {
        const metadata = await ffmpegHelper.getVideoMetadata(videoPath);

        // 1. Aspect Ratio Check
        const [arWidth, arHeight] = campaign.requiredAspectRatio.split(':').map(Number);
        const targetRatio = arWidth / arHeight;
        const actualRatio = metadata.width / metadata.height;
        if (Math.abs(targetRatio - actualRatio) <= 0.05) {
            formatScore += 40;
        } else {
            flags.push(`Incorrect aspect ratio. Expected ~${targetRatio.toFixed(2)}, got ${actualRatio.toFixed(2)}.`);
        }

        // 2. Duration Check
        if (metadata.duration >= campaign.minDurationSecs && metadata.duration <= campaign.maxDurationSecs) {
            formatScore += 30;
        } else {
            flags.push(`Incorrect duration. Expected ${campaign.minDurationSecs}-${campaign.maxDurationSecs}s, got ${metadata.duration.toFixed(1)}s.`);
        }

        // 3. Resolution Check
        if (metadata.width >= 720 || metadata.height >= 720) {
            formatScore += 20;
        } else {
            flags.push(`Low resolution. Minimum 720p required, got ${metadata.width}x${metadata.height}.`);
        }

        // 4. FPS Check
        if (metadata.fps >= 24) {
            formatScore += 10;
        } else {
            flags.push(`Low frame rate. Expected >=24fps, got ${metadata.fps}.`);
        }

        const passed = flags.length === 0;
        logger.info(`Format analysis complete for ${videoPath}. Score: ${formatScore}, Passed: ${passed}`);

        return {
            passed,
            formatScore,
            metrics: metadata,
            flags,
            costUsd: 0,
        };

    } catch (error) {
        logger.error(`Format analysis failed for ${videoPath}: ${error.message}`);
        return {
            passed: false,
            formatScore: 0,
            metrics: null,
            flags: ['Failed to process video file for format analysis.'],
            costUsd: 0,
        };
    }
}

module.exports = { analyze };
