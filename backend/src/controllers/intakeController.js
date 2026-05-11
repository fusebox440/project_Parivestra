const { z } = require('zod');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const { validateTwilioSignature, sendWhatsAppMessage, maskPhone } = require('../utils/twilioHelper');
const storageService = require('../services/storageService');
const { addVideoJob } = require('../config/queue');
const logger = require('../utils/logger');
const templates = require('../config/messageTemplates');

const prisma = new PrismaClient();

const handleWhatsAppWebhook = async (req, res) => {
    if (!validateTwilioSignature(req)) {
        logger.warn('Invalid Twilio signature received.');
        return res.status(403).send('Forbidden');
    }

    const { From: phone, MediaUrl0: mediaUrl, MediaContentType0: mediaType } = req.body;
    const maskedPhone = maskPhone(phone);

    try {
        const creator = await prisma.creator.findUnique({ where: { phone } });
        if (!creator) {
            logger.warn(`Creator not found for phone: ${maskedPhone}`);
            await sendWhatsAppMessage(phone, templates.buildNotRegisteredMessage());
            return res.status(200).send();
        }

        const deliverable = await prisma.deliverable.findFirst({
            where: {
                creatorId: creator.id,
                campaign: {
                    status: 'ACTIVE',
                    endDate: { gt: new Date() },
                },
                OR: [
                    { status: 'PENDING' },
                    { status: 'REJECTED' },
                ]
            },
            orderBy: { dueDate: 'asc' },
            include: { campaign: true },
        });

        if (!deliverable) {
            logger.warn(`No active/pending deliverable found for creator: ${creator.id}`);
            await sendWhatsAppMessage(phone, templates.buildNoCampaignMessage());
            return res.status(200).send();
        }

        const latestSubmission = await prisma.videoSubmission.findFirst({
            where: { deliverableId: deliverable.id },
            orderBy: { receivedAt: 'desc' },
            include: { qcResult: true },
        });

        if (latestSubmission) {
            if (['QUEUED', 'PROCESSING'].includes(latestSubmission.status)) {
                await sendWhatsAppMessage(phone, templates.buildAlreadyProcessingMessage());
                return res.status(200).send();
            }
            if (latestSubmission.qcResult && latestSubmission.qcResult.decision === 'APPROVED') {
                await sendWhatsAppMessage(phone, templates.buildAlreadyApprovedMessage());
                return res.status(200).send();
            }
        }
        
        if (!mediaUrl || !mediaType || !mediaType.startsWith('video/')) {
            await sendWhatsAppMessage(phone, 'Please send a video file for QC review.');
            return res.status(200).send();
        }

        const isResubmission = latestSubmission && latestSubmission.qcResult && latestSubmission.qcResult.decision === 'REJECTED';
        
        const videoResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        const videoBuffer = Buffer.from(videoResponse.data);

        const key = `${deliverable.campaignId}/${creator.id}/${Date.now()}_whatsapp.mp4`;
        const { url: r2Url } = await storageService.uploadVideo(videoBuffer, key, mediaType);

        const submissionPayload = { ...req.body };
        if (isResubmission) {
            submissionPayload.resubmission = true;
            submissionPayload.previousSubmissionId = latestSubmission.id;
        }

        const submission = await prisma.videoSubmission.create({
            data: {
                deliverableId: deliverable.id,
                videoUrl: r2Url,
                receivedAt: new Date(),
                source: 'WHATSAPP',
                rawWhatsappPayload: submissionPayload,
                status: 'QUEUED',
            },
        });

        await addVideoJob(submission.id);

        const replyMessage = isResubmission 
            ? "Got your updated video! Re-running QC now. ⏳"
            : templates.buildReceivedMessage();
        await sendWhatsAppMessage(phone, replyMessage);
        
        res.status(200).send();

    } catch (error) {
        logger.error(`Error handling WhatsApp webhook for ${maskedPhone}: ${error.message}`);
        await sendWhatsAppMessage(phone, 'An error occurred while processing your video. Please try again later.');
        res.status(500).send('Internal Server Error');
    }
};

const webUploadSchema = z.object({
    creatorId: z.string().cuid(),
    deliverableId: z.string().cuid(),
});

const handleWebUpload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No video file uploaded.' });
    }

    try {
        const { creatorId, deliverableId } = webUploadSchema.parse(req.body);

        const deliverable = await prisma.deliverable.findUnique({
            where: { id: deliverableId },
        });

        if (!deliverable || deliverable.creatorId !== creatorId) {
            return res.status(403).json({ success: false, message: 'Invalid deliverable or creator.' });
        }

        const key = `${deliverable.campaignId}/${creatorId}/${Date.now()}_${req.file.originalname}`;
        const { url: r2Url } = await storageService.uploadVideo(req.file.buffer, key, req.file.mimetype);

        const submission = await prisma.videoSubmission.create({
            data: {
                deliverableId: deliverable.id,
                videoUrl: r2Url,
                receivedAt: new Date(),
                source: 'UPLOAD',
                status: 'QUEUED',
            },
        });

        await addVideoJob(submission.id);

        res.status(201).json({
            success: true,
            submissionId: submission.id,
            message: 'Video queued for processing. You will be notified via WhatsApp.',
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, errors: error.errors });
        }
        logger.error(`Error handling web upload: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};


module.exports = {
    handleWhatsAppWebhook,
    handleWebUpload,
};
