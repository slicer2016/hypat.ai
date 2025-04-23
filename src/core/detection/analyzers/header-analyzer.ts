/**
 * HeaderAnalyzer
 * Analyzes email headers to detect newsletter indicators
 */

import { Email } from '../../../interfaces/gmail-mcp.js';
import { 
  DetectionMethodType, 
  DetectionScore, 
  HeaderAnalyzer as IHeaderAnalyzer 
} from '../interfaces.js';
import { Logger } from '../../../utils/logger.js';

export class HeaderAnalyzer implements IHeaderAnalyzer {
  readonly type = DetectionMethodType.HEADER_ANALYSIS;
  private readonly weight = 0.4; // 40% weight in the overall detection
  private logger: Logger;
  
  // Common newsletter header patterns
  private readonly NEWSLETTER_X_HEADERS = [
    'x-campaign', 
    'x-mailchimp', 
    'x-mc', 
    'x-cid', 
    'x-mailer',
    'x-newsletter',
    'x-cm-campid',
    'x-sendgrid',
    'x-ses',
    'x-postmark',
    'x-customer',
    'x-ib',  // Infusionsoft/Keap
    'x-maropost',
    'x-constantcontact',
    'x-aweber',
    'x-getresponse',
    'x-cm',  // Campaign Monitor
    'x-feedback-id',
    'x-report-abuse',
    'x-drip'
  ];
  
  // Common newsletter sender patterns
  private readonly NEWSLETTER_SENDER_PATTERNS = [
    'newsletter@',
    'news@',
    'updates@',
    'noreply@',
    'no-reply@',
    'donotreply@',
    'do-not-reply@',
    'digest@',
    'weekly@',
    'daily@',
    'monthly@',
    'notifications@',
    'info@',
    'hello@',
    'support@',
    'team@',
    'broadcast@',
    'campaign@'
  ];
  
  // Email service providers commonly used for newsletters
  private readonly NEWSLETTER_ESP_DOMAINS = [
    'sendgrid.net',
    'mailchimp.com',
    'amazonaws.com',
    'constantcontact.com',
    'cmail19.com', // Campaign Monitor
    'cmail20.com',
    'aweber.com',
    'getresponse.com',
    'mailerlite.com',
    'infusionmail.com',
    'drip.com',
    'maropost.com',
    'activecampaign.com',
    'hubspotmail.net',
    'convertkit.com',
    'klaviyomail.com',
    'sendpulse.com',
    'omnisend.com',
    'sendinblue.com',
    'mailgun.org'
  ];

  constructor() {
    this.logger = new Logger('HeaderAnalyzer');
  }

