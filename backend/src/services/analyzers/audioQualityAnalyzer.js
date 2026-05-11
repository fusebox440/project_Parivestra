const ffmpegHelper = require('../../utils/ffmpegHelper');
const logger = require('../../utils/logger');

async function analyze(videoPath) {
    logger.info(`Starting audio quality analysis for: ${videoPath}`);
    const flags = [];
    let audioQualityScore = 0;

    try {
        const loudness = await ffmpegHelper.measureLoudness(videoPath);
        const silenceGaps = await ffmpegHelper.detectSilence(videoPath);

        // Loudness check
        let loudnessPass = false;
        if (loudness.integratedLoudness >= -23 && loudness.integratedLoudness <= -9) {
            audioQualityScore += 40;
            loudnessPass = true;
        } else if (loudness.integratedLoudness >= -30 && loudness.integratedLoudness < -23 || loudness.integratedLoudness > -9 && loudness.integratedLoudness <= -6) {
            audioQualityScore += 20;
            flags.push('Audio loudness is acceptable but not optimal.');
            loudnessPass = true;
        } else {
            flags.push('Audio loudness is outside acceptable range.');
        }

        // Silence check
        if (silenceGaps.length === 0) {
            audioQualityScore += 30;
        } else {
            flags.push(`Detected ${silenceGaps.length} silence gaps longer than 3 seconds.`);
        }

        // Loudness range check
        if (loudness.loudnessRange < 15) {
            audioQualityScore += 30;
        } else {
            flags.push('Audio has a wide dynamic range, which might be distracting.');
        }
        
        logger.info(`Audio quality analysis complete for ${videoPath}. Score: ${audioQualityScore}`);

        return {
            integratedLoudnessLufs: loudness.integratedLoudness,
            loudnessPass,
            silenceGapsDetected: silenceGaps.length > 0,
            silenceGapTimestamps: silenceGaps,
            audioQualityScore,
            flags,
            costUsd: 0,
        };

    } catch (error) {
        logger.error(`Audio quality analysis failed for ${videoPath}: ${error.message}`);
        return {
            audioQualityScore: 0,
            flags: ['Failed to process video for audio quality analysis.'],
            costUsd: 0,
        };
    }
}

module.exports = { analyze };
