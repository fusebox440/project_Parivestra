const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

async function save(submissionId, scoringOutput, processingTimeMs) {
    logger.info(`Saving QC result for submission: ${submissionId}`);
    const { qcScore, goodnessScore, decision, hardFailReasons, flags, totalCostInr } = scoringOutput;

    try {
        const qcResult = await prisma.qCResult.create({
            data: {
                submissionId,
                qcScore,
                goodnessScore,
                decision,
                hardFailReasons,
                flags: flags, // Prisma expects Json type
                processingTimeMs,
                apiCostInr: totalCostInr,
                processedAt: new Date(),
            },
        });

        logger.info(`Saved QCResult ${qcResult.id} for submission ${submissionId} with decision: ${decision}`);

        if (decision === 'HUMAN_REVIEW') {
            await prisma.humanReviewQueue.create({
                data: {
                    qcResultId: qcResult.id,
                    status: 'PENDING',
                },
            });
            logger.info(`Added submission ${submissionId} to human review queue.`);
        }

        let deliverableStatus;
        if (decision === 'APPROVED') deliverableStatus = 'APPROVED';
        if (decision === 'REJECTED') deliverableStatus = 'REJECTED';

        if (deliverableStatus) {
            const submission = await prisma.videoSubmission.findUnique({ where: { id: submissionId } });
            await prisma.deliverable.update({
                where: { id: submission.deliverableId },
                data: { status: deliverableStatus },
            });
            logger.info(`Updated deliverable ${submission.deliverableId} status to ${deliverableStatus}`);
        }

        await prisma.auditLog.create({
            data: {
                entityType: 'VideoSubmission',
                entityId: submissionId,
                action: 'QC_DECISION',
                metadata: {
                    decision,
                    qcScore,
                    goodnessScore,
                    totalCostInr,
                },
            },
        });

        return qcResult;
    } catch (error) {
        logger.error(`Failed to save QC result for submission ${submissionId}: ${error.message}`);
        throw new Error(`Database operation failed while saving QC result.`);
    }
}

module.exports = { save };
