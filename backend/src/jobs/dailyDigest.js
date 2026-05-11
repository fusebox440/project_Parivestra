const cron = require('node-cron');
const { sendDailyDigest } = require('../services/notificationService');
const logger = require('../utils/logger');

let dailyDigestJob;

function startDailyDigestJob() {
    // Schedule to run at 9:00 AM every day
    dailyDigestJob = cron.schedule('0 9 * * *', () => {
        logger.info('Running daily digest cron job...');
        sendDailyDigest().catch(err => {
            logger.error(`Error during daily digest job: ${err.message}`);
        });
    }, {
        scheduled: true,
        timezone: "Asia/Kolkata"
    });

    logger.info('Daily digest job scheduled for 9:00 AM IST.');
}

function stopDailyDigestJob() {
    if (dailyDigestJob) {
        dailyDigestJob.stop();
        logger.info('Daily digest job stopped.');
    }
}

module.exports = { startDailyDigestJob, stopDailyDigestJob };
