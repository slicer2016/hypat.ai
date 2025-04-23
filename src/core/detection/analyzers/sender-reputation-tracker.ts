/**
 * SenderReputationTracker
 * Tracks and analyzes sender reputation for newsletter detection
 */

import { Email } from '../../../interfaces/gmail-mcp.js';
import { 
  DetectionMethodType, 
  DetectionScore, 
  SenderReputationTracker as ISenderReputationTracker 
} from '../interfaces.js';
import { Logger } from '../../../utils/logger.js';

// In-memory database for reputation tracking
// In a production system, this would be stored in a persistent database
interface SenderReputation {
  email: string;
  newsletterCount: number;
  nonNewsletterCount: number;
  lastUpdated: Date;
}

interface DomainReputation {
  domain: string;
  newsletterCount: number;
  nonNewsletterCount: number;
  lastUpdated: Date;
}

export class SenderReputationTracker implements ISenderReputationTracker {
  readonly type = DetectionMethodType.SENDER_REPUTATION;
  private readonly weight = 0.2; // 20% weight in the overall detection
  private logger: Logger;
  
  // In-memory storage for sender reputation
  private senderReputations: Map<string, SenderReputation> = new Map();
  private domainReputations: Map<string, DomainReputation> = new Map();
  
  // Known newsletter providers
  private readonly KNOWN_NEWSLETTER_DOMAINS = [
    'mailchimp.com',
    'sendgrid.net',
    'constantcontact.com',
    'campaignmonitor.com',
    'mailgun.org',
    'aweber.com',
    'getresponse.com',
    'activecampaign.com',
    'hubspot.com',
    'convertkit.com',
    'klaviyo.com',
    'marketo.com',
    'salesforce.com',
    'pardot.com',
    'sendpulse.com',
    'sendinblue.com',
    'omnisend.com',
    'drip.com',
    'zapier.com',
    'moosend.com',
    'benchmark.email',
    'substack.com',
    'beehiiv.com',
    'revue.email',
    'convertkit.com',
    'tinyletter.com',
    'memberful.com',
    'patreon.com',
    'medium.com'
  ];

  constructor() {
    this.logger = new Logger('SenderReputationTracker');
    this.initializeWithDefaultData();
  }

