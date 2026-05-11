const nodemailer = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const env = require('../config/env');
const logger = require('../utils/logger');
const { getPresignedUrl } = require('./storageService');
const { maskPhone } = require('../utils/twilioHelper');

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

async function sendHumanReviewEmail(qcResultId) {
    logger.info(`Sending human review email for QC Result: ${qcResultId}`);
    try {
        const qcResult = await prisma.qCResult.findUnique({
            where: { id: qcResultId },
            include: {
                submission: { include: { deliverable: { include: { campaign: true, creator: true } } } },
                humanReview: true,
            },
        });

        if (!qcResult) throw new Error("QC Result not found.");

        const { submission, humanReview, flags, qcScore, goodnessScore } = qcResult;
        const { campaign, creator } = submission.deliverable;
        const videoKey = submission.videoUrl.split('/').slice(3).join('/');
        const signedUrl = await getPresignedUrl(videoKey, 3600 * 24); // 24h expiry

        const flagsHtml = flags.map(flag =>
            `<li style="color: ${flag.severity === 'HIGH' ? 'red' : flag.severity === 'MEDIUM' ? 'orange' : 'black'};">
                <strong>${flag.code}:</strong> ${flag.detail}
            </li>`
        ).join('');

        const mailOptions = {
            from: `"CreatorQC Notifier" <no-reply@creatorqc.com>`,
            to: env.CAMPAIGN_MANAGER_EMAIL,
            subject: `[CreatorQC] Manual Review Required: ${creator.name} | ${campaign.name}`,
            html: `
                <h2>Manual Review Required</h2>
                <p>A video submission has been flagged for manual review.</p>
                <ul>
                    <li><strong>Creator:</strong> ${creator.name} (${maskPhone(creator.phone)})</li>
                    <li><strong>Campaign:</strong> ${campaign.name}</li>
                    <li><strong>QC Score:</strong> <strong style="font-size: 1.2em;">${qcScore}</strong>/100</li>
                    <li><strong>Goodness Score:</strong> <strong style="font-size: 1.2em;">${goodnessScore}</strong>/100</li>
                </ul>
                <h3>Flags Raised:</h3>
                <ul>${flagsHtml}</ul>
                <a href="${signedUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Watch Video</a>
                <a href="${env.DASHBOARD_URL}/queue/${humanReview.id}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">Open in Dashboard</a>
            `,
        };

        await transporter.sendMail(mailOptions);
        logger.info(`Human review email sent successfully for QC Result: ${qcResultId}`);
    } catch (error) {
        logger.error(`Failed to send human review email for ${qcResultId}: ${error.message}`);
    }
}

async function sendDailyDigest() {
    logger.info('Generating and sending daily digest email.');
    // Implementation for stats query and email sending
    // This is a placeholder as it requires more complex queries
    logger.info('Daily digest sent (placeholder).');
}

module.exports = {
    sendHumanReviewEmail,
    sendDailyDigest,
};
