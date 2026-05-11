const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const { getSignedUrl } = require('../services/storageService');
const feedbackService = require('../services/feedbackService');
const { subDays, startOfDay, endOfDay } = require('date-fns');

const getStats = async (req, res) => {
    try {
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const submissionsToday = await prisma.videoSubmission.findMany({
            where: { createdAt: { gte: todayStart, lte: todayEnd } },
            include: { qcResult: true },
        });

        const totalToday = submissionsToday.length;
        const approvedToday = submissionsToday.filter(s => s.qcResult?.decision === 'APPROVED').length;
        const rejectedToday = submissionsToday.filter(s => s.qcResult?.decision === 'REJECTED').length;
        const humanReviewToday = submissionsToday.filter(s => s.qcResult?.decision === 'HUMAN_REVIEW').length;

        const processingTimes = submissionsToday
            .map(s => s.qcResult?.processingTimeMs)
            .filter(Boolean);
        const avgProcessingTime = processingTimes.length > 0 ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length : 0;

        const apiCosts = submissionsToday
            .map(s => s.qcResult?.apiCostInr)
            .filter(Boolean);
        const avgCostPerVideo = apiCosts.length > 0 ? apiCosts.reduce((a, b) => a + b, 0) / apiCosts.length : 0;

        const pendingHumanReviewCount = await prisma.humanReviewQueue.count({
            where: { status: 'PENDING' },
        });

        res.json({
            totalToday,
            approvalRate: totalToday > 0 ? (approvedToday / totalToday) * 100 : 0,
            rejectionRate: totalToday > 0 ? (rejectedToday / totalToday) * 100 : 0,
            humanReviewRate: totalToday > 0 ? (humanReviewToday / totalToday) * 100 : 0,
            counts: {
                approved: approvedToday,
                rejected: rejectedToday,
                humanReview: humanReviewToday,
            },
            avgProcessingTime,
            avgCostPerVideo,
            pendingHumanReviewCount,
        });
    } catch (error) {
        logger.error('Error fetching dashboard stats:', { error });
        res.status(500).json({ message: 'Failed to fetch dashboard stats.' });
    }
};

const getHumanReviewQueue = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const where = {
            status: { in: ['PENDING', 'IN_REVIEW'] }
        };
        if (req.query.campaignId) {
            where.submission = { campaignId: req.query.campaignId };
        }
        if (req.query.status) {
            where.status = req.query.status;
        }

        const queueItems = await prisma.humanReviewQueue.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'asc' },
            include: {
                submission: {
                    include: {
                        creator: { select: { name: true, phone: true } },
                        campaign: { select: { name: true } },
                        qcResult: {
                            include: {
                                flags: true,
                            }
                        },
                    },
                },
            },
        });

        for (const item of queueItems) {
            if (item.submission.videoUrl) {
                item.submission.videoUrl = await getSignedUrl(item.submission.videoUrl, 3600); // 1 hour expiry
            }
            if (item.submission.creator.phone) {
                // Mask phone number
                item.submission.creator.phone = item.submission.creator.phone.slice(0, -4) + '****';
            }
        }

        const total = await prisma.humanReviewQueue.count({ where });

        res.json({
            data: queueItems,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error('Error fetching human review queue:', { error });
        res.status(500).json({ message: 'Failed to fetch human review queue.' });
    }
};

