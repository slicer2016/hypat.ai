/**
 * Newsletter Structure Parser
 * Parses the structure of newsletter HTML into a structured format
 */

import { NewsletterSection, NewsletterStructure, NewsletterStructureParser, SectionType } from '../../../interfaces/content-processing.js';
import { Logger } from '../../../utils/logger.js';

export class NewsletterStructureParserImpl implements NewsletterStructureParser {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('NewsletterStructureParser');
  }

  /**
   * Parse newsletter HTML into a structured format
   * @param html The HTML content
   */
  async parseStructure(html: string): Promise<NewsletterStructure> {
    try {
      this.logger.debug('Parsing newsletter structure');
      
      // Extract title (try different patterns for newsletter titles)
      const titlePatterns = [
        /<title[^>]*>(.*?)<\/title>/i,
        /<h1[^>]*>(.*?)<\/h1>/i,
        /<div[^>]*class="?(?:title|header|newsletter-title)"?[^>]*>(.*?)<\/div>/i
      ];
      
      let title = 'Untitled Newsletter';
      
      for (const pattern of titlePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          title = match[1].trim().replace(/<[^>]+>/g, '');
          break;
        }
      }
      
      // Identify sections in the newsletter
      const sections = this.identifySections(html);
      
      // Extract metadata
      const metadata = this.extractMetadata(html);
      
      return {
        title,
        sections,
        metadata
      };
    } catch (error) {
      this.logger.error(`Error parsing newsletter structure: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return a minimal structure in case of error
      return {
        title: 'Parsing Error',
        sections: [{
          id: 'error',
          content: html,
          type: SectionType.CONTENT,
          links: [],
          level: 0
        }],
        metadata: {}
      };
    }
  }

  /**
   * Identify sections in the newsletter
   * @param html The HTML content
   */
  identifySections(html: string): NewsletterSection[] {
    try {
      this.logger.debug('Identifying newsletter sections');
      
      const sections: NewsletterSection[] = [];
      let sectionId = 0;
      
      // Look for header section
      const headerMatch = html.match(/<div[^>]*class="?(?:header|newsletter-header)"?[^>]*>([\s\S]*?)<\/div>/i);
      if (headerMatch && headerMatch[1]) {
        sections.push({
          id: `section-${sectionId++}`,
          title: 'Header',
          content: headerMatch[1].trim(),
          type: SectionType.HEADER,
          links: this.extractLinksFromSection(headerMatch[1]),
          level: 0
        });
      }
      
      // Look for content sections (h2, h3 sections or div with content class)
      const headingMatches = [...html.matchAll(/<h([2-3])[^>]*>([\s\S]*?)<\/h\1>[\s\S]*?(?:<h\1|<div|<\/body)/gi)];
      
      for (const match of headingMatches) {
        const headingLevel = parseInt(match[1], 10);
        const headingText = match[2].replace(/<[^>]+>/g, '').trim();
        const sectionContent = match[0].substring(match[0].indexOf('</h') + 4).trim();
        
        sections.push({
          id: `section-${sectionId++}`,
          title: headingText,
          content: sectionContent,
          type: SectionType.CONTENT,
          links: this.extractLinksFromSection(sectionContent),
          level: headingLevel - 1 // Convert h2/h3 to level 1/2
        });
      }
      
      // Look for div-based sections
      const divSectionMatches = [...html.matchAll(/<div[^>]*class="?(?:section|content-section|article)"?[^>]*>([\s\S]*?)<\/div>/gi)];
      
      for (const match of divSectionMatches) {
        const sectionContent = match[1].trim();
        const titleMatch = sectionContent.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
        
        sections.push({
          id: `section-${sectionId++}`,
          title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : undefined,
          content: sectionContent,
          type: SectionType.CONTENT,
          links: this.extractLinksFromSection(sectionContent),
          level: 1
        });
      }
      
      // Look for sponsored content
      const sponsoredMatches = [...html.matchAll(/<div[^>]*class="?(?:sponsored|advertisement|promotion)"?[^>]*>([\s\S]*?)<\/div>/gi)];
      
      for (const match of sponsoredMatches) {
        const sponsoredContent = match[1].trim();
        
        sections.push({
          id: `section-${sectionId++}`,
          title: 'Sponsored',
          content: sponsoredContent,
          type: SectionType.SPONSORED,
          links: this.extractLinksFromSection(sponsoredContent),
          level: 1
        });
      }
      
      // Look for footer section
      const footerMatch = html.match(/<div[^>]*class="?(?:footer|newsletter-footer)"?[^>]*>([\s\S]*?)<\/div>/i);
      if (footerMatch && footerMatch[1]) {
        sections.push({
          id: `section-${sectionId++}`,
          title: 'Footer',
          content: footerMatch[1].trim(),
          type: SectionType.FOOTER,
          links: this.extractLinksFromSection(footerMatch[1]),
          level: 0
        });
      }
      
      // If no sections were identified, create a default content section
      if (sections.length === 0) {
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const content = bodyMatch ? bodyMatch[1].trim() : html;
        
        sections.push({
          id: `section-${sectionId++}`,
          title: undefined,
          content: content,
          type: SectionType.CONTENT,
          links: this.extractLinksFromSection(content),
          level: 0
        });
      }
      
      return sections;
    } catch (error) {
      this.logger.error(`Error identifying sections: ${error instanceof Error ? error.message : String(error)}`);
      
      // Return a single section with the entire content in case of error
      return [{
        id: 'error-section',
        content: html,
        type: SectionType.CONTENT,
        links: [],
        level: 0
      }];
    }
  }

  /**
   * Extract metadata from the newsletter
   * @param html The HTML content
   */
  extractMetadata(html: string): Record<string, string> {
    try {
      this.logger.debug('Extracting newsletter metadata');
      
      const metadata: Record<string, string> = {};
      
      // Extract meta tags
      const metaMatches = [...html.matchAll(/<meta[^>]*name="([^"]*)"[^>]*content="([^"]*)"[^>]*>/gi)];
      for (const match of metaMatches) {
        metadata[match[1].toLowerCase()] = match[2];
      }
      
      // Try to extract publish date
      const datePatterns = [
        /<div[^>]*class="?(?:date|publish-date|newsletter-date)"?[^>]*>([\s\S]*?)<\/div>/i,
        /<span[^>]*class="?(?:date|publish-date|newsletter-date)"?[^>]*>([\s\S]*?)<\/span>/i,
        /<p[^>]*class="?(?:date|publish-date|newsletter-date)"?[^>]*>([\s\S]*?)<\/p>/i
      ];
      
      for (const pattern of datePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          metadata['publish-date'] = match[1].replace(/<[^>]+>/g, '').trim();
          break;
        }
      }
      
      // Try to extract author
      const authorPatterns = [
        /<div[^>]*class="?(?:author|byline)"?[^>]*>([\s\S]*?)<\/div>/i,
        /<span[^>]*class="?(?:author|byline)"?[^>]*>([\s\S]*?)<\/span>/i,
        /<p[^>]*class="?(?:author|byline)"?[^>]*>([\s\S]*?)<\/p>/i
      ];
      
      for (const pattern of authorPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          metadata['author'] = match[1].replace(/<[^>]+>/g, '').trim();
          break;
        }
      }
      
      return metadata;
    } catch (error) {
      this.logger.error(`Error extracting metadata: ${error instanceof Error ? error.message : String(error)}`);
      return {}; // Return empty metadata in case of error
    }
  }

  /**
   * Helper method to extract links from a section
   * @param html The section HTML
   */
  private extractLinksFromSection(html: string): { url: string; text: string }[] {
    try {
      const links: { url: string; text: string }[] = [];
      const linkMatches = [...html.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
      
      for (const match of linkMatches) {
        const url = match[1];
        const text = match[2].replace(/<[^>]+>/g, '').trim();
        
        if (url && url !== '#' && !url.startsWith('javascript:')) {
          links.push({ url, text });
        }
      }
      
      return links;
    } catch (error) {
      this.logger.error(`Error extracting links from section: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
}