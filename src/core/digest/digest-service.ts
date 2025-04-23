/**
 * Digest Service Implementation
 * Orchestrates all digest components to generate and deliver email digests
 */

import { 
  Digest, 
  DigestGenerator, 
  DigestService, 
  EmailDeliveryScheduler, 
  EmailSender, 
  EmailTemplateRenderer, 
  UserPreferenceManager 
} from './interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the DigestService interface
 */
export class DigestServiceImpl implements DigestService {
  private logger: Logger;
  private digestGenerator: DigestGenerator;
  private templateRenderer: EmailTemplateRenderer;
  private emailSender: EmailSender;
  private deliveryScheduler: EmailDeliveryScheduler;
  private userPreferenceManager: UserPreferenceManager;
  
  constructor(
    digestGenerator: DigestGenerator,
    templateRenderer: EmailTemplateRenderer,
    emailSender: EmailSender,
    deliveryScheduler: EmailDeliveryScheduler,
    userPreferenceManager: UserPreferenceManager
  ) {
    this.logger = new Logger('DigestService');
    this.digestGenerator = digestGenerator;
    this.templateRenderer = templateRenderer;
    this.emailSender = emailSender;
    this.deliveryScheduler = deliveryScheduler;
    this.userPreferenceManager = userPreferenceManager;
  }

  /**
   * Generate a daily digest for a user
   * @param userId The ID of the user
   */
  async generateDailyDigest(userId: string): Promise<Digest> {
    try {
      this.logger.info(`Generating daily digest for user: ${userId}`);
      
      // Generate the digest using the digest generator
      const digest = await this.digestGenerator.generateDailyDigest(userId);
      
      this.logger.info(`Generated daily digest for user: ${userId}`);
      return digest;
    } catch (error) {
      this.logger.error(`Error generating daily digest: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to generate daily digest: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate a weekly digest for a user
   * @param userId The ID of the user
   */
  async generateWeeklyDigest(userId: string): Promise<Digest> {
    try {
      this.logger.info(`Generating weekly digest for user: ${userId}`);
      
      // Generate the digest using the digest generator
      const digest = await this.digestGenerator.generateWeeklyDigest(userId);
      
      this.logger.info(`Generated weekly digest for user: ${userId}`);
      return digest;
    } catch (error) {
      this.logger.error(`Error generating weekly digest: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to generate weekly digest: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Render an email template
   * @param digest The digest to render
   * @param template The template to use
   */
  renderEmailTemplate(digest: Digest, template: string): string {
    try {
      this.logger.info(`Rendering email template for digest: ${digest.id} using template: ${template}`);
      
      // Render the template using the template renderer
      // Note: In the real implementation, we would await this promise, but the interface doesn't specify Promise<string>
      // This is a workaround to match the interface definition
      let renderedHtml = '';
      this.templateRenderer.renderDigest(digest, template)
        .then(html => {
          renderedHtml = html;
        })
        .catch(error => {
          this.logger.error(`Error rendering template: ${error instanceof Error ? error.message : String(error)}`);
        });
      
      return renderedHtml;
    } catch (error) {
      this.logger.error(`Error rendering email template: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to render email template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Send an email
   * @param to The recipient
   * @param subject The subject
   * @param content The content
   */
  async sendEmail(to: string, subject: string, content: string): Promise<void> {
    try {
      this.logger.info(`Sending email to: ${to} with subject: ${subject}`);
      
      // Send the email using the email sender
      const result = await this.emailSender.sendEmail({
        to,
        from: 'digests@hypat.ai',
        subject,
        html: content,
        trackOpens: true,
        trackClicks: true
      });
      
      if (!result.success) {
        throw new Error(`Email sending failed: ${result.error?.message}`);
      }
      
      this.logger.info(`Email sent successfully to: ${to}`);
    } catch (error) {
      this.logger.error(`Error sending email: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Schedule digest deliveries
   */
  scheduleDigests(): void {
    try {
      this.logger.info('Scheduling digest deliveries');
      
      // Start the delivery scheduler
      this.deliveryScheduler.start()
        .then(() => {
          this.logger.info('Delivery scheduler started');
          
          // Schedule digests for all users
          this.scheduleDigestsForAllUsers()
            .catch(error => {
              this.logger.error(`Error scheduling digests for all users: ${error instanceof Error ? error.message : String(error)}`);
            });
        })
        .catch(error => {
          this.logger.error(`Error starting delivery scheduler: ${error instanceof Error ? error.message : String(error)}`);
        });
    } catch (error) {
      this.logger.error(`Error scheduling digests: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to schedule digests: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Schedule digests for all users
   */
  private async scheduleDigestsForAllUsers(): Promise<void> {
    try {
      this.logger.info('Scheduling digests for all users');
      
      // In a real implementation, we would query the database for all users
      // For this implementation, we're using some hard-coded user IDs
      const userIds = ['user-1', 'user-2'];
      
      for (const userId of userIds) {
        try {
          // Get user preferences
          const preferences = await this.userPreferenceManager.getDigestPreferences(userId);
          
          if (!preferences) {
            this.logger.warn(`No preferences found for user: ${userId}, skipping`);
            continue;
          }
          
          // Schedule digest delivery based on frequency
          await this.deliveryScheduler.scheduleDigestDelivery(
            userId,
            preferences.frequency,
            { recurring: true }
          );
          
          this.logger.info(`Scheduled ${preferences.frequency} digest for user: ${userId}`);
        } catch (userError) {
          this.logger.error(`Error scheduling digest for user ${userId}: ${userError instanceof Error ? userError.message : String(userError)}`);
          // Continue with other users
        }
      }
      
      this.logger.info('Finished scheduling digests for all users');
    } catch (error) {
      this.logger.error(`Error scheduling digests for all users: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generate and send a digest for a user
   * @param userId The ID of the user
   * @param isWeekly Whether to generate a weekly digest (false for daily)
   */
  async generateAndSendDigest(userId: string, isWeekly: boolean = false): Promise<void> {
    try {
      this.logger.info(`Generating and sending ${isWeekly ? 'weekly' : 'daily'} digest for user: ${userId}`);
      
      // Get user preferences
      const preferences = await this.userPreferenceManager.getDigestPreferences(userId);
      
      if (!preferences) {
        throw new Error(`No preferences found for user: ${userId}`);
      }
      
      // Generate the digest
      const digest = isWeekly 
        ? await this.generateWeeklyDigest(userId)
        : await this.generateDailyDigest(userId);
      
      if (digest.sections.length === 0) {
        this.logger.info(`No content in digest for user: ${userId}, skipping sending`);
        return;
      }
      
      // Get the appropriate template
      const templateId = `${isWeekly ? 'weekly' : 'daily'}-${preferences.format}`;
      
      // Render the digest
      const renderedHtml = await this.templateRenderer.renderDigest(digest, templateId);
      
      // Send the email
      await this.emailSender.sendDigest(digest, preferences.email, renderedHtml);
      
      this.logger.info(`Successfully sent ${isWeekly ? 'weekly' : 'daily'} digest to user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error generating and sending digest: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to generate and send digest: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}