const HARD_FAIL_MESSAGES = {
    PROFANITY_DETECTED: "Profanity detected in audio",
    COMPETITOR_MENTIONED_AUDIO: "Competitor brand mentioned in audio",
    COMPETITOR_VISIBLE_VISUAL: "Competitor product visible in video",
    FALSE_CLAIMS_DETECTED: "Unverified product claims detected",
    BRAND_UNSAFE_VISUAL: "Brand-unsafe content detected in visuals",
};

function generateCreatorFeedback(qcResult, campaign, creator) {
    const { decision, qcScore, goodnessScore, hardFailReasons, flags } = qcResult;
    const creatorName = creator.name.split(' ')[0];
    const campaignName = campaign.name;

    switch (decision) {
        case 'APPROVED':
            return `✅ Great news ${creatorName}!\nYour video for ${campaignName} has been approved.\nQC Score: ${qcScore}/100 | Quality: ${goodnessScore}/100\nYou're all set to post! 🎉`;

        case 'REJECTED':
            if (hardFailReasons && hardFailReasons.length > 0) {
                const issues = hardFailReasons.map(reason => `- ${HARD_FAIL_MESSAGES[reason] || 'A critical issue was found.'}`).join('\n');
                return `❌ Hi ${creatorName}, your video for ${campaignName} needs to be revised before we can approve it.\n\nIssues that must be fixed:\n${issues}\n\nPlease fix these issues and resubmit. Questions? Contact your campaign manager.`;
            }
            // Top 3 HIGH severity flags
            const topIssues = flags
                .filter(f => f.severity === 'HIGH')
                .slice(0, 3)
                .map(f => `- ${f.detail}${f.timestamps ? ` (at ${f.timestamps[0].start}s)` : ''}`)
                .join('\n');
            return `❌ Hi ${creatorName}, your video for ${campaignName} didn't meet our QC standards.\n\nIssues found:\n${topIssues || '- General compliance issues were found.'}\n\nPlease revise and resubmit.`;

        case 'HUMAN_REVIEW':
            return `⏳ Hi ${creatorName}, your video for ${campaignName} is being reviewed by our team.\nExpected response: within 24 hours.\nWe'll update you here.`;

        default:
            return `Hi ${creatorName}, there was an update on your submission for ${campaignName}. Please contact your campaign manager for details.`;
    }
}

module.exports = { generateCreatorFeedback };
