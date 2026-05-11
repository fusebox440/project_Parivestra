const { calculate } = require('../src/services/scoringEngine');

// Mock data
const mockCampaign = {
    keywordsMustMention: ['GlowUp', 'monsoon glow'],
    requiredAspectRatio: '9:16',
};

const baseResults = {
    formatResult: { flags: [], costUsd: 0 },
    transcriptionResult: { costUsd: 0.05 },
    transcriptResult: {
        profanityDetected: false,
        competitorMentioned: false,
        falseClaims: false,
        brandMentioned: true,
        requiredKeywordsCovered: { 'GlowUp': true, 'monsoon glow': true },
        callToActionPresent: true,
        overallToneScore: 80,
        costUsd: 0.02,
    },
    visualResult: {
        competitorProductVisible: false,
        brandUnsafeContent: false,
        visualQualityScore: 90,
        lightingScore: 85,
        frameCompositionScore: 88,
        costUsd: 0.0459,
    },
    audioResult: { audioQualityScore: 85, costUsd: 0 },
};

describe('Scoring Engine', () => {
    test('should auto-approve a high-quality video', () => {
        const result = calculate(baseResults, mockCampaign, 1000);
        expect(result.decision).toBe('APPROVED');
        expect(result.qcScore).toBeGreaterThanOrEqual(78);
        expect(result.goodnessScore).toBeGreaterThanOrEqual(65);
    });

    test('should hard fail for profanity', () => {
        const profanityResults = { ...baseResults, transcriptResult: { ...baseResults.transcriptResult, profanityDetected: true } };
        const result = calculate(profanityResults, mockCampaign, 1000);
        expect(result.decision).toBe('REJECTED');
        expect(result.qcScore).toBe(0);
        expect(result.hardFailReasons).toContain('PROFANITY_DETECTED');
    });

    test('should hard fail for competitor mention', () => {
        const competitorResults = { ...baseResults, transcriptResult: { ...baseResults.transcriptResult, competitorMentioned: true } };
        const result = calculate(competitorResults, mockCampaign, 1000);
        expect(result.decision).toBe('REJECTED');
        expect(result.hardFailReasons).toContain('COMPETITOR_MENTIONED_AUDIO');
    });

    test('should reject for a very low QC score', () => {
        const lowQcResults = {
            ...baseResults,
            transcriptResult: {
                ...baseResults.transcriptResult,
                brandMentioned: false, // -25
                requiredKeywordsCovered: { 'GlowUp': false, 'monsoon glow': false }, // -20
            },
        };
        const result = calculate(lowQcResults, mockCampaign, 1000);
        expect(result.decision).toBe('REJECTED');
        expect(result.qcScore).toBeLessThan(45);
    });

    test('should send to human review for boundary scores', () => {
        const boundaryResults = {
            ...baseResults,
            visualResult: { ...baseResults.visualResult, visualQualityScore: 50, lightingScore: 50 }, // Lower goodness
            transcriptResult: { ...baseResults.transcriptResult, callToActionPresent: false }, // Lower QC
        };
        const result = calculate(boundaryResults, mockCampaign, 1000);
        expect(result.decision).toBe('HUMAN_REVIEW');
        expect(result.qcScore).toBeLessThan(78);
        expect(result.goodnessScore).toBeLessThan(65);
    });

    test('should calculate cost correctly in INR', () => {
        const result = calculate(baseResults, mockCampaign, 1000);
        const expectedUsd = 0.05 + 0.02 + 0.0459 + 0.006; // transcription + transcript + visual + infra
        const expectedInr = expectedUsd * 84;
        expect(result.totalCostUsd).toBeCloseTo(expectedUsd);
        expect(result.totalCostInr).toBeCloseTo(expectedInr);
    });

    test('should lose 25 QC points if brand is not mentioned', () => {
        const noBrandMention = { ...baseResults, transcriptResult: { ...baseResults.transcriptResult, brandMentioned: false } };
        const withBrand = calculate(baseResults, mockCampaign, 1000);
        const withoutBrand = calculate(noBrandMention, mockCampaign, 1000);
        expect(withBrand.qcScore - withoutBrand.qcScore).toBe(25);
    });
});
