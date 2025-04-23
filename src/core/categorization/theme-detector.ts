/**
 * Theme Detector Implementation
 * Identifies themes across newsletters based on content analysis
 */

import { v4 as uuidv4 } from 'uuid';
import { Theme, ThemeDetector } from './interfaces.js';
import { ExtractedContent, Topic } from '../../interfaces/content-processing.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of ThemeDetector
 */
export class ThemeDetectorImpl implements ThemeDetector {
  private logger: Logger;
  private themes: Map<string, Theme>;
  private stopWords: Set<string>;

  constructor() {
    this.logger = new Logger('ThemeDetector');
    this.themes = new Map<string, Theme>();
    
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
      'now', 'there', 'here', 'just', 'very', 'so', 'really'
    ]);
  }

  /**
   * Detect themes in newsletter content
   * @param content The extracted content to analyze
   */
  async detectThemes(content: ExtractedContent): Promise<Theme[]> {
    try {
      this.logger.debug(`Detecting themes for newsletter: ${content.newsletterId}`);
      
      // 1. Extract relevant data from content
      const { newsletterId, topics, structure } = content;
      const title = structure.title;
      const plainText = content.plainText;
      
      // 2. Use topics to bootstrap theme detection
      const potentialThemes: Theme[] = [];
      
      // Create themes from topics with high confidence
      for (const topic of topics.filter(t => t.confidence > 0.6)) {
        const now = new Date();
        const themeId = uuidv4();
        
        const theme: Theme = {
          id: themeId,
          name: topic.name,
          description: `Theme based on topic '${topic.name}' extracted from newsletter`,
          keywords: [...topic.keywords],
          relatedCategories: [],
          relatedNewsletters: [newsletterId],
          sentiment: this.calculateSentiment(topic.context || ''),
          strength: topic.confidence,
          createdAt: now,
          updatedAt: now
        };
        
        potentialThemes.push(theme);
      }
      
      // 3. Extract additional themes from title and content
      const titleWords = this.tokenizeAndNormalize(title);
      const contentWords = this.tokenizeAndNormalize(plainText);
      
      // Calculate word frequencies
      const wordFrequencies = this.calculateWordFrequencies(contentWords);
      
      // Extract entities (simple implementation - in a real system, use NLP)
      const entities = this.extractEntities(plainText);
      
      // Create themes from entities
      for (const entity of entities) {
        // Skip if entity is already covered by a topic
        if (potentialThemes.some(theme => 
          theme.keywords.includes(entity.toLowerCase()) || 
          theme.name.toLowerCase() === entity.toLowerCase()
        )) {
          continue;
        }
        
        const now = new Date();
        const themeId = uuidv4();
        
        // Find related words
        const relatedWords = this.findRelatedWords(entity, contentWords, wordFrequencies);
        
        const theme: Theme = {
          id: themeId,
          name: entity,
          description: `Theme based on entity '${entity}' extracted from newsletter`,
          keywords: [entity.toLowerCase(), ...relatedWords],
          relatedCategories: [],
          relatedNewsletters: [newsletterId],
          sentiment: this.calculateSentiment(plainText),
          strength: 0.7, // Default strength for entity-based themes
          createdAt: now,
          updatedAt: now
        };
        
        potentialThemes.push(theme);
      }
      
      // 4. Merge similar themes
      const mergedThemes = await this.mergeThemes(potentialThemes);
      
      // 5. Store themes
      for (const theme of mergedThemes) {
        this.themes.set(theme.id, theme);
      }
      
      // 6. Update existing themes with new content
      const existingThemes = Array.from(this.themes.values())
        .filter(theme => !mergedThemes.some(t => t.id === theme.id));
      
      const updatedThemes = await this.updateThemes(content, existingThemes);
      
      // Return newly created and updated themes
      return [...mergedThemes, ...updatedThemes];
    } catch (error) {
      this.logger.error(`Error detecting themes: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Update existing themes with new content
   * @param content The new content
   * @param existingThemes Existing themes to update
   */
  async updateThemes(content: ExtractedContent, existingThemes: Theme[]): Promise<Theme[]> {
    try {
      this.logger.debug(`Updating themes for newsletter: ${content.newsletterId}`);
      
      const { newsletterId, plainText, topics } = content;
      const updatedThemes: Theme[] = [];
      
      for (const theme of existingThemes) {
        let shouldUpdate = false;
        let strengthDelta = 0;
        
        // Check if theme keywords are present in the content
        const keywordMatches = theme.keywords.filter(keyword => 
          plainText.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (keywordMatches.length > 0) {
          shouldUpdate = true;
          
          // Calculate how much to strengthen the theme
          const matchRatio = keywordMatches.length / theme.keywords.length;
          strengthDelta = matchRatio * 0.1; // Max 0.1 increase per newsletter
          
          // Add newsletter to related newsletters if not already present
          if (!theme.relatedNewsletters.includes(newsletterId)) {
            theme.relatedNewsletters.push(newsletterId);
          }
          
          // Extract new keywords from matching topics
          const matchingTopics = topics.filter(topic => 
            keywordMatches.some(keyword => 
              topic.name.toLowerCase().includes(keyword.toLowerCase()) || 
              topic.keywords.some(k => k.toLowerCase() === keyword.toLowerCase())
            )
          );
          
          // Add new keywords
          for (const topic of matchingTopics) {
            for (const keyword of topic.keywords) {
              if (!theme.keywords.includes(keyword) && !this.stopWords.has(keyword)) {
                theme.keywords.push(keyword);
              }
            }
          }
        }
        
        if (shouldUpdate) {
          // Update theme
          theme.strength = Math.min(1.0, theme.strength + strengthDelta);
          theme.updatedAt = new Date();
          
          // Check if theme is trending (multiple recent updates)
          const daysSinceCreation = (theme.updatedAt.getTime() - theme.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          const updateFrequency = theme.relatedNewsletters.length / Math.max(1, daysSinceCreation);
          theme.trending = updateFrequency > 0.5; // More than one update every 2 days
          
          // Store updated theme
          this.themes.set(theme.id, theme);
          updatedThemes.push(theme);
        }
      }
      
      return updatedThemes;
    } catch (error) {
      this.logger.error(`Error updating themes: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Merge similar themes
   * @param themes The themes to merge
   */
  async mergeThemes(themes: Theme[]): Promise<Theme[]> {
    try {
      this.logger.debug(`Merging ${themes.length} themes`);
      
      if (themes.length <= 1) {
        return themes;
      }
      
      const mergedThemes: Theme[] = [];
      const themesToProcess = [...themes];
      
      while (themesToProcess.length > 0) {
        const currentTheme = themesToProcess.shift()!;
        let mergedIntoExisting = false;
        
        // Check if this theme can be merged with any existing merged theme
        for (let i = 0; i < mergedThemes.length; i++) {
          const similarity = this.calculateThemeSimilarity(currentTheme, mergedThemes[i]);
          
          if (similarity > 0.7) { // Similarity threshold
            // Merge themes
            mergedThemes[i] = this.mergeThemePair(mergedThemes[i], currentTheme);
            mergedIntoExisting = true;
            break;
          }
        }
        
        // If not merged, add as a new merged theme
        if (!mergedIntoExisting) {
          mergedThemes.push(currentTheme);
        }
      }
      
      this.logger.debug(`Merged ${themes.length} themes into ${mergedThemes.length} themes`);
      return mergedThemes;
    } catch (error) {
      this.logger.error(`Error merging themes: ${error instanceof Error ? error.message : String(error)}`);
      return themes;
    }
  }

  /**
   * Get themes by keywords
   * @param keywords The keywords to search for
   */
  async getThemesByKeywords(keywords: string[]): Promise<Theme[]> {
    try {
      this.logger.debug(`Getting themes by keywords: ${keywords.join(', ')}`);
      
      if (keywords.length === 0) {
        return [];
      }
      
      const matchingThemes: Theme[] = [];
      const normalizedKeywords = keywords.map(k => k.toLowerCase());
      
      for (const theme of this.themes.values()) {
        // Check if any theme keyword matches the search keywords
        const matches = theme.keywords.filter(keyword => 
          normalizedKeywords.some(searchKeyword => 
            keyword.toLowerCase().includes(searchKeyword) || 
            searchKeyword.includes(keyword.toLowerCase())
          )
        );
        
        if (matches.length > 0) {
          // Calculate match score based on number of matching keywords
          const matchScore = matches.length / Math.max(normalizedKeywords.length, theme.keywords.length);
          
          // Only include if match score is above threshold
          if (matchScore > 0.3) {
            matchingThemes.push(theme);
          }
        }
      }
      
      // Sort by strength descending
      return matchingThemes.sort((a, b) => b.strength - a.strength);
    } catch (error) {
      this.logger.error(`Error getting themes by keywords: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Get related themes
   * @param themeId The ID of the theme to find related themes for
   */
  async getRelatedThemes(themeId: string): Promise<Theme[]> {
    try {
      this.logger.debug(`Getting related themes for theme: ${themeId}`);
      
      const theme = this.themes.get(themeId);
      if (!theme) {
        this.logger.warn(`Theme not found: ${themeId}`);
        return [];
      }
      
      const relatedThemes: Array<{ theme: Theme; similarity: number }> = [];
      
      // Calculate similarity with all other themes
      for (const otherTheme of this.themes.values()) {
        if (otherTheme.id === themeId) {
          continue;
        }
        
        const similarity = this.calculateThemeSimilarity(theme, otherTheme);
        
        // Only include if similarity is above threshold
        if (similarity > 0.4) {
          relatedThemes.push({ theme: otherTheme, similarity });
        }
      }
      
      // Sort by similarity descending
      return relatedThemes
        .sort((a, b) => b.similarity - a.similarity)
        .map(item => item.theme);
    } catch (error) {
      this.logger.error(`Error getting related themes: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Tokenize and normalize text
   * @param text Text to tokenize
   */
  private tokenizeAndNormalize(text: string): string[] {
    // Tokenize (split into words)
    const tokens = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/) // Split by whitespace
      .filter(token => token.length > 2 && !this.stopWords.has(token)); // Remove stop words and short tokens
    
    return tokens;
  }

  /**
   * Calculate word frequencies
   * @param words List of words
   */
  private calculateWordFrequencies(words: string[]): Map<string, number> {
    const frequencies = new Map<string, number>();
    
    for (const word of words) {
      frequencies.set(word, (frequencies.get(word) || 0) + 1);
    }
    
    return frequencies;
  }

  /**
   * Extract entities (simple implementation)
   * @param text Text to extract entities from
   */
  private extractEntities(text: string): string[] {
    // In a real implementation, this would use NLP for named entity recognition
    // This is a simplified version that looks for capitalized words
    
    const entities: string[] = [];
    const capitalizedRegex = /\b[A-Z][a-z]{2,}\b/g;
    const possibleEntities = text.match(capitalizedRegex) || [];
    
    // Filter out common capitalized words that aren't entities
    const commonWords = new Set(['I', 'The', 'A', 'An', 'This', 'That', 'These', 'Those', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']);
    
    for (const entity of possibleEntities) {
      if (!commonWords.has(entity) && !this.stopWords.has(entity.toLowerCase())) {
        entities.push(entity);
      }
    }
    
    // Look for multi-word entities (adjacent capitalized words)
    const multiWordRegex = /\b([A-Z][a-z]{1,}(?:\s+[A-Z][a-z]{1,})+)\b/g;
    const multiWordEntities = text.match(multiWordRegex) || [];
    entities.push(...multiWordEntities);
    
    // Remove duplicates
    return [...new Set(entities)];
  }

  /**
   * Find related words for an entity
   * @param entity Entity to find related words for
   * @param words All words in the content
   * @param frequencies Word frequencies
   */
  private findRelatedWords(entity: string, words: string[], frequencies: Map<string, number>): string[] {
    const relatedWords: string[] = [];
    const entityIndex = words.findIndex(w => w.toLowerCase() === entity.toLowerCase());
    
    if (entityIndex === -1) {
      return relatedWords;
    }
    
    // Get words in the vicinity of the entity
    const contextWindow = 5; // Words before and after
    const start = Math.max(0, entityIndex - contextWindow);
    const end = Math.min(words.length, entityIndex + contextWindow + 1);
    
    const contextWords = words.slice(start, end);
    
    // Filter to words that appear frequently
    const avgFrequency = Array.from(frequencies.values()).reduce((sum, freq) => sum + freq, 0) / frequencies.size;
    
    for (const word of contextWords) {
      if (word.toLowerCase() !== entity.toLowerCase() && 
          !this.stopWords.has(word) && 
          (frequencies.get(word) || 0) >= avgFrequency) {
        relatedWords.push(word);
      }
    }
    
    // Limit to top related words
    return [...new Set(relatedWords)].slice(0, 10);
  }

  /**
   * Calculate sentiment for a piece of text (simple implementation)
   * @param text Text to analyze
   */
  private calculateSentiment(text: string): number {
    // In a real implementation, this would use a proper sentiment analysis library
    // This is a simplified version using positive and negative word lists
    
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'best', 'better', 'improve', 'improved', 'improvement', 'improving',
      'positive', 'success', 'successful', 'benefit', 'beneficial',
      'achievement', 'achieve', 'accomplished', 'win', 'winning', 'won',
      'recommend', 'recommended', 'like', 'love', 'enjoy', 'enjoyed'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'horrible', 'awful', 'poor', 'worst',
      'worse', 'problem', 'issue', 'fail', 'failed', 'failing', 'failure',
      'negative', 'difficult', 'hard', 'complicated', 'challenge',
      'dislike', 'hate', 'avoid', 'frustrating', 'disappointing',
      'disappointed', 'useless', 'waste', 'error', 'bug', 'broken'
    ];
    
    const tokens = this.tokenizeAndNormalize(text.toLowerCase());
    let positiveCount = 0;
    let negativeCount = 0;
    
    for (const token of tokens) {
      if (positiveWords.includes(token)) {
        positiveCount++;
      } else if (negativeWords.includes(token)) {
        negativeCount++;
      }
    }
    
    const total = positiveCount + negativeCount;
    if (total === 0) {
      return 0; // Neutral
    }
    
    // Return sentiment from -1 (negative) to 1 (positive)
    return (positiveCount - negativeCount) / total;
  }

  /**
   * Calculate similarity between two themes
   * @param theme1 First theme
   * @param theme2 Second theme
   */
  private calculateThemeSimilarity(theme1: Theme, theme2: Theme): number {
    // Jaccard similarity on keywords
    const keywords1 = new Set(theme1.keywords.map(k => k.toLowerCase()));
    const keywords2 = new Set(theme2.keywords.map(k => k.toLowerCase()));
    
    const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
    const union = new Set([...keywords1, ...keywords2]);
    
    // Calculate Jaccard similarity
    const keywordSimilarity = intersection.size / union.size;
    
    // Calculate overlap in related newsletters
    const newsletters1 = new Set(theme1.relatedNewsletters);
    const newsletters2 = new Set(theme2.relatedNewsletters);
    
    const newsletterIntersection = new Set([...newsletters1].filter(x => newsletters2.has(x)));
    const newsletterUnion = new Set([...newsletters1, ...newsletters2]);
    
    const newsletterSimilarity = newsletterIntersection.size / newsletterUnion.size;
    
    // Calculate name similarity
    const nameSimilarity = theme1.name.toLowerCase() === theme2.name.toLowerCase() ? 1.0 :
      theme1.name.toLowerCase().includes(theme2.name.toLowerCase()) || 
      theme2.name.toLowerCase().includes(theme1.name.toLowerCase()) ? 0.7 : 0.0;
    
    // Calculate weighted similarity
    return (keywordSimilarity * 0.5) + (newsletterSimilarity * 0.3) + (nameSimilarity * 0.2);
  }

  /**
   * Merge two themes
   * @param theme1 First theme
   * @param theme2 Second theme
   */
  private mergeThemePair(theme1: Theme, theme2: Theme): Theme {
    const now = new Date();
    
    // Determine which theme is stronger
    const baseTheme = theme1.strength >= theme2.strength ? theme1 : theme2;
    const otherTheme = theme1.strength >= theme2.strength ? theme2 : theme1;
    
    // Merge keywords (remove duplicates)
    const mergedKeywords = [...new Set([...baseTheme.keywords, ...otherTheme.keywords])];
    
    // Merge related newsletters (remove duplicates)
    const mergedNewsletters = [...new Set([...baseTheme.relatedNewsletters, ...otherTheme.relatedNewsletters])];
    
    // Merge related categories (remove duplicates)
    const mergedCategories = [...new Set([...baseTheme.relatedCategories, ...otherTheme.relatedCategories])];
    
    // Calculate merged strength
    const mergedStrength = Math.max(baseTheme.strength, otherTheme.strength) + 0.1 * Math.min(baseTheme.strength, otherTheme.strength);
    
    // Create merged theme (keeping ID of stronger theme)
    const mergedTheme: Theme = {
      ...baseTheme,
      keywords: mergedKeywords,
      relatedNewsletters: mergedNewsletters,
      relatedCategories: mergedCategories,
      strength: Math.min(1.0, mergedStrength),
      updatedAt: now
    };
    
    return mergedTheme;
  }
}