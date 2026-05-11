const HARD_FAIL_MESSAGES = {
    PROFANITY_DETECTED: "Profanity was detected in the audio.",
    COMPETITOR_MENTIONED_AUDIO: "A competitor brand was mentioned in the audio.",
    COMPETITOR_VISIBLE_VISUAL: "A competitor's product or logo was visible in the video.",
    FALSE_CLAIMS_DETECTED: "The video contains unverified or misleading product claims.",
    BRAND_UNSAFE_VISUAL: "The video contains content considered unsafe for our brand.",
};

const truncate = (str, len) => str.length > len ? str.substring(0, len - 3) + "..." : str;

const buildApprovedMessage = ({ creatorName, campaignName, qcScore, goodnessScore }) => {
    const message = `✅ Great news ${creatorName}!\n\nYour video for the "${campaignName}" campaign has been approved.\n\nQC Score: ${qcScore}/100\nQuality Score: ${goodnessScore}/100\n\nYou're all set to post! 🎉`;
    return truncate(message, 1000);
};

const buildRejectedMessage = ({ creatorName, campaignName, hardFailReasons, topFlags }) => {
    let issues;
    if (hardFailReasons && hardFailReasons.length > 0) {
        issues = hardFailReasons.map(reason => `- ${HARD_FAIL_MESSAGES[reason] || 'A critical issue was found.'}`).join('\n');
    } else {
        issues = topFlags
            .slice(0, 3)
            .map(f => `- ${f.detail}${f.timestamps ? ` (around ${Math.round(f.timestamps[0].start)}s)` : ''}`)
            .join('\n');
    }
    const message = `❌ Hi ${creatorName},\n\nYour video for the "${campaignName}" campaign needs to be revised before we can approve it.\n\nIssues found:\n${issues}\n\nPlease fix these issues and resubmit. If you have questions, contact your campaign manager.`;
    return truncate(message, 1000);
};

const buildHumanReviewMessage = ({ creatorName, campaignName }) => {
    const message = `⏳ Hi ${creatorName},\n\nYour video for the "${campaignName}" campaign is now being reviewed by our team.\n\nWe expect to have feedback for you within 24 hours. We'll send you an update here as soon as the review is complete.`;
    return truncate(message, 1000);
};

const buildReceivedMessage = () => "✅ Video received! We'll review it and get back to you shortly.";
const buildAlreadyProcessingMessage = () => "⏳ Still processing your previous video. Please wait for that to complete before submitting a new one.";
const buildAlreadyApprovedMessage = () => "✅ Your video for this campaign has already been approved!";
const buildNotRegisteredMessage = () => "Your phone number is not registered with us. Please contact your campaign manager to get set up.";
const buildNoCampaignMessage = () => "We couldn't find an active campaign for you at the moment. Please contact your campaign manager.";

module.exports = {
    buildApprovedMessage,
    buildRejectedMessage,
    buildHumanReviewMessage,
    buildReceivedMessage,
    buildAlreadyProcessingMessage,
    buildAlreadyApprovedMessage,
    buildNotRegisteredMessage,
    buildNoCampaignMessage,
};
