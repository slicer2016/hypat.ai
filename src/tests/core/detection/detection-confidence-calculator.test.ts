/**
 * Unit tests for the DetectionConfidenceCalculator
 */

import { DetectionConfidenceCalculator } from '../../../core/detection/utils/detection-confidence-calculator.js';
import { DetectionMethodType, DetectionScore } from '../../../core/detection/interfaces.js';

describe('DetectionConfidenceCalculator', () => {
  let calculator: DetectionConfidenceCalculator;
  
  beforeEach(() => {
    calculator = new DetectionConfidenceCalculator();
  });
  
  test('should calculate combined confidence score', () => {
    const scores: DetectionScore[] = [
      {
        method: DetectionMethodType.HEADER_ANALYSIS,
        score: 0.8,
        confidence: 0.9,
        reason: 'Test reason'
      },
      {
        method: DetectionMethodType.CONTENT_STRUCTURE,
        score: 0.6,
        confidence: 0.7,
        reason: 'Test reason'
      },
      {
        method: DetectionMethodType.SENDER_REPUTATION,
        score: 0.4,
        confidence: 0.5,
        reason: 'Test reason'
      }
    ];
    
    const combinedScore = calculator.calculateConfidence(scores);
    expect(combinedScore).toBeGreaterThan(0);
    expect(combinedScore).toBeLessThan(1);
  });
  
  test('should handle empty scores array', () => {
    const combinedScore = calculator.calculateConfidence([]);
    expect(combinedScore).toBe(0.5); // Default neutral score
  });
  
  test('should calculate verification need based on threshold', () => {
    const lowScore = 0.3;
    const midScore = 0.5;
    const highScore = 0.7;
    
    expect(calculator.needsVerification(lowScore)).toBe(false);
    expect(calculator.needsVerification(midScore)).toBe(true);
    expect(calculator.needsVerification(highScore)).toBe(false);
  });
  
  test('should return method weights', () => {
    expect(calculator.getMethodWeight(DetectionMethodType.HEADER_ANALYSIS)).toBe(0.4);
    expect(calculator.getMethodWeight(DetectionMethodType.CONTENT_STRUCTURE)).toBe(0.3);
    expect(calculator.getMethodWeight(DetectionMethodType.SENDER_REPUTATION)).toBe(0.2);
    expect(calculator.getMethodWeight(DetectionMethodType.USER_FEEDBACK)).toBe(0.1);
  });
  
  test('should weigh methods with higher confidence more', () => {
    const scoresEqualConfidence: DetectionScore[] = [
      {
        method: DetectionMethodType.HEADER_ANALYSIS,
        score: 1.0,
        confidence: 0.5,
        reason: 'Header indicator'
      },
      {
        method: DetectionMethodType.CONTENT_STRUCTURE,
        score: 0.0,
        confidence: 0.5,
        reason: 'No content indicators'
      }
    ];
    
    const scoresDifferentConfidence: DetectionScore[] = [
      {
        method: DetectionMethodType.HEADER_ANALYSIS,
        score: 1.0,
        confidence: 0.9, // Higher confidence
        reason: 'Header indicator'
      },
      {
        method: DetectionMethodType.CONTENT_STRUCTURE,
        score: 0.0,
        confidence: 0.1, // Lower confidence
        reason: 'No content indicators'
      }
    ];
    
    const scoreEqualConfidence = calculator.calculateConfidence(scoresEqualConfidence);
    const scoreDifferentConfidence = calculator.calculateConfidence(scoresDifferentConfidence);
    
    // With different confidence, the result should be closer to the high-confidence score
    expect(scoreDifferentConfidence).toBeGreaterThan(scoreEqualConfidence);
  });
});