const resolveHumanReviewItem = async (req, res) => {
    const { id } = req.params;
    const { decision, reviewerNotes } = req.body;
    const reviewerId = "system"; // Replace with actual user ID from auth

    try {
        const updatedQueueItem = await prisma.$transaction(async (tx) => {
            const queueItem = await tx.humanReviewQueue.findUnique({
                where: { id },
                include: { submission: true },
            });

            if (!queueItem) {
                throw new Error('Queue item not found');
            }

            const updatedItem = await tx.humanReviewQueue.update({
                where: { id },
                data: {
                    status: 'RESOLVED',
                    resolvedAt: new Date(),
                    reviewerNotes,
                    resolvedBy: reviewerId,
                },
            });

            await tx.qCResult.update({
                where: { id: queueItem.submission.qcResultId },
                data: { decision },
            });

            await tx.deliverable.update({
                where: { id: queueItem.submission.deliverableId },
                data: { status: decision === 'APPROVED' ? 'COMPLETED' : 'REJECTED' },
            });

            await tx.auditLog.create({
                data: {
                    submissionId: queueItem.submissionId,
                    event: 'HUMAN_REVIEW_RESOLVED',
                    details: `Reviewer decided: ${decision}. Notes: ${reviewerNotes || 'N/A'}`,
                    actor: reviewerId,
                },
            });

            return updatedItem;
        });

        const fullResult = await prisma.qCResult.findUnique({
            where: { id: updatedQueueItem.submission.qcResultId },
            include: { flags: true, submission: { include: { creator: true } } },
        });

        await feedbackService.sendCreatorFeedback(fullResult);

        res.json(updatedQueueItem);
    } catch (error) {
        logger.error(`Error resolving human review item ${id}:`, { error });
        if (error.message === 'Queue item not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to resolve human review item.' });
    }
};

const getCampaignReport = async (req, res) => {
    const { id } = req.params;
    try {
        const campaign = await prisma.campaign.findUnique({
            where: { id },
            include: { brand: true },
        });

        if (!campaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        const submissions = await prisma.videoSubmission.findMany({
            where: { campaignId: id },
            include: { qcResult: { include: { flags: true } } },
        });

        const totalSubmissions = submissions.length;
        const decisions = submissions.reduce((acc, s) => {
            const decision = s.qcResult?.decision || 'PENDING';
            acc[decision] = (acc[decision] || 0) + 1;
            return acc;
        }, {});

        const allFlags = submissions.flatMap(s => s.qcResult?.flags || []);
        const flagFrequency = allFlags.reduce((acc, flag) => {
            acc[flag.code] = (acc[flag.code] || 0) + 1;
            return acc;
        }, {});
        const top5Flags = Object.entries(flagFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([code, count]) => ({ code, count }));

        const qcScores = submissions.map(s => s.qcResult?.qcScore).filter(Boolean);
        const avgQcScore = qcScores.length > 0 ? qcScores.reduce((a, b) => a + b, 0) / qcScores.length : 0;

        const goodnessScores = submissions.map(s => s.qcResult?.goodnessScore).filter(Boolean);
        const avgGoodnessScore = goodnessScores.length > 0 ? goodnessScores.reduce((a, b) => a + b, 0) / goodnessScores.length : 0;

        const totalApiCost = submissions.reduce((sum, s) => sum + (s.qcResult?.apiCostInr || 0), 0);

        res.json({
            campaign,
            totalSubmissions,
            decisionBreakdown: decisions,
            top5Flags,
            avgQcScore,
            avgGoodnessScore,
            totalApiCost,
            approvalRate: totalSubmissions > 0 ? ((decisions['APPROVED'] || 0) / totalSubmissions) * 100 : 0,
        });
    } catch (error) {
        logger.error(`Error fetching report for campaign ${id}:`, { error });
        res.status(500).json({ message: 'Failed to fetch campaign report.' });
    }
};

const getSubmissionDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const submission = await prisma.videoSubmission.findUnique({
            where: { id },
            include: {
                creator: true,
                campaign: true,
                qcResult: {
                    include: {
                        flags: true,
                        formatAnalysis: true,
                        transcription: true,
                        transcriptAnalysis: true,
                        visualAnalysis: true,
                        audioQualityAnalysis: true,
                    },
                },
                auditLogs: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        if (submission.videoUrl) {
            submission.videoUrl = await getSignedUrl(submission.videoUrl, 3600); // 1 hour expiry
        }

        res.json(submission);
    } catch (error) {
        logger.error(`Error fetching details for submission ${id}:`, { error });
        res.status(500).json({ message: 'Failed to fetch submission details.' });
    }
};

module.exports = {
    getStats,
    getHumanReviewQueue,
    resolveHumanReviewItem,
    getCampaignReport,
    getSubmissionDetails,
};
