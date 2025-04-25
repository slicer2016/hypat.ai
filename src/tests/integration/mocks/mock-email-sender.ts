/**
 * MockEmailSender
 * 
 * Mock implementation of email sending service for integration testing
 * Captures sent emails for verification without actually sending anything
 */

import { Logger } from '../../../utils/logger.js';

/**
 * Email structure for testing
 */
export interface MockEmail {
  id: string;
  to: string | string[];
  from: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
  sentAt: Date;
  trackingId?: string;
}

/**
 * Email sending options
 */
export interface SendEmailOptions {
  to: string | string[];
  from: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
  trackingId?: string;
}

/**
 * Mock implementation of email sender service
 */
export class MockEmailSender {
  private logger: Logger;
  private sentEmails: MockEmail[] = [];
  private emailIdCounter: number = 1;
  
  constructor() {
    this.logger = new Logger('MockEmailSender');
  }
  
  /**
   * Send email (mock implementation that just stores the email)
   * @param options Email options
   * @returns Mock email result with generated ID
   */
  async sendEmail(options: SendEmailOptions): Promise<{ emailId: string }> {
    // Generate ID for the email
    const emailId = `mock-email-${this.emailIdCounter++}`;
    
    // Create mock email
    const mockEmail: MockEmail = {
      id: emailId,
      to: options.to,
      from: options.from,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
      sentAt: new Date(),
      trackingId: options.trackingId
    };
    
    // Store the email
    this.sentEmails.push(mockEmail);
    
    this.logger.debug(`Sent mock email: ${emailId}`, { 
      to: options.to, 
      subject: options.subject 
    });
    
    return { emailId };
  }
  
  /**
   * Get all sent emails
   */
  getSentEmails(): MockEmail[] {
    return [...this.sentEmails];
  }
  
  /**
   * Get emails sent to a specific recipient
   * @param recipient The recipient email address
   */
  getEmailsSentTo(recipient: string): MockEmail[] {
    return this.sentEmails.filter(email => {
      if (Array.isArray(email.to)) {
        return email.to.includes(recipient);
      }
      return email.to === recipient;
    });
  }
  
  /**
   * Find emails with a specific subject
   * @param subject The subject to match (can be partial)
   */
  findEmailsBySubject(subject: string): MockEmail[] {
    return this.sentEmails.filter(email => 
      email.subject.includes(subject)
    );
  }
  
  /**
   * Get the most recently sent email
   */
  getLastEmail(): MockEmail | undefined {
    if (this.sentEmails.length === 0) {
      return undefined;
    }
    
    return this.sentEmails[this.sentEmails.length - 1];
  }
  
  /**
   * Clear all sent emails
   */
  clearEmails(): void {
    this.sentEmails = [];
    this.logger.debug('Cleared all sent emails');
  }
  
  /**
   * Add a sent email directly (for testing)
   * @param email The email to add
   */
  addSentEmail(email: Partial<MockEmail>): MockEmail {
    // Generate ID for the email if not provided
    const emailId = email.id || `mock-email-${this.emailIdCounter++}`;
    
    // Create complete mock email
    const mockEmail: MockEmail = {
      id: emailId,
      to: email.to || 'test@example.com',
      from: email.from || 'system@hypat.ai',
      subject: email.subject || 'Test Email',
      html: email.html,
      text: email.text,
      attachments: email.attachments,
      sentAt: email.sentAt || new Date(),
      trackingId: email.trackingId
    };
    
    // Store the email
    this.sentEmails.push(mockEmail);
    
    this.logger.debug(`Added mock email: ${emailId}`, { 
      to: mockEmail.to, 
      subject: mockEmail.subject 
    });
    
    return mockEmail;
  }
  
  /**
   * Register email open event (for tracking)
   * @param trackingId The tracking ID
   */
  trackEmailOpen(trackingId: string): void {
    const email = this.sentEmails.find(e => e.trackingId === trackingId);
    
    if (email) {
      this.logger.debug(`Tracked email open: ${email.id} (${trackingId})`);
    }
  }
  
  /**
   * Register email link click (for tracking)
   * @param trackingId The tracking ID
   * @param linkUrl The clicked URL
   */
  trackEmailClick(trackingId: string, linkUrl: string): void {
    const email = this.sentEmails.find(e => e.trackingId === trackingId);
    
    if (email) {
      this.logger.debug(`Tracked email click: ${email.id} (${trackingId}), link: ${linkUrl}`);
    }
  }
}