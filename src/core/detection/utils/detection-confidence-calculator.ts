/**
 * DetectionConfidenceCalculator
 * Calculates overall confidence scores for newsletter detection
 */

import { 
  DetectionMethodType, 
  DetectionScore, 
  DetectionConfidenceCalculator as IDetectionConfidenceCalculator 
} from '../interfaces.js';
import { Logger } from '../../../utils/logger.js';

export class DetectionConfidenceCalculator implements IDetectionConfidenceCalculator {
  private logger: Logger;
  
  // Default weights for each detection method
  private readonly DEFAULT_WEIGHTS: Record<DetectionMethodType, number> = {
    [DetectionMethodType.HEADER_ANALYSIS]: 0.4,  // 40%
    [DetectionMethodType.CONTENT_STRUCTURE]: 0.3, // 30%
    [DetectionMethodType.SENDER_REPUTATION]: 0.2, // 20%
    [DetectionMethodType.USER_FEEDBACK]: 0.1     // 10%
  };
  
  // Thresholds for verification
  private readonly VERIFICATION_THRESHOLDS = {
    LOW: 0.35,  // Below this is definitely not a newsletter
    HIGH: 0.65  // Above this is definitely a newsletter
  };

  constructor() {
    this.logger = new Logger('DetectionConfidenceCalculator');
  }

  /**
   * Calculate an overall confidence score from individual detection scores
   * @param scores Array of detection scores from different methods
   * @returns The combined confidence score between 0.0 and 1.0
   */
  calculateConfidence(scores: DetectionScore[]): number {
    try {
      this.logger.debug(`Calculating confidence from ${scores.length} detection methods`);
      
      if (scores.length === 0) {
        return 0.5; // Default neutral score if no methods provided
      }
      
      let totalWeight = 0;
      let weightedScore = 0;
      
      for (const score of scores) {
        // Get weight for this method
        const weight = this.getMethodWeight(score.method);
        
        // Apply confidence as a multiplier to the weight
        // This gives more influence to methods with higher confidence
        const confidenceAdjustedWeight = weight * score.confidence;
        
        // Add to the weighted sum
        weightedScore += score.score * confidenceAdjustedWeight;
        totalWeight += confidenceAdjustedWeight;
      }
      
      // Normalize the score
      if (totalWeight === 0) {
        return 0.5; // Default neutral score if all weights were 0
      }
      
      return weightedScore / totalWeight;
    } catch (error) {
      this.logger.error(`Error calculating confidence: ${error instanceof Error ? error.message : String(error)}`);
      return 0.5; // Default to neutral on error
    }
  }

  /**
   * Determine if a score requires manual verification
   * @param score The combined confidence score
   * @returns Whether verification is needed
   */
  needsVerification(score: number): boolean {
    // If the score is in the ambiguous range, it needs verification
    return score > this.VERIFICATION_THRESHOLDS.LOW && 
           score < this.VERIFICATION_THRESHOLDS.HIGH;
  }

  /**
   * Get the weight for a detection method
   * @param method The detection method type
   * @returns The weight value between 0.0 and 1.0
   */
  getMethodWeight(method: DetectionMethodType): number {
    return this.DEFAULT_WEIGHTS[method] || 0.25; // Default equal weight if method not found
  }
  
  /**
   * Set custom weight for a detection method
   * @param method The detection method type
   * @param weight The new weight value (0.0 to 1.0)
   */
  setMethodWeight(method: DetectionMethodType, weight: number): void {
    if (weight < 0 || weight > 1) {
      throw new Error('Weight must be between 0.0 and 1.0');
    }
    
    this.DEFAULT_WEIGHTS[method] = weight;
    
    // Normalize weights if needed
    const totalWeight = Object.values(this.DEFAULT_WEIGHTS).reduce((sum, w) => sum + w, 0);
    
    if (totalWeight > 1.0) {
      // Scale all weights proportionally
      for (const [m, w] of Object.entries(this.DEFAULT_WEIGHTS) as [DetectionMethodType, number][]) {
        this.DEFAULT_WEIGHTS[m] = w / totalWeight;
      }
    }
  }
  
  /**
   * Set the thresholds for verification
   * @param low Score below this is definitely not a newsletter
   * @param high Score above this is definitely a newsletter
   */
  setVerificationThresholds(low: number, high: number): void {
    if (low < 0 || low > 1 || high < 0 || high > 1 || low >= high) {
      throw new Error('Thresholds must be between 0.0 and 1.0, and low must be less than high');
    }
    
    this.VERIFICATION_THRESHOLDS.LOW = low;
    this.VERIFICATION_THRESHOLDS.HIGH = high;
  }
}