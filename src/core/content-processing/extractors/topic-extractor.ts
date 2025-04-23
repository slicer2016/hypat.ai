/**
 * Topic Extractor
 * Extracts topics and keywords from newsletter content
 */

import { Topic, TopicExtractor } from '../../../interfaces/content-processing.js';
import { Logger } from '../../../utils/logger.js';

export class TopicExtractorImpl implements TopicExtractor {
  private logger: Logger;
  private stopWords: Set<string>;

  constructor() {
    this.logger = new Logger('TopicExtractor');
    
    // Initialize common English stop words
    this.stopWords = new Set([
      'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
      'at', 'from', 'by', 'on', 'off', 'for', 'in', 'out', 'over', 'to',
      'into', 'with', 'about', 'against', 'between', 'into', 'through',
      'during', 'before', 'after', 'above', 'below', 'up', 'down', 'of',
      'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
      'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she',
      'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
      'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
      'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would',
      'should', 'could', 'ought', 'will', 'shall', 'can', 'may', 'might', 'must',
      'now'
    ]);
  }

  /**
   * Extract topics from content
   * @param text The text content
   */
  async extractTopics(text: string): Promise<Topic[]> {
    try {
      this.logger.debug('Extracting topics from content');
      
      // Extract keywords first
      const keywords = await this.extractKeywords(text);
      
      // Group related keywords to form topics
      const topicGroups = this.groupKeywordsIntoTopics(keywords, text);
      
      // Calculate confidence scores
      const topics = await this.calculateConfidence(topicGroups, text);
      
      // Sort by confidence score (descending)
      return topics.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      this.logger.error(`Error extracting topics: ${error instanceof Error ? error.message : String(error)}`);
      return []; // Return empty array in case of error
    }
  }

  /**
   * Extract keywords from content
   * @param text The text content
   */
  async extractKeywords(text: string): Promise<string[]> {
    try {
      this.logger.debug('Extracting keywords from content');
      
      // Normalize text
      const normalizedText = text.toLowerCase();
      
      // Remove special characters and split into words
      const words = normalizedText
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !this.stopWords.has(word));
      
      // Count word frequency
      const wordCounts: Record<string, number> = {};
      for (const word of words) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
      
      // Sort by frequency and get top keywords
      const sortedWords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20) // Get top 20 keywords
        .map(entry => entry[0]);
      
