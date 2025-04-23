/**
 * Email Sender Implementation
 * Sends emails using nodemailer with support for HTML content and tracking
 */

import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
import { 
  Digest, 
  DeliveryTracker, 
  EmailDeliveryOptions,
  EmailDeliveryStatus,
  EmailSender 
} from './interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Nodemailer transport options
 */
interface TransportOptions {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  service?: string;
  // Support for other nodemailer transport options as needed
}

/**
 * Implementation of the EmailSender interface
 */
export class EmailSenderImpl implements EmailSender {
  private logger: Logger;
  private transporter: nodemailer.Transporter;
  private defaultFrom: string;
  private deliveryTracker?: DeliveryTracker;
  
  constructor(
    transportOptions: TransportOptions, 
    defaultFrom: string,
    deliveryTracker?: DeliveryTracker
  ) {
    this.logger = new Logger('EmailSender');
    this.transporter = nodemailer.createTransport(transportOptions);
    this.defaultFrom = defaultFrom;
    this.deliveryTracker = deliveryTracker;
    
    // Verify the transporter configuration
    this.verifyTransporter().catch(error => {
      this.logger.error(`Transporter verification failed: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  /**
   * Send an email
   * @param options The email delivery options
   */
  async sendEmail(options: EmailDeliveryOptions): Promise<{ 
    success: boolean; 
    messageId?: string; 
    error?: Error 
  }> {
    try {
      this.logger.info(`Sending email to: ${options.to} with subject: ${options.subject}`);
      
      // Prepare the email options
      const mailOptions: nodemailer.SendMailOptions = {
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html || undefined,
        text: options.text || undefined,
        attachments: options.attachments,
        headers: {}
      };
      
      // Add tracking pixel if tracking is enabled
      if (options.trackOpens && this.deliveryTracker) {
        const trackingId = uuidv4();
        const htmlContent = typeof mailOptions.html === 'string' ? mailOptions.html : '';
        mailOptions.html = this.addTrackingPixel(htmlContent, trackingId);
      }
      
      // Add link tracking if enabled
      if (options.trackClicks && this.deliveryTracker && mailOptions.html) {
        const htmlContent = typeof mailOptions.html === 'string' ? mailOptions.html : '';
        mailOptions.html = this.addLinkTracking(htmlContent);
      }
      
      // Send the email
      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.info(`Email sent successfully: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      this.logger.error(`Error sending email: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Send a digest as an email
   * @param digest The digest to send
   * @param recipient The email address to send to
   * @param renderedHtml The rendered HTML content
   */
  async sendDigest(digest: Digest, recipient: string, renderedHtml: string): Promise<{ 
    success: boolean; 
    messageId?: string; 
    error?: Error 
  }> {
    try {
      this.logger.info(`Sending digest ${digest.id} to: ${recipient}`);
      
      // Create plain text version from HTML
      const plainText = this.createPlainTextVersion(renderedHtml);
      
      // Prepare delivery options
      const options: EmailDeliveryOptions = {
        to: recipient,
        from: this.defaultFrom,
        subject: digest.title,
        html: renderedHtml,
        text: plainText,
        trackOpens: true,
        trackClicks: true
      };
      
      // Track the delivery if a tracker is available
      if (this.deliveryTracker) {
        await this.deliveryTracker.trackDelivery(
          digest.id,
          digest.userId,
          recipient,
          digest.title
        );
      }
      
      // Send the email
      const result = await this.sendEmail(options);
      
      // Update tracking status if available
      if (this.deliveryTracker && result.success) {
        await this.deliveryTracker.updateStatus(
          digest.id, 
          EmailDeliveryStatus.DELIVERED, 
          { messageId: result.messageId }
        );
      }
      
      return result;
    } catch (error) {
      this.logger.error(`Error sending digest: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Verify the nodemailer transporter configuration
   */
  private async verifyTransporter(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.info('Nodemailer transporter verified successfully');
    } catch (error) {
      this.logger.error(`Nodemailer transporter verification failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Add a tracking pixel to HTML content
   * @param html The HTML content
   * @param trackingId The tracking ID
   */
  private addTrackingPixel(html: string, trackingId: string): string {
    // A 1x1 transparent GIF tracking pixel linked to our tracking endpoint
    const trackingPixel = `<img src="https://hypat.ai/api/track/open/${trackingId}" width="1" height="1" alt="" style="display:none;"/>`;
    
    // Add the tracking pixel just before the closing body tag
    if (html.includes('</body>')) {
      return html.replace('</body>', `${trackingPixel}</body>`);
    } else {
      // If no body tag, append to the end
      return `${html}${trackingPixel}`;
    }
  }

  /**
   * Add link tracking to HTML content
   * @param html The HTML content
   */
  private addLinkTracking(html: string): string {
    // Regular expression to find links
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(https?:\/\/[^"']+)\1/gi;
    
    // Replace links with tracked versions
    return html.replace(linkRegex, (match, quote, url) => {
      const trackingId = uuidv4();
      const encodedUrl = encodeURIComponent(url);
      return `<a href=${quote}https://hypat.ai/api/track/click/${trackingId}?url=${encodedUrl}${quote}`;
    });
  }

  /**
   * Create a plain text version from HTML content
   * @param html The HTML content
   */
  private createPlainTextVersion(html: string): string {
    // A very simple HTML to text conversion
    // In a real application, use a dedicated library like html-to-text
    
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, '');
    
    // Replace common entities
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'");
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }
}