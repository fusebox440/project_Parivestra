const { PrismaClient } = require('@prisma/client');
const { generateCreatorFeedback } = require('../utils/scoreExplainer');
const { sendWhatsAppMessage, maskPhone } = require('../utils/twilioHelper');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendCreatorFeedback(submissionId) {
    logger.info(`Sending feedback for submission: ${submissionId}`);
    try {
        const qcResult = await prisma.qCResult.findFirst({
            where: { submissionId },
            include: {
                submission: {
                    include: {
                        deliverable: {
                            include: {
                                campaign: true,
                                creator: true,
                            },
                        },
                    },
                },
            },
        });

        if (!qcResult) {
            logger.error(`QC Result not found for submission ${submissionId} when trying to send feedback.`);
            return { sent: false, messageSid: null };
        }

        const { deliverable } = qcResult.submission;
        const { campaign, creator } = deliverable;

        const message = generateCreatorFeedback(qcResult, campaign, creator);
        let whatsAppResponse = await sendWhatsAppMessage(creator.phone, message);

        if (!whatsAppResponse.success) {
            logger.warn(`Initial WhatsApp send failed for creator ${creator.id}. Retrying in 30s.`);
            await delay(30000);
            whatsAppResponse = await sendWhatsAppMessage(creator.phone, message);
        }

        await prisma.auditLog.create({
            data: {
                entityType: 'QCResult',
                entityId: qcResult.id,
                action: whatsAppResponse.success ? 'FEEDBACK_SENT' : 'FEEDBACK_FAILED',
                metadata: {
                    to: maskPhone(creator.phone),
                    decision: qcResult.decision,
                    messageSid: whatsAppResponse.messageSid,
                },
            },
        });

        if (whatsAppResponse.success) {
            logger.info(`Successfully sent feedback to creator ${creator.id} for submission ${submissionId}.`);
        } else {
            logger.error(`Failed to send feedback to creator ${creator.id} for submission ${submissionId} after retry.`);
        }

        return { sent: whatsAppResponse.success, messageSid: whatsAppResponse.messageSid };

    } catch (error) {
        logger.error(`Error in sendCreatorFeedback for submission ${submissionId}: ${error.message}`);
        return { sent: false, messageSid: null };
    }
}

module.exports = { sendCreatorFeedback };