  /**
   * Analyze email headers for newsletter indicators
   * @param email The email to analyze
   * @returns A detection score
   */
  async analyze(email: Email): Promise<DetectionScore> {
    try {
      this.logger.debug(`Analyzing headers for email ${email.id}`);
      
      if (!email.payload) {
        throw new Error('Email payload is missing');
      }
      
      const headers = this.extractHeaders(email);
      const listUnsubscribeScore = this.checkListUnsubscribe(headers);
      const newsletterHeadersScore = this.checkNewsletterHeaders(headers);
      
      // Get the sender from headers
      const sender = headers['from'] || '';
      const senderPatternScore = this.analyzeSenderPattern(sender);
      
      // Combine individual scores
      const totalScore = (
        listUnsubscribeScore * 0.5 + // List-Unsubscribe is a strong indicator
        newsletterHeadersScore * 0.3 + 
        senderPatternScore * 0.2
      );
      
      // Prepare detailed reason for the score
      let reason = '';
      if (listUnsubscribeScore > 0) reason += 'Found List-Unsubscribe header. ';
      if (newsletterHeadersScore > 0) reason += 'Detected newsletter-specific headers. ';
      if (senderPatternScore > 0) reason += 'Identified newsletter sender pattern. ';
      if (reason === '') reason = 'No newsletter header indicators found.';
      
      return {
        method: this.type,
        score: totalScore,
        confidence: 0.9, // Header analysis is generally very reliable
        reason,
        metadata: {
          listUnsubscribeScore,
          newsletterHeadersScore,
          senderPatternScore,
          from: sender,
          hasListUnsubscribe: listUnsubscribeScore > 0
        }
      };
    } catch (error) {
      this.logger.error(`Error analyzing headers: ${error instanceof Error ? error.message : String(error)}`);
      return {
        method: this.type,
        score: 0,
        confidence: 0.1, // Low confidence due to error
        reason: `Error analyzing headers: ${error instanceof Error ? error.message : String(error)}`
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
   * Check for the presence of List-Unsubscribe headers, a strong indicator of newsletters
   * @param headers The email headers
   * @returns Score between 0.0 and 1.0
   */
  checkListUnsubscribe(headers: Record<string, string>): number {
    const hasListUnsubscribe = Object.keys(headers)
      .some(key => key.toLowerCase() === 'list-unsubscribe');
    
    return hasListUnsubscribe ? 1.0 : 0.0;
  }

  /**
   * Check for newsletter-specific headers from ESPs
   * @param headers The email headers
   * @returns Score between 0.0 and 1.0
   */
  checkNewsletterHeaders(headers: Record<string, string>): number {
    // Check for newsletter-specific X-headers
    const foundNewsletterHeaders = this.NEWSLETTER_X_HEADERS.filter(xHeader => 
      Object.keys(headers).some(key => 
        key.toLowerCase().includes(xHeader)
      )
    );
    
    // If we find any newsletter headers, calculate score based on how many we found
    if (foundNewsletterHeaders.length > 0) {
      // Cap at 1.0 if we find 3 or more
      return Math.min(foundNewsletterHeaders.length / 3, 1.0);
    }
    
    // Check for email service provider tracking pixels in content
    if (headers['content-type']?.includes('multipart/alternative')) {
      // ESP tracking pixels are often included in multipart emails
      return 0.3; // Moderate score
    }
    
    return 0.0;
  }

  /**
   * Analyze sender patterns for newsletter indicators
   * @param sender The email sender (From header)
   * @returns Score between 0.0 and 1.0
   */
  analyzeSenderPattern(sender: string): number {
    if (!sender) return 0.0;
    
    // Extract email address from "Name <email@domain.com>" format
    const emailMatch = sender.match(/<([^>]+)>/) || [null, sender];
    const email = emailMatch[1]?.toLowerCase() || '';
    
    // Check if sender email matches common newsletter patterns
    const matchesPattern = this.NEWSLETTER_SENDER_PATTERNS.some(pattern => 
      email.includes(pattern)
    );
    
    if (matchesPattern) return 0.8; // Strong indicator
    
    // Check if the domain matches common newsletter ESP domains
    const domain = email.split('@')[1] || '';
    const matchesESP = this.NEWSLETTER_ESP_DOMAINS.some(espDomain => 
      domain.includes(espDomain)
    );
    
    if (matchesESP) return 0.7; // Good indicator
    
    // Check for common "friendly" sender names that suggest newsletters
    const friendlyName = sender.split('<')[0]?.toLowerCase() || '';
    const newsletterNameIndicators = [
      'newsletter', 'weekly', 'daily', 'monthly', 'digest', 'update', 
      'bulletin', 'news', 'roundup', 'recap'
    ];
    
    if (newsletterNameIndicators.some(indicator => friendlyName.includes(indicator))) {
      return 0.6; // Moderate indicator
    }
    
    return 0.0; // No patterns matched
  }
  
  /**
   * Extracts headers from email payload and converts to a Record
   * @param email The email to extract headers from
   * @returns Record of header names to values
   */
  private extractHeaders(email: Email): Record<string, string> {
    const headerRecord: Record<string, string> = {};
    
    if (email.payload?.headers) {
      for (const header of email.payload.headers) {
        if (header.name && header.value) {
          headerRecord[header.name.toLowerCase()] = header.value;
        }
      }
    }
    
    return headerRecord;
  }
}