/**
 * Link Extractor
 * Extracts and categorizes links from newsletter content
 */

import { Link, LinkExtractor } from '../../../interfaces/content-processing.js';
import { Logger } from '../../../utils/logger.js';

export class LinkExtractorImpl implements LinkExtractor {
  private logger: Logger;
  private sponsoredKeywords: string[];
  private categoryPatterns: Record<string, RegExp[]>;

  constructor() {
    this.logger = new Logger('LinkExtractor');
    
    // Initialize common sponsored content keywords
    this.sponsoredKeywords = [
      'sponsor', 'sponsored', 'advertisement', 'promoted', 'partner', 
      'promotion', 'advertorial', 'paid', 'presented by', 'affiliate'
    ];
    
    // Initialize category patterns
    this.categoryPatterns = {
      'article': [
        /blog/i, /article/i, /post/i, /story/i, /news/i, /read/i
      ],
      'video': [
        /youtube\.com/i, /vimeo\.com/i, /watch/i, /video/i, /\.mp4/i
      ],
      'social': [
        /twitter\.com/i, /facebook\.com/i, /instagram\.com/i, /linkedin\.com/i, /social/i
      ],
      'product': [
        /product/i, /buy/i, /shop/i, /purchase/i, /store/i, /amazon/i
      ],
      'resource': [
        /resource/i, /download/i, /pdf/i, /whitepaper/i, /ebook/i, /guide/i
      ],
      'event': [
        /event/i, /webinar/i, /conference/i, /register/i, /sign-?up/i, /join/i
      ]
    };
  }

  /**
   * Extract links from HTML content
   * @param html The HTML content
   */
  async extractLinks(html: string): Promise<Link[]> {
    try {
      this.logger.debug('Extracting links from HTML content');
      
      const links: Link[] = [];
      const linkMatches = [...html.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)];
      
      for (const match of linkMatches) {
        const url = match[1];
        const text = match[2].replace(/<[^>]+>/g, '').trim();
        
        // Skip empty, anchor, or javascript links
        if (!url || url === '#' || url.startsWith('javascript:') || url.startsWith('mailto:')) {
          continue;
        }
        
        // Extract context (surrounding text)
        const context = this.extractLinkContext(html, match[0]);
        
        links.push({
          url,
          text: text || url,
          context
        });
      }
      
      // Categorize and identify sponsored links
      const categorizedLinks = await this.categorizeLinks(links);
      const finalLinks = await this.identifySponsoredLinks(categorizedLinks);
      
      return finalLinks;
    } catch (error) {
      this.logger.error(`Error extracting links: ${error instanceof Error ? error.message : String(error)}`);
      return []; // Return empty array in case of error
    }
  }

  /**
   * Categorize extracted links
   * @param links The links to categorize
   */
  async categorizeLinks(links: Link[]): Promise<Link[]> {
    try {
      this.logger.debug(`Categorizing ${links.length} extracted links`);
      
      return links.map(link => {
        // Copy the link to avoid modifying the original
        const categorizedLink = { ...link };
        
        // Try to determine category based on URL and text
        for (const [category, patterns] of Object.entries(this.categoryPatterns)) {
          const isMatch = patterns.some(pattern => 
            pattern.test(link.url) || 
            (link.text && pattern.test(link.text)) || 
            (link.context && pattern.test(link.context))
          );
          
          if (isMatch) {
            categorizedLink.category = category;
            break;
          }
        }
        
        // Default category if none matched
        if (!categorizedLink.category) {
          categorizedLink.category = 'other';
        }
        
        return categorizedLink;
      });
    } catch (error) {
      this.logger.error(`Error categorizing links: ${error instanceof Error ? error.message : String(error)}`);
      return links; // Return original links in case of error
    }
  }

  /**
   * Identify sponsored links
   * @param links The links to check
   */
  async identifySponsoredLinks(links: Link[]): Promise<Link[]> {
    try {
      this.logger.debug(`Identifying sponsored links among ${links.length} links`);
      
      return links.map(link => {
        // Copy the link to avoid modifying the original
        const processedLink = { ...link };
        
        // Check if link is sponsored based on various indicators
        const isSponsoredByContext = link.context && this.sponsoredKeywords.some(keyword => 
          link.context!.toLowerCase().includes(keyword.toLowerCase())
        );
        
        const isSponsoredByText = link.text && this.sponsoredKeywords.some(keyword => 
          link.text.toLowerCase().includes(keyword.toLowerCase())
        );
        
        // URLs that contain tracking parameters are more likely to be sponsored
        const hasTrackingParams = /utm_|affiliate|partner|ref=|sponsored/i.test(link.url);
        
        // Mark as sponsored if any of the indicators are true
        processedLink.isSponsored = isSponsoredByContext || isSponsoredByText || hasTrackingParams;
        
        // If it's sponsored, also update category if it's currently "other"
        if (processedLink.isSponsored && processedLink.category === 'other') {
          processedLink.category = 'sponsored';
        }
        
        return processedLink;
      });
    } catch (error) {
      this.logger.error(`Error identifying sponsored links: ${error instanceof Error ? error.message : String(error)}`);
      return links; // Return original links in case of error
    }
  }

  /**
   * Extract the context surrounding a link
   * @param html The HTML content
   * @param linkHtml The HTML of the link
   */
  private extractLinkContext(html: string, linkHtml: string): string {
    try {
      // Find the position of the link in the HTML
      const linkIndex = html.indexOf(linkHtml);
      if (linkIndex === -1) return '';
      
      // Extract some text before and after the link
      const contextStart = Math.max(0, linkIndex - 100);
      const contextEnd = Math.min(html.length, linkIndex + linkHtml.length + 100);
      
      let context = html.substring(contextStart, contextEnd);
      
      // Remove HTML tags
      context = context.replace(/<[^>]+>/g, ' ');
      
      // Clean up whitespace
      context = context.replace(/\s+/g, ' ').trim();
      
      return context;
    } catch (error) {
      this.logger.error(`Error extracting link context: ${error instanceof Error ? error.message : String(error)}`);
      return '';
    }
  }
}