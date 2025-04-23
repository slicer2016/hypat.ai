/**
 * HTML Content Extractor
 * Extracts main content from HTML newsletters
 */

import { HtmlContentExtractor } from '../../../interfaces/content-processing.js';
import { Logger } from '../../../utils/logger.js';

export class HtmlContentExtractorImpl implements HtmlContentExtractor {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('HtmlContentExtractor');
  }

  /**
   * Extract the main content from HTML
   * @param html The HTML content
   */
  async extractMainContent(html: string): Promise<string> {
    try {
      this.logger.debug('Extracting main content from HTML');
      
      // Clean the HTML first
      const cleanedHtml = this.cleanHtml(html);
      
      // Extract the main content
      // This is a simplified implementation that looks for common newsletter content containers
      const contentMatches = [
        /<div[^>]*class="?(?:content|main|newsletter|body|email-content)"?[^>]*>([\s\S]*?)<\/div>/i,
        /<table[^>]*class="?(?:content|main|newsletter|body|email-content)"?[^>]*>([\s\S]*?)<\/table>/i,
        /<td[^>]*class="?(?:content|main|newsletter|body|email-content)"?[^>]*>([\s\S]*?)<\/td>/i
      ];
      
      // Try each pattern to find main content
      for (const pattern of contentMatches) {
        const match = cleanedHtml.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      
      // If no specific content container is found, return the body content
      const bodyMatch = cleanedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch && bodyMatch[1]) {
        return bodyMatch[1].trim();
      }
      
      // If all else fails, return the original cleaned HTML
      return cleanedHtml;
    } catch (error) {
      this.logger.error(`Error extracting main content: ${error instanceof Error ? error.message : String(error)}`);
      return html; // Return original HTML in case of error
    }
  }

  /**
   * Convert HTML to plain text
   * @param html The HTML content
   */
  convertToPlainText(html: string): string {
    try {
      this.logger.debug('Converting HTML to plain text');
      
      // Remove all HTML tags
      let plainText = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
      plainText = plainText.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      plainText = plainText.replace(/<[^>]+>/g, ' ');
      
      // Replace common HTML entities
      plainText = plainText.replace(/&nbsp;/g, ' ');
      plainText = plainText.replace(/&amp;/g, '&');
      plainText = plainText.replace(/&lt;/g, '<');
      plainText = plainText.replace(/&gt;/g, '>');
      plainText = plainText.replace(/&quot;/g, '"');
      plainText = plainText.replace(/&#39;/g, "'");
      
      // Fix spacing
      plainText = plainText.replace(/\s+/g, ' ').trim();
      
      // Replace multiple newlines with a single one
      plainText = plainText.replace(/\n\s*\n/g, '\n');
      
      return plainText;
    } catch (error) {
      this.logger.error(`Error converting HTML to plain text: ${error instanceof Error ? error.message : String(error)}`);
      return html; // Return original HTML in case of error
    }
  }

  /**
   * Remove unnecessary elements from HTML
   * @param html The HTML content
   */
  cleanHtml(html: string): string {
    try {
      this.logger.debug('Cleaning HTML content');
      
      // Remove DOCTYPE, comments, and scripts
      let cleanedHtml = html.replace(/<!DOCTYPE[^>]*>/i, '');
      cleanedHtml = cleanedHtml.replace(/<!--[\s\S]*?-->/g, '');
      cleanedHtml = cleanedHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Remove style tags and their content
      cleanedHtml = cleanedHtml.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
      
      // Remove hidden elements
      cleanedHtml = cleanedHtml.replace(/<[^>]*display:\s*none[^>]*>[^<]*(?:(?!<\/[^>]>)<[^<]*)*<\/[^>]>/gi, '');
      
      // Remove tracking pixels and invisible elements
      cleanedHtml = cleanedHtml.replace(/<img[^>]*width=["']?1["']?[^>]*height=["']?1["']?[^>]*>/gi, '');
      cleanedHtml = cleanedHtml.replace(/<img[^>]*height=["']?1["']?[^>]*width=["']?1["']?[^>]*>/gi, '');
      
      // Convert non-breaking spaces to regular spaces
      cleanedHtml = cleanedHtml.replace(/&nbsp;/g, ' ');
      
      // Remove excessive whitespace
      cleanedHtml = cleanedHtml.replace(/\s+/g, ' ');
      
      return cleanedHtml;
    } catch (error) {
      this.logger.error(`Error cleaning HTML: ${error instanceof Error ? error.message : String(error)}`);
      return html; // Return original HTML in case of error
    }
  }
}