  /**
   * Analyze sender reputation for newsletter indicators
   * @param email The email to analyze
   * @returns A detection score
   */
  async analyze(email: Email): Promise<DetectionScore> {
    try {
      this.logger.debug(`Analyzing sender reputation for email ${email.id}`);
      
      if (!email.payload?.headers) {
        throw new Error('Email headers are missing');
      }
      
      // Extract sender from headers
      const fromHeader = email.payload.headers.find((h: { name?: string; value?: string }) => 
        h.name?.toLowerCase() === 'from'
      );
      
      if (!fromHeader?.value) {
        return {
          method: this.type,
          score: 0,
          confidence: 0.1,
          reason: 'No sender information found'
        };
      }
      
      // Parse the sender email address
      const sender = this.extractEmailAddress(fromHeader.value);
      if (!sender) {
        return {
          method: this.type,
          score: 0,
          confidence: 0.1,
          reason: 'Could not parse sender email'
        };
      }
      
      // Get the domain from the sender email
      const domain = this.extractDomain(sender);
      
      // Check if sender or domain has reputation data
      const senderScore = await this.getSenderConfidenceScore(sender);
      const isDomainNewsletter = await this.isDomainNewsletterProvider(domain);
      
      let score = senderScore;
      let confidence = 0.6; // Default moderate confidence
      let reason = '';
      
      // If we have direct sender reputation data
      if (this.senderReputations.has(sender)) {
        const reputation = this.senderReputations.get(sender)!;
        const total = reputation.newsletterCount + reputation.nonNewsletterCount;
        
        if (total > 1) {
          confidence = Math.min(0.5 + (total / 10), 0.9); // More data = higher confidence, max 0.9
          reason = `Sender reputation based on ${total} previous emails.`;
        } else {
          reason = 'Limited sender history available.';
        }
      } 
      // If we know the domain is a newsletter provider
      else if (isDomainNewsletter) {
        score = Math.max(score, 0.7); // Strong indicator
        confidence = 0.8;
        reason = `Sender domain ${domain} is a known newsletter provider.`;
      }
      // If we have domain reputation data
      else if (this.domainReputations.has(domain)) {
        const reputation = this.domainReputations.get(domain)!;
        const total = reputation.newsletterCount + reputation.nonNewsletterCount;
        
        if (total > 2) {
          confidence = Math.min(0.4 + (total / 20), 0.8); // More data = higher confidence, max 0.8
          reason = `Domain reputation based on ${total} previous emails.`;
        } else {
          reason = 'Limited domain history available.';
        }
      } else {
        reason = 'No reputation data available for this sender.';
        confidence = 0.3; // Low confidence when we have no data
      }
      
      return {
        method: this.type,
        score,
        confidence,
        reason,
        metadata: {
          sender,
          domain,
          isDomainNewsletterProvider: isDomainNewsletter,
          senderReputation: this.senderReputations.get(sender),
          domainReputation: this.domainReputations.get(domain)
        }
      };
    } catch (error) {
      this.logger.error(`Error analyzing sender reputation: ${error instanceof Error ? error.message : String(error)}`);
      return {
        method: this.type,
        score: 0,
        confidence: 0.1, // Low confidence due to error
        reason: `Error analyzing sender reputation: ${error instanceof Error ? error.message : String(error)}`
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
   * Check if a sender is a newsletter provider
   * @param sender The email sender address
   * @returns Whether the sender is a newsletter provider
   */
  async isSenderNewsletterProvider(sender: string): Promise<boolean> {
    // Check our reputation database
    if (this.senderReputations.has(sender)) {
      const reputation = this.senderReputations.get(sender)!;
      const total = reputation.newsletterCount + reputation.nonNewsletterCount;
      
      // If we have enough data, determine based on ratio
      if (total >= 3) {
        return reputation.newsletterCount > reputation.nonNewsletterCount;
      }
    }
    
    // If we don't have enough sender data, check the domain
    const domain = this.extractDomain(sender);
    return this.isDomainNewsletterProvider(domain);
  }

  /**
   * Get confidence score for a sender
   * @param sender The email sender address
   * @returns Confidence score between 0.0 and 1.0
   */
  async getSenderConfidenceScore(sender: string): Promise<number> {
    // Check sender reputation first
    if (this.senderReputations.has(sender)) {
      const reputation = this.senderReputations.get(sender)!;
      const total = reputation.newsletterCount + reputation.nonNewsletterCount;
      
      if (total > 0) {
        return reputation.newsletterCount / total;
      }
    }
    
    // If no sender reputation, check domain reputation
    const domain = this.extractDomain(sender);
    
    // Check known newsletter provider domains
    if (this.KNOWN_NEWSLETTER_DOMAINS.includes(domain)) {
      return 0.8; // High confidence for known providers
    }
    
    if (this.domainReputations.has(domain)) {
      const reputation = this.domainReputations.get(domain)!;
      const total = reputation.newsletterCount + reputation.nonNewsletterCount;
      
      if (total > 0) {
        return reputation.newsletterCount / total;
      }
    }
    
    // Default if we have no data
    return 0.5;
  }

  /**
   * Update sender reputation based on feedback
   * @param sender The email sender address
   * @param isNewsletter Whether the email is a newsletter
   */
  async updateSenderReputation(sender: string, isNewsletter: boolean): Promise<void> {
    try {
      // Update sender reputation
      if (this.senderReputations.has(sender)) {
        const reputation = this.senderReputations.get(sender)!;
        
        if (isNewsletter) {
          reputation.newsletterCount++;
        } else {
          reputation.nonNewsletterCount++;
        }
        
        reputation.lastUpdated = new Date();
        this.senderReputations.set(sender, reputation);
      } else {
        this.senderReputations.set(sender, {
          email: sender,
          newsletterCount: isNewsletter ? 1 : 0,
          nonNewsletterCount: isNewsletter ? 0 : 1,
          lastUpdated: new Date()
        });
      }
      
      // Also update domain reputation
      const domain = this.extractDomain(sender);
      if (!domain) return;
      
      if (this.domainReputations.has(domain)) {
        const reputation = this.domainReputations.get(domain)!;
        
        if (isNewsletter) {
          reputation.newsletterCount++;
        } else {
          reputation.nonNewsletterCount++;
        }
        
        reputation.lastUpdated = new Date();
        this.domainReputations.set(domain, reputation);
      } else {
        this.domainReputations.set(domain, {
          domain,
          newsletterCount: isNewsletter ? 1 : 0,
          nonNewsletterCount: isNewsletter ? 0 : 1,
          lastUpdated: new Date()
        });
      }
      
      this.logger.debug(`Updated reputation for sender ${sender} and domain ${domain}`);
    } catch (error) {
      this.logger.error(`Error updating sender reputation: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Check if a domain is a newsletter provider
   * @param domain The email domain
   * @returns Whether the domain is a newsletter provider
   */
  async isDomainNewsletterProvider(domain: string): Promise<boolean> {
    // Check known newsletter provider domains
    if (this.KNOWN_NEWSLETTER_DOMAINS.includes(domain)) {
      return true;
    }
    
    // Check our reputation database
    if (this.domainReputations.has(domain)) {
      const reputation = this.domainReputations.get(domain)!;
      const total = reputation.newsletterCount + reputation.nonNewsletterCount;
      
      // If we have enough data, determine based on ratio
      if (total >= 5) {
        return (reputation.newsletterCount / total) > 0.6; // 60% threshold
      }
    }
    
    return false;
  }
  
  /**
   * Extract email address from a From header value
   * @param from The From header value
   * @returns The extracted email address
   */
  private extractEmailAddress(from: string): string {
    // Try to extract email address from "Name <email@domain.com>" format
    const emailMatch = from.match(/<([^>]+)>/) || [null, from];
    return (emailMatch[1] || '').toLowerCase();
  }
  
  /**
   * Extract domain from an email address
   * @param email The email address
   * @returns The domain portion
   */
  private extractDomain(email: string): string {
    const parts = email.split('@');
    return parts.length > 1 ? parts[1].toLowerCase() : '';
  }
  
  /**
   * Initialize with default data for known senders
   * In a real implementation, this would load from a database
   */
  private initializeWithDefaultData(): void {
    // Seed with well-known newsletter senders
    const knownNewsletterSenders = [
      'newsletter@github.com',
      'hello@convertkit.com',
      'info@substack.com',
      'newsletter@medium.com',
      'newsletter@theverge.com',
      'info@mailchimp.com',
      'newsletter@beehiiv.com',
      'no-reply@techcrunch.com',
      'mailer@notion.so',
      'newsletter@cnn.com',
      'newsletter@nytimes.com',
      'newsletter@wired.com',
      'hello@producthunt.com'
    ];
    
    for (const sender of knownNewsletterSenders) {
      this.senderReputations.set(sender, {
        email: sender,
        newsletterCount: 10, // Strong prior
        nonNewsletterCount: 0,
        lastUpdated: new Date()
      });
      
      // Also add domain reputation
      const domain = this.extractDomain(sender);
      if (!domain) continue;
      
      if (this.domainReputations.has(domain)) {
        const reputation = this.domainReputations.get(domain)!;
        reputation.newsletterCount += 10;
        this.domainReputations.set(domain, reputation);
      } else {
        this.domainReputations.set(domain, {
          domain,
          newsletterCount: 10,
          nonNewsletterCount: 0,
          lastUpdated: new Date()
        });
      }
    }
    
    // Seed with some common non-newsletter senders
    const knownNonNewsletterSenders = [
      'support@github.com',
      'no-reply@accounts.google.com',
      'notifications@slack.com',
      'notifications@github.com',
      'team@zoom.us',
      'no-reply@dropboxmail.com',
      'notifications@twitter.com'
    ];
    
    for (const sender of knownNonNewsletterSenders) {
      this.senderReputations.set(sender, {
        email: sender,
        newsletterCount: 0,
        nonNewsletterCount: 10, // Strong prior
        lastUpdated: new Date()
      });
      
      // Also add domain reputation
      const domain = this.extractDomain(sender);
      if (!domain) continue;
      
      if (this.domainReputations.has(domain)) {
        const reputation = this.domainReputations.get(domain)!;
        reputation.nonNewsletterCount += 10;
        this.domainReputations.set(domain, reputation);
      } else {
        this.domainReputations.set(domain, {
          domain,
          newsletterCount: 0,
          nonNewsletterCount: 10,
          lastUpdated: new Date()
        });
      }
    }
  }
}