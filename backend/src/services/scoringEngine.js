const logger = require('../utils/logger');

const USD_TO_INR_RATE = 84;
const INFRA_COST_USD = 0.006;

function calculate(analysisResults, campaign, processingTimeMs) {
    const { formatResult, transcriptionResult, transcriptResult, visualResult, audioResult } = analysisResults;

    // Step 1: Hard Fail Check
    const hardFailReasons = [];
    if (transcriptResult.profanityDetected) hardFailReasons.push("PROFANITY_DETECTED");
    if (transcriptResult.competitorMentioned) hardFailReasons.push("COMPETITOR_MENTIONED_AUDIO");
    if (visualResult.competitorProductVisible) hardFailReasons.push("COMPETITOR_VISIBLE_VISUAL");
    if (transcriptResult.falseClaims) hardFailReasons.push("FALSE_CLAIMS_DETECTED");
    if (visualResult.brandUnsafeContent) hardFailReasons.push("BRAND_UNSAFE_VISUAL");

    const totalCostUsd = (transcriptionResult.costUsd || 0) +
                         (transcriptResult.costUsd || 0) +
                         (visualResult.costUsd || 0) +
                         (formatResult.costUsd || 0) +
                         (audioResult.costUsd || 0) +
                         INFRA_COST_USD;
    const totalCostInr = totalCostUsd * USD_TO_INR_RATE;

    if (hardFailReasons.length > 0) {
        logger.warn(`Hard fail triggered for submission. Reasons: ${hardFailReasons.join(', ')}`);
        return {
            qcScore: 0,
            goodnessScore: 0,
            decision: "REJECTED",
            hardFailReasons,
            flags: [], // To be implemented fully in Step 5
            totalCostUsd,
            totalCostInr,
            processingTimeMs,
        };
    }

    // Step 2: QC Score
    let qcScore = 0;
    const scoreBreakdown = {};
    if (transcriptResult.brandMentioned) {
        qcScore += 25;
        scoreBreakdown.brandMention = 25;
    }
    const keywordsCovered = Object.values(transcriptResult.requiredKeywordsCovered).filter(Boolean).length;
    const keywordScore = (keywordsCovered / campaign.keywordsMustMention.length) * 20;
    qcScore += keywordScore;
    scoreBreakdown.keywordsCoverage = keywordScore;

    if (!transcriptResult.competitorMentioned && !transcriptResult.falseClaims) {
        qcScore += 20;
        scoreBreakdown.noForbiddenKeywords = 20;
    }
    if (!formatResult.flags.some(f => f.includes('aspect ratio'))) {
        qcScore += 15;
        scoreBreakdown.aspectRatio = 15;
    }
    if (!transcriptResult.profanityDetected) {
        qcScore += 10;
        scoreBreakdown.noProfanity = 10;
    }
    if (!formatResult.flags.some(f => f.includes('duration'))) {
        qcScore += 5;
        scoreBreakdown.duration = 5;
    }
    if (transcriptResult.callToActionPresent) {
        qcScore += 5;
        scoreBreakdown.callToAction = 5;
    }

    // Step 3: Goodness Score
    const goodnessScore = (visualResult.visualQualityScore * 0.30) +
                          (audioResult.audioQualityScore * 0.20) +
                          (transcriptResult.overallToneScore * 0.20) +
                          (visualResult.lightingScore * 0.15) +
                          (visualResult.frameCompositionScore * 0.15);

    // Step 4: Decision Logic
    let decision = 'HUMAN_REVIEW';
    if (qcScore >= 78 && goodnessScore >= 65) {
        decision = 'APPROVED';
    } else if (qcScore < 45) {
        decision = 'REJECTED';
    }

    // Step 5: Flags (Simplified for now)
    const flags = [];
    // This would be a more complex mapping function
    if (!transcriptResult.brandMentioned) flags.push({ code: "MISSING_BRAND_MENTION", severity: "HIGH", detail: "Brand not mentioned" });
    if (qcScore < 45) flags.push({ code: "LOW_QC_SCORE", severity: "HIGH", detail: `QC score of ${qcScore.toFixed(0)} is below threshold` });


    return {
        qcScore: Math.round(qcScore),
        goodnessScore: Math.round(goodnessScore),
        decision,
        hardFailReasons,
        flags,
        scoreBreakdown,
        totalCostUsd,
        totalCostInr,
        processingTimeMs,
    };
}

module.exports = { calculate };
