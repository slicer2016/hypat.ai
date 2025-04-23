/**
 * ContentStructureAnalyzer
 * Analyzes email content structure to detect newsletter patterns
 */

import { Email } from '../../../interfaces/gmail-mcp.js';
import { 
  DetectionMethodType, 
  DetectionScore, 
  ContentStructureAnalyzer as IContentStructureAnalyzer 
} from '../interfaces.js';
import { Logger } from '../../../utils/logger.js';

export class ContentStructureAnalyzer implements IContentStructureAnalyzer {
  readonly type = DetectionMethodType.CONTENT_STRUCTURE;
  private readonly weight = 0.3; // 30% weight in the overall detection
  private logger: Logger;
  
  // Common newsletter structural elements
  private readonly NEWSLETTER_ELEMENTS = {
    // Header elements commonly found in newsletters
    HEADER_PATTERNS: [
      '<header',
      '<div[^>]*header',
      '<div[^>]*masthead',
      '<img[^>]*logo',
      '<div[^>]*logo',
      '<table[^>]*header',
      '<table[^>]*masthead',
      '<div[^>]*banner',
      '<div[^>]*emailHeader'
    ],
    
    // Footer elements commonly found in newsletters
    FOOTER_PATTERNS: [
      '<footer',
      '<div[^>]*footer',
      'unsubscribe',
      'opt-out',
      'opt out',
      'email preferences',
      'manage your (?:email|subscription)',
      'view (?:in|as) (?:browser|web)',
      '<div[^>]*emailFooter',
      'privacy policy',
      'copyright \\d{4}',
      '&copy;',
      'sent to',
      'you(?:\'re| are) receiving this'
    ],
    
    // Multi-column layout patterns common in newsletters
    LAYOUT_PATTERNS: [
      '<table[^>]*width=["|\'](?:600|650|700|750|800)',
      '<div[^>]*width=["|\'](?:600|650|700|750|800)',
      '<table[^>]*cellpadding',
      '<table[^>]*cellspacing',
      '<table[^>]*align=["|\'](center)',
      '<div[^>]*align=["|\'](center)',
      '<div[^>]*class=["|\'](column)',
      'media query', // Responsive email indicator
      '@media',
      '<div[^>]*class=["|\'](container)',
      '<table[^>]*container'
    ],
    
    // Content section patterns common in newsletters
    SECTION_PATTERNS: [
      '<h1[^>]*>',
      '<h2[^>]*>',
      '<div[^>]*section',
      '<div[^>]*article',
      '<table[^>]*article',
      '<div[^>]*story',
      '<div[^>]*post',
      '<div[^>]*content',
      '<div[^>]*block',
      '<div[^>]*card',
      '<table[^>]*card',
      '<div[^>]*feature'
    ],
    
    // Call-to-action patterns common in newsletters
    CTA_PATTERNS: [
      '<a[^>]*class=["|\'](button)',
      '<a[^>]*style=["|\'](.*background-color)',
      '<a[^>]*style=["|\'](.*background:)',
      '<a[^>]*class=["|\'](cta)',
      '<a[^>]*class=["|\'](btn)',
      '<div[^>]*class=["|\'](button)',
      '<div[^>]*class=["|\'](cta)',
      'read more',
      'learn more',
      'find out more',
      'click here',
      'shop now',
      'sign up',
      'join now',
      'register',
      'download'
    ],
    
    // Image patterns common in newsletters
    IMAGE_PATTERNS: [
      '<img[^>]*width=["|\'](?:100%|[4-9][0-9][0-9])',
      '<img[^>]*style=["|\'](.*max-width)',
      '<img[^>]*class=["|\'](banner)',
      '<img[^>]*class=["|\'](hero)',
      '<div[^>]*class=["|\'](banner)',
      '<div[^>]*class=["|\'](hero)',
      '<div[^>]*class=["|\'](header-image)',
      '<table[^>]*background='
    ]
  };

  constructor() {
    this.logger = new Logger('ContentStructureAnalyzer');
  }

