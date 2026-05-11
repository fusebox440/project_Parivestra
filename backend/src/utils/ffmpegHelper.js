const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const runFfmpeg = (command) => {
    return new Promise((resolve, reject) => {
        command
            .on('end', (stdout, stderr) => {
                resolve(stdout || stderr);
            })
            .on('error', (err, stdout, stderr) => {
                logger.error(`FFmpeg error: ${err.message}`);
                logger.error(`FFmpeg stderr: ${stderr}`);
                reject(new Error(`FFmpeg failed: ${err.message}`));
            })
            .run();
    });
};

async function getVideoMetadata(filePath) {
    logger.info(`Probing video metadata for: ${filePath}`);
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                logger.error(`ffprobe error: ${err.message}`);
                return reject(new Error(`Could not get video metadata: ${err.message}`));
            }
            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
            const { width, height, r_frame_rate, avg_frame_rate } = videoStream;
            const fps = r_frame_rate ? parseInt(r_frame_rate.split('/')[0], 10) : parseInt(avg_frame_rate.split('/')[0], 10);
            
            const result = {
                duration: parseFloat(metadata.format.duration),
                width,
                height,
                aspectRatio: videoStream.display_aspect_ratio,
                fps,
                bitrate: parseInt(metadata.format.bit_rate, 10),
                audioCodec: audioStream ? audioStream.codec_name : null,
                videoCodec: videoStream.codec_name,
                fileSizeMb: parseFloat(metadata.format.size) / (1024 * 1024),
            };
            logger.info(`Successfully probed video metadata for: ${filePath}`);
            resolve(result);
        });
    });
}

async function extractAudio(videoPath, outputPath) {
    logger.info(`Extracting audio from ${videoPath} to ${outputPath}`);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const command = ffmpeg(videoPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .audioFrequency(16000)
        .audioChannels(1)
        .output(outputPath);
    await runFfmpeg(command);
    logger.info(`Successfully extracted audio to ${outputPath}`);
    return outputPath;
}

async function extractKeyframes(videoPath, outputDir, count = 6) {
    logger.info(`Extracting ${count} keyframes from ${videoPath} to ${outputDir}`);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const { duration } = await getVideoMetadata(videoPath);
    const timestamps = Array.from({ length: count }, (_, i) => {
        const percent = (10 + (i * 15)) / 100; // 10, 25, 40, 55, 70, 85
        return duration * percent;
    });

    const command = ffmpeg(videoPath)
        .screenshots({
            timestamps,
            filename: 'frame_%i.jpg',
            folder: outputDir,
            size: '640x?'
        });

    await runFfmpeg(command);
    const filePaths = Array.from({ length: count }, (_, i) => path.join(outputDir, `frame_${i + 1}.jpg`));
    logger.info(`Successfully extracted keyframes to ${outputDir}`);
    return filePaths;
}

async function measureLoudness(videoPath) {
    logger.info(`Measuring loudness for: ${videoPath}`);
    const command = ffmpeg(videoPath)
        .withAudioFilter('loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json')
        .format('null')
        .output('-');

    const result = await runFfmpeg(command);
    const lines = result.split('\n');
    const jsonLine = lines[lines.length - 2]; // The JSON output is the second to last line
    const stats = JSON.parse(jsonLine);

    const loudness = {
        integratedLoudness: parseFloat(stats.input_i),
        truePeak: parseFloat(stats.input_tp),
        loudnessRange: parseFloat(stats.input_lra),
    };
    logger.info(`Loudness measured for ${videoPath}: ${JSON.stringify(loudness)}`);
    return loudness;
}

async function detectSilence(videoPath, minSilenceDuration = 3) {
    logger.info(`Detecting silence in: ${videoPath}`);
    const command = ffmpeg(videoPath)
        .withAudioFilter(`silencedetect=noise=-30dB:d=${minSilenceDuration}`)
        .format('null')
        .output('-');

    const result = await runFfmpeg(command);
    const lines = result.split('\n').filter(line => line.includes('silence_start') || line.includes('silence_end'));
    
    const silenceSegments = [];
    let currentSegment = {};

    for (const line of lines) {
        if (line.includes('silence_start')) {
            currentSegment.start = parseFloat(line.split('silence_start: ')[1]);
        } else if (line.includes('silence_end')) {
            currentSegment.end = parseFloat(line.split('silence_end: ')[1].split(' |')[0]);
            currentSegment.duration = currentSegment.end - currentSegment.start;
            if (currentSegment.duration >= minSilenceDuration) {
                silenceSegments.push(currentSegment);
            }
            currentSegment = {};
        }
    }
    logger.info(`Detected ${silenceSegments.length} silence gaps in ${videoPath}`);
    return silenceSegments;
}

module.exports = {
    getVideoMetadata,
    extractAudio,
    extractKeyframes,
    measureLoudness,
    detectSilence,
};
