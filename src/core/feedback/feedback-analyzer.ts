/**
 * Feedback Analyzer Implementation
 * Analyzes user feedback to identify patterns and generate insights
 */

import { 
  FeedbackAnalytics, 
  FeedbackAnalyzer, 
  FeedbackItem, 
  FeedbackRepository, 
  FeedbackType 
} from './interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the FeedbackAnalyzer interface
 */
export class FeedbackAnalyzerImpl implements FeedbackAnalyzer {
  private logger: Logger;
  private repository: FeedbackRepository;
  
  constructor(repository: FeedbackRepository) {
    this.logger = new Logger('FeedbackAnalyzer');
    this.repository = repository;
  }

  /**
   * Analyze feedback for a user
   * @param userId The ID of the user
   * @param period The time period to analyze
   */
  async analyzeFeedback(
    userId: string, 
    period: 'day' | 'week' | 'month' | 'all' = 'all'
  ): Promise<FeedbackAnalytics> {
    try {
      this.logger.info(`Analyzing feedback for user ${userId} over ${period} period`);
      
      // Get all feedback for the user within the specified period
      const feedback = await this.getFeedbackForPeriod(userId, period);
      
      this.logger.info(`Found ${feedback.length} feedback items for analysis`);
      
      // Count feedback by type
      const confirmCount = feedback.filter(item => item.type === FeedbackType.CONFIRM).length;
      const rejectCount = feedback.filter(item => item.type === FeedbackType.REJECT).length;
      const uncertainCount = feedback.filter(item => item.type === FeedbackType.UNCERTAIN).length;
      const verifyCount = feedback.filter(item => item.type === FeedbackType.VERIFY).length;
      const ignoreCount = feedback.filter(item => item.type === FeedbackType.IGNORE).length;
      
      // Calculate accuracy metrics
      const falsePositives = feedback.filter(item => item.detectionResult && item.type === FeedbackType.REJECT).length;
      const falseNegatives = feedback.filter(item => !item.detectionResult && item.type === FeedbackType.CONFIRM).length;
      const truePositives = feedback.filter(item => item.detectionResult && item.type === FeedbackType.CONFIRM).length;
      const trueNegatives = feedback.filter(item => !item.detectionResult && item.type === FeedbackType.REJECT).length;
      
      const totalClassified = truePositives + trueNegatives + falsePositives + falseNegatives;
      const accuracy = totalClassified > 0 
        ? (truePositives + trueNegatives) / totalClassified 
        : 0;
      
      // Analyze feedback by domain
      const domainBreakdown: Record<string, {
        count: number;
        confirms: number;
        rejects: number;
      }> = {};
      
      for (const item of feedback) {
        if (!item.senderDomain) continue;
        
        if (!domainBreakdown[item.senderDomain]) {
          domainBreakdown[item.senderDomain] = {
            count: 0,
            confirms: 0,
            rejects: 0
          };
        }
        
        domainBreakdown[item.senderDomain].count++;
        
        if (item.type === FeedbackType.CONFIRM) {
          domainBreakdown[item.senderDomain].confirms++;
        } else if (item.type === FeedbackType.REJECT) {
          domainBreakdown[item.senderDomain].rejects++;
        }
      }
      
      // Identify top misclassified domains
      const misclassifiedDomains = Object.entries(domainBreakdown)
        .filter(([_, stats]) => stats.count >= 3) // Only consider domains with at least 3 feedback items
        .map(([domain, stats]) => {
          const misclassificationRate = (stats.confirms > stats.rejects)
            ? stats.rejects / stats.count // Domain is mostly newsletters but has some rejects
            : stats.confirms / stats.count; // Domain is mostly not newsletters but has some confirms
          
          return { domain, misclassificationRate };
        })
        .sort((a, b) => b.misclassificationRate - a.misclassificationRate)
        .slice(0, 5)
        .map(item => item.domain);
      
      // Create the analytics object
      const analytics: FeedbackAnalytics = {
        userId,
        period,
        totalFeedback: feedback.length,
        confirmCount,
        rejectCount,
        uncertainCount,
        verifyCount,
        ignoreCount,
        accuracy,
        falsePositives,
        falseNegatives,
        domainBreakdown,
        topMisclassifiedDomains: misclassifiedDomains,
        generatedAt: new Date()
      };
      
      this.logger.info(`Completed feedback analysis for user ${userId}`);
      return analytics;
    } catch (error) {
      this.logger.error(`Error analyzing feedback: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to analyze feedback: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Identify patterns in feedback
   * @param userId The ID of the user
   */
  async identifyPatterns(userId: string): Promise<{
    frequentFeedbackSenders: string[];
    frequentFeedbackDomains: string[];
    inconsistentFeedback: FeedbackItem[];
  }> {
    try {
      this.logger.info(`Identifying feedback patterns for user ${userId}`);
      
      // Get all feedback for the user
      const feedback = await this.repository.getFeedbackForUser(userId);
      
      this.logger.info(`Found ${feedback.length} feedback items for pattern analysis`);
      
      // Identify frequent senders
      const senderCounts = new Map<string, number>();
      for (const item of feedback) {
        const count = senderCounts.get(item.sender) || 0;
        senderCounts.set(item.sender, count + 1);
      }
      
      const frequentFeedbackSenders = Array.from(senderCounts.entries())
        .filter(([_, count]) => count >= 3) // Senders with at least 3 feedback items
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([sender]) => sender);
      
      // Identify frequent domains
      const domainCounts = new Map<string, number>();
      for (const item of feedback) {
        if (!item.senderDomain) continue;
        
        const count = domainCounts.get(item.senderDomain) || 0;
        domainCounts.set(item.senderDomain, count + 1);
      }
      
      const frequentFeedbackDomains = Array.from(domainCounts.entries())
        .filter(([_, count]) => count >= 3) // Domains with at least 3 feedback items
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([domain]) => domain);
      
      // Identify inconsistent feedback (different feedback types for the same sender)
      const senderFeedbackMap = new Map<string, Map<FeedbackType, number>>();
      
      for (const item of feedback) {
        if (!senderFeedbackMap.has(item.sender)) {
          senderFeedbackMap.set(item.sender, new Map<FeedbackType, number>());
        }
        
        const typeCounts = senderFeedbackMap.get(item.sender)!;
        const count = typeCounts.get(item.type) || 0;
        typeCounts.set(item.type, count + 1);
      }
      
      // Find senders with inconsistent feedback
      const inconsistentSenders = Array.from(senderFeedbackMap.entries())
        .filter(([_, typeCounts]) => {
          // If a sender has both CONFIRM and REJECT feedback, it's inconsistent
          return typeCounts.has(FeedbackType.CONFIRM) && typeCounts.has(FeedbackType.REJECT);
        })
        .map(([sender]) => sender);
      
      // Get the feedback items for inconsistent senders
      const inconsistentFeedback = feedback.filter(item => inconsistentSenders.includes(item.sender));
      
      this.logger.info(`Identified ${frequentFeedbackSenders.length} frequent senders, ${frequentFeedbackDomains.length} frequent domains, and ${inconsistentFeedback.length} inconsistent feedback items`);
      
      return {
        frequentFeedbackSenders,
        frequentFeedbackDomains,
        inconsistentFeedback
      };
    } catch (error) {
      this.logger.error(`Error identifying patterns: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to identify patterns: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate accuracy metrics
   * @param userId The ID of the user
   */
  async calculateAccuracyMetrics(userId: string): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }> {
    try {
      this.logger.info(`Calculating accuracy metrics for user ${userId}`);
      
      // Get all feedback for the user
      const feedback = await this.repository.getFeedbackForUser(userId);
      
      // Filter out uncertain and ignore feedback
      const relevantFeedback = feedback.filter(item => 
        item.type === FeedbackType.CONFIRM || item.type === FeedbackType.REJECT
      );
      
      this.logger.info(`Found ${relevantFeedback.length} relevant feedback items for accuracy calculation`);
      
      // Count true positives, false positives, true negatives, false negatives
      const truePositives = relevantFeedback.filter(item => 
        item.detectionResult === true && item.type === FeedbackType.CONFIRM
      ).length;
      
      const falsePositives = relevantFeedback.filter(item => 
        item.detectionResult === true && item.type === FeedbackType.REJECT
      ).length;
      
      const trueNegatives = relevantFeedback.filter(item => 
        item.detectionResult === false && item.type === FeedbackType.REJECT
      ).length;
      
      const falseNegatives = relevantFeedback.filter(item => 
        item.detectionResult === false && item.type === FeedbackType.CONFIRM
      ).length;
      
      // Calculate metrics
      const accuracy = (truePositives + trueNegatives) / 
        Math.max(1, truePositives + trueNegatives + falsePositives + falseNegatives);
      
      const precision = truePositives / 
        Math.max(1, truePositives + falsePositives);
      
      const recall = truePositives / 
        Math.max(1, truePositives + falseNegatives);
      
      const f1Score = 2 * precision * recall / 
        Math.max(0.001, precision + recall);
      
      this.logger.info(`Calculated accuracy metrics for user ${userId}: accuracy=${accuracy.toFixed(2)}, precision=${precision.toFixed(2)}, recall=${recall.toFixed(2)}, f1Score=${f1Score.toFixed(2)}`);
      
      return {
        accuracy,
        precision,
        recall,
        f1Score
      };
    } catch (error) {
      this.logger.error(`Error calculating accuracy metrics: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to calculate accuracy metrics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate improvement suggestions
   * @param userId The ID of the user
   */
  async generateSuggestions(userId: string): Promise<string[]> {
    try {
      this.logger.info(`Generating improvement suggestions for user ${userId}`);
      
      // First analyze the feedback
      const analytics = await this.analyzeFeedback(userId);
      
      // Then identify patterns
      const patterns = await this.identifyPatterns(userId);
      
      // Generate suggestions based on the analysis
      const suggestions: string[] = [];
      
      // Suggestion for low accuracy
      if (analytics.accuracy < 0.8 && analytics.totalFeedback >= 10) {
        suggestions.push('Consider retraining the newsletter detection model with the latest feedback data to improve accuracy.');
      }
      
      // Suggestion for high false positives
      if (analytics.falsePositives > analytics.falseNegatives && analytics.falsePositives >= 5) {
        suggestions.push('The system is detecting too many non-newsletters as newsletters. Consider adjusting the detection threshold to reduce false positives.');
      }
      
      // Suggestion for high false negatives
      if (analytics.falseNegatives > analytics.falsePositives && analytics.falseNegatives >= 5) {
        suggestions.push('The system is missing many newsletters. Consider adjusting the detection threshold to catch more newsletters.');
      }
      
      // Suggestion for inconsistent feedback
      if (patterns.inconsistentFeedback.length >= 3) {
        suggestions.push('There is inconsistent feedback for some senders. Review the classification rules for these senders to ensure consistency.');
      }
      
      // Suggestion for misclassified domains
      if (analytics.topMisclassifiedDomains.length > 0) {
        const domains = analytics.topMisclassifiedDomains.slice(0, 3).join(', ');
        suggestions.push(`Improve detection rules for these frequently misclassified domains: ${domains}.`);
      }
      
      // Suggestion for more feedback
      if (analytics.totalFeedback < 10) {
        suggestions.push('Collect more feedback to improve the detection accuracy. The current sample size is too small for reliable analysis.');
      }
      
      // Default suggestion if none generated
      if (suggestions.length === 0) {
        suggestions.push('Continue collecting feedback to maintain detection quality.');
      }
      
      this.logger.info(`Generated ${suggestions.length} improvement suggestions for user ${userId}`);
      return suggestions;
    } catch (error) {
      this.logger.error(`Error generating suggestions: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to generate suggestions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get feedback for a specific time period
   * @param userId The user ID
   * @param period The time period
   */
  private async getFeedbackForPeriod(
    userId: string, 
    period: 'day' | 'week' | 'month' | 'all'
  ): Promise<FeedbackItem[]> {
    // Get all feedback for the user
    const allFeedback = await this.repository.getFeedbackForUser(userId);
    
    // If period is 'all', return all feedback
    if (period === 'all') {
      return allFeedback;
    }
    
    // Calculate the cutoff date based on the period
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (period) {
      case 'day':
        cutoffDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
    }
    
    // Filter feedback by timestamp
    return allFeedback.filter(item => item.timestamp >= cutoffDate);
  }
}