  /**
   * Analyze email content for newsletter structure patterns
   * @param email The email to analyze
   * @returns A detection score
   */
  async analyze(email: Email): Promise<DetectionScore> {
    try {
      this.logger.debug(`Analyzing content structure for email ${email.id}`);
      
      if (!email.payload) {
        throw new Error('Email payload is missing');
      }
      
      // Extract HTML content from the email
      const htmlContent = this.extractHtmlContent(email);
      
      if (!htmlContent) {
        return {
          method: this.type,
          score: 0.1, // Plain text emails are less likely to be newsletters, but still possible
          confidence: 0.5,
          reason: 'No HTML content found in email'
        };
      }
      
      // Analyze the HTML content for newsletter patterns
      const layoutScore = this.identifyNewsletterLayout(htmlContent);
      const elementScore = this.detectStructuralElements(htmlContent);
      const sectionScore = this.recognizeTemplatedSections(htmlContent);
      
      // Combine individual scores
      const totalScore = (
        layoutScore * 0.4 + 
        elementScore * 0.4 + 
        sectionScore * 0.2
      );
      
      // Prepare detailed reason for the score
      let reason = '';
      if (layoutScore > 0.5) reason += 'Detected newsletter-like layout. ';
      if (elementScore > 0.5) reason += 'Found newsletter structural elements. ';
      if (sectionScore > 0.5) reason += 'Identified templated content sections. ';
      if (reason === '') reason = 'No strong newsletter content structure detected.';
      
      const confidenceLevel = htmlContent.length > 1000 ? 0.8 : 0.6;
      
      return {
        method: this.type,
        score: totalScore,
        confidence: confidenceLevel, 
        reason,
        metadata: {
          layoutScore,
          elementScore,
          sectionScore,
          contentLength: htmlContent.length
        }
      };
    } catch (error) {
      this.logger.error(`Error analyzing content structure: ${error instanceof Error ? error.message : String(error)}`);
      return {
        method: this.type,
        score: 0,
        confidence: 0.1, // Low confidence due to error
        reason: `Error analyzing content structure: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get the weight of this detection method
   * @returns The weight value (0.0 to 1.0)
   */
  getWeight(): number {
    return this.weight;
  }

  /**
   * Identify newsletter-like layouts in email content
   * @param content The email HTML content
   * @returns Score between 0.0 and 1.0
   */
  identifyNewsletterLayout(content: string): number {
    // Check for layout patterns common in newsletters
    const matchCount = this.countPatternMatches(content, this.NEWSLETTER_ELEMENTS.LAYOUT_PATTERNS);
    
    // Calculate score based on how many patterns match
    const patternRatio = matchCount / this.NEWSLETTER_ELEMENTS.LAYOUT_PATTERNS.length;
    
    // Table-based emails are very common for newsletters
    if (this.countOccurrences(content, '<table') > 3) {
      return Math.min(0.2 + patternRatio, 1.0);
    }
    
    // Check for responsive email indicators
    if (content.includes('@media') || content.includes('media query')) {
      return Math.min(0.3 + patternRatio, 1.0);
    }
    
    // Fixed width containers are common in newsletters
    if (content.match(/width=["']((?:600|650|700|750|800))/i)) {
      return Math.min(0.2 + patternRatio, 1.0);
    }
    
    return patternRatio;
  }

  /**
   * Detect newsletter structural elements like headers and footers
   * @param content The email HTML content
   * @returns Score between 0.0 and 1.0
   */
  detectStructuralElements(content: string): number {
    // Check for header elements
    const headerMatches = this.countPatternMatches(content, this.NEWSLETTER_ELEMENTS.HEADER_PATTERNS);
    
    // Check for footer elements
    const footerMatches = this.countPatternMatches(content, this.NEWSLETTER_ELEMENTS.FOOTER_PATTERNS);
    
    // Check for CTAs
    const ctaMatches = this.countPatternMatches(content, this.NEWSLETTER_ELEMENTS.CTA_PATTERNS);
    
    // Check for prominent images
    const imageMatches = this.countPatternMatches(content, this.NEWSLETTER_ELEMENTS.IMAGE_PATTERNS);
    
    // Calculate total elements score
    let score = 0;
    
    if (headerMatches > 0) score += 0.25;
    if (footerMatches > 0) score += 0.25;
    
    // Scale CTA and image scores based on how many matches
    score += Math.min(ctaMatches / 3, 0.25); // Cap at 0.25
    score += Math.min(imageMatches / 3, 0.25); // Cap at 0.25
    
    // Strong indicator: presence of unsubscribe link
    if (content.toLowerCase().includes('unsubscribe') || 
        content.toLowerCase().includes('opt-out') || 
        content.toLowerCase().includes('opt out')) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Recognize templated content sections common in newsletters
   * @param content The email HTML content
   * @returns Score between 0.0 and 1.0
   */
  recognizeTemplatedSections(content: string): number {
    // Check for section patterns common in newsletters
    const sectionMatches = this.countPatternMatches(content, this.NEWSLETTER_ELEMENTS.SECTION_PATTERNS);
    
    // Calculate score based on section count
    let score = Math.min(sectionMatches / 5, 0.8); // Cap at 0.8
    
    // Check for repeated structural patterns
    // Many newsletters have repeating sections with similar structure
    const divClasses = this.extractRepeatedClasses(content, 'div');
    const tableClasses = this.extractRepeatedClasses(content, 'table');
    
    if (divClasses.length > 0 || tableClasses.length > 0) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }
  
  /**
   * Extract HTML content from email payload
   * @param email The email to extract content from
   * @returns The HTML content string, or empty string if none found
   */
  private extractHtmlContent(email: Email): string {
    if (!email.payload?.parts) {
      // Check if the payload itself is HTML
      if (email.payload?.mimeType === 'text/html' && email.payload?.body?.data) {
        return Buffer.from(email.payload.body.data, 'base64').toString('utf-8');
      }
      return '';
    }
    
    // Look for HTML part in multipart emails
    const findHtmlPart = (parts: any[]): string => {
      for (const part of parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
        
        // Recursively check nested parts
        if (part.parts && part.parts.length > 0) {
          const nestedHtml = findHtmlPart(part.parts);
          if (nestedHtml) return nestedHtml;
        }
      }
      
      return '';
    };
    
    return findHtmlPart(email.payload.parts);
  }
  
  /**
   * Count the number of matches for a set of patterns in content
   * @param content The content to check
   * @param patterns Array of regex patterns to check
   * @returns Number of unique patterns that matched
   */
  private countPatternMatches(content: string, patterns: string[]): number {
    return patterns.filter(pattern => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(content);
    }).length;
  }
  
  /**
   * Count occurrences of a substring in content
   * @param content The content to check
   * @param substring The substring to count
   * @returns The number of occurrences
   */
  private countOccurrences(content: string, substring: string): number {
    return (content.match(new RegExp(substring, 'gi')) || []).length;
  }
  
  /**
   * Extract repeated CSS classes which indicate templated sections
   * @param content The HTML content
   * @param tag The HTML tag to check for classes
   * @returns Array of class names that appear multiple times
   */
  private extractRepeatedClasses(content: string, tag: string): string[] {
    const classRegex = new RegExp(`<${tag}[^>]*class=["']([^"']+)["'][^>]*>`, 'gi');
    const matches = [...content.matchAll(classRegex)];
    
    // Extract all class names
    const classNames: string[] = [];
    for (const match of matches) {
      if (match[1]) {
        // Split multiple classes
        const classes = match[1].split(/\s+/);
        classNames.push(...classes);
      }
    }
    
    // Count occurrences of each class
    const classCounts: Record<string, number> = {};
    for (const className of classNames) {
      classCounts[className] = (classCounts[className] || 0) + 1;
    }
    
    // Return classes that appear multiple times
    return Object.entries(classCounts)
      .filter(([_, count]) => count > 1)
      .map(([className]) => className);
  }
}