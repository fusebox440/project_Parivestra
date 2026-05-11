const { Queue } = require('bullmq');
const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

const redisConnection = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

const videoProcessingQueue = new Queue('video-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      count: 100,
    },
    removeOnFail: {
      count: 50,
    },
  },
});

async function addVideoJob(submissionId) {
  const job = await videoProcessingQueue.add('process-video', { submissionId });
  logger.info(`Added video processing job for submission ${submissionId}. Job ID: ${job.id}`);
  return job;
}

module.exports = {
  queue: videoProcessingQueue,
  addVideoJob,
  redisConnection,
};