      return sortedWords;
    } catch (error) {
      this.logger.error(`Error extracting keywords: ${error instanceof Error ? error.message : String(error)}`);
      return []; // Return empty array in case of error
    }
  }

  /**
   * Calculate confidence scores for topics
   * @param topics The topics to score
   * @param text The original text
   */
  async calculateConfidence(topics: Topic[], text: string): Promise<Topic[]> {
    try {
      this.logger.debug(`Calculating confidence for ${topics.length} topics`);
      
      // Calculate total word count
      const wordCount = text.split(/\s+/).length;
      
      // Score each topic based on keyword frequency and position
      return topics.map(topic => {
        // Calculate normalized frequency of keywords in the text
        let frequencyScore = 0;
        for (const keyword of topic.keywords) {
          const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = text.match(keywordRegex);
          if (matches) {
            frequencyScore += matches.length / wordCount;
          }
        }
        
        // Position score: keywords appearing earlier in the text are more important
        let positionScore = 0;
        const firstParagraphs = text.split('\n').slice(0, 3).join(' ');
        for (const keyword of topic.keywords) {
          if (firstParagraphs.toLowerCase().includes(keyword.toLowerCase())) {
            positionScore += 0.2; // Add bonus for keywords in first 3 paragraphs
          }
        }
        
        // Context score: keywords appearing in headers or emphasized text are more important
        let contextScore = 0;
        // This would be better with HTML context but we're working with plain text
        
        // Calculate final confidence score (normalized to 0-1 range)
        const confidenceScore = Math.min(
          0.95, // Cap at 0.95 to avoid overconfidence
          (frequencyScore * 0.5) + (positionScore * 0.3) + (contextScore * 0.2)
        );
        
        return {
          ...topic,
          confidence: Number(confidenceScore.toFixed(2))
        };
      });
    } catch (error) {
      this.logger.error(`Error calculating topic confidence: ${error instanceof Error ? error.message : String(error)}`);
      
      // In case of error, set a default low confidence
      return topics.map(topic => ({
        ...topic,
        confidence: 0.3
      }));
    }
  }

  /**
   * Group keywords into topics
   * @param keywords The keywords to group
   * @param text The original text for context
   */
  private groupKeywordsIntoTopics(keywords: string[], text: string): Topic[] {
    try {
      // This is a simplified implementation that could be improved with NLP
      const topics: Topic[] = [];
      const usedKeywords = new Set<string>();
      
      // Use simple string distance to group related keywords
      for (const keyword of keywords) {
        if (usedKeywords.has(keyword)) continue;
        
        // This keyword starts a new topic
        const relatedKeywords = [keyword];
        usedKeywords.add(keyword);
        
        // Find related keywords
        for (const otherKeyword of keywords) {
          if (usedKeywords.has(otherKeyword)) continue;
          
          // Simple check: are the keywords often near each other in the text?
          const nearbyCount = this.countNearbyOccurrences(text, keyword, otherKeyword, 50);
          if (nearbyCount > 0 || this.areKeywordsSimilar(keyword, otherKeyword)) {
            relatedKeywords.push(otherKeyword);
            usedKeywords.add(otherKeyword);
            
            // Limit related keywords to prevent over-grouping
            if (relatedKeywords.length >= 5) break;
          }
        }
        
        // Create a topic name from the most significant keyword
        const topicName = this.capitalizeFirstLetter(relatedKeywords[0]);
        
        topics.push({
          name: topicName,
          confidence: 0, // Will be calculated later
          keywords: relatedKeywords,
          context: this.extractKeywordContext(text, relatedKeywords[0])
        });
      }
      
      return topics;
    } catch (error) {
      this.logger.error(`Error grouping keywords into topics: ${error instanceof Error ? error.message : String(error)}`);
      
      // In case of error, create individual topics for each keyword
      return keywords.slice(0, 5).map(keyword => ({
        name: this.capitalizeFirstLetter(keyword),
        confidence: 0,
        keywords: [keyword]
      }));
    }
  }

  /**
   * Count how many times two keywords appear near each other
   * @param text The text to search in
   * @param keyword1 First keyword
   * @param keyword2 Second keyword
   * @param distance Maximum character distance between keywords
   */
  private countNearbyOccurrences(text: string, keyword1: string, keyword2: string, distance: number): number {
    const lowerText = text.toLowerCase();
    const lowerKeyword1 = keyword1.toLowerCase();
    const lowerKeyword2 = keyword2.toLowerCase();
    
    let count = 0;
    let lastIndex = 0;
    
    // Find all occurrences of keyword1
    while ((lastIndex = lowerText.indexOf(lowerKeyword1, lastIndex)) !== -1) {
      // Check if keyword2 is within the specified distance
      const nearby = lowerText.substring(
        Math.max(0, lastIndex - distance),
        Math.min(lowerText.length, lastIndex + lowerKeyword1.length + distance)
      );
      
      if (nearby.includes(lowerKeyword2)) {
        count++;
      }
      
      lastIndex += lowerKeyword1.length;
    }
    
    return count;
  }

  /**
   * Check if two keywords are similar
   * @param keyword1 First keyword
   * @param keyword2 Second keyword
   */
  private areKeywordsSimilar(keyword1: string, keyword2: string): boolean {
    // Simple check: one is a substring of the other
    if (keyword1.includes(keyword2) || keyword2.includes(keyword1)) {
      return true;
    }
    
    // Simple check: they have a significant common substring
    if (keyword1.length > 4 && keyword2.length > 4) {
      for (let i = 0; i < keyword1.length - 3; i++) {
        const substring = keyword1.substring(i, i + 4);
        if (keyword2.includes(substring)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Extract context around a keyword
   * @param text The full text
   * @param keyword The keyword to find context for
   */
  private extractKeywordContext(text: string, keyword: string): string {
    const lowerText = text.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    
    const keywordIndex = lowerText.indexOf(lowerKeyword);
    if (keywordIndex === -1) return '';
    
    const contextStart = Math.max(0, keywordIndex - 50);
    const contextEnd = Math.min(text.length, keywordIndex + keyword.length + 50);
    
    return text.substring(contextStart, contextEnd).trim();
  }

  /**
   * Capitalize the first letter of a string
   * @param str The string to capitalize
   */
  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}