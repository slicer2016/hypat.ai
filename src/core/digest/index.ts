/**
 * Email Digest Module
 * Main entry point for the Email Digest Module
 */

// Export all interfaces and types
export * from './interfaces.js';

// Export implementations
export { DigestGeneratorImpl } from './digest-generator.js';
export { EmailTemplateRendererImpl } from './email-template-renderer.js';
export { EmailDeliverySchedulerImpl } from './email-delivery-scheduler.js';
export { EmailSenderImpl } from './email-sender.js';
export { DeliveryTrackerImpl } from './delivery-tracker.js';
export { UserPreferenceManagerImpl } from './user-preference-manager.js';
export { DigestServiceImpl } from './digest-service.js';

// Factory function to create and wire up all digest components
import { DigestGenerator } from './interfaces.js';
import { DigestGeneratorImpl } from './digest-generator.js';
import { EmailTemplateRendererImpl } from './email-template-renderer.js';
import { EmailDeliverySchedulerImpl } from './email-delivery-scheduler.js';
import { EmailSenderImpl } from './email-sender.js';
import { DeliveryTrackerImpl } from './delivery-tracker.js';
import { UserPreferenceManagerImpl } from './user-preference-manager.js';
import { DigestServiceImpl } from './digest-service.js';
import { ContentProcessor } from '../../interfaces/content-processing.js';
import { Categorizer } from '../categorization/interfaces.js';

/**
 * Create and wire up all digest components
 * For testing or when no params provided, creates a simplified instance suitable for testing
 * @param contentProcessor The content processor to use (optional in test env)
 * @param categorizer The categorizer to use (optional in test env)
 * @param smtpConfig SMTP configuration for email sending (optional)
 */
export function createDigestService(
  contentProcessor?: ContentProcessor,
  categorizer?: Categorizer,
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  }
) {
  // Create all components
  const userPreferenceManager = new UserPreferenceManagerImpl();
  
  // In test environment, create mock/stub components when dependencies not provided
  const digestGenerator = contentProcessor && categorizer ? 
    new DigestGeneratorImpl(contentProcessor, categorizer, userPreferenceManager) :
    {
      generateDigest: async (options: any) => ({
        id: 'test-digest-id',
        title: options.title || 'Test Digest',
        description: options.description || 'Test digest description',
        startDate: options.startDate || new Date(),
        endDate: options.endDate || new Date(),
        generatedAt: new Date(),
        userId: options.userId || 'test-user-id',
        frequency: options.frequency || 'daily',
        format: options.format || 'html',
        detailLevel: options.detailLevel || 'summary',
        content: '<p>Test digest content</p>',
        metadata: {
          totalNewsletters: 3,
          categories: ['Technology', 'Finance'],
          themes: []
        },
        sections: []
      })
    };
  
  const templateRenderer = new EmailTemplateRendererImpl();
  
  const deliveryTracker = new DeliveryTrackerImpl();
  
  // Default SMTP config for tests or when not provided
  const defaultSmtpConfig = {
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'test@example.com',
      pass: 'password'
    }
  };
  
  const emailSender = new EmailSenderImpl(
    smtpConfig || defaultSmtpConfig,
    `Hypat.ai Digests <digests@hypat.ai>`,
    deliveryTracker
  );
  
  // Create digest service (need it for the scheduler)
  const digestService = new DigestServiceImpl(
    digestGenerator as any,
    templateRenderer,
    emailSender,
    null as any, // Will be set after creation
    userPreferenceManager
  );
  
  // Create scheduler with the digest service
  const deliveryScheduler = new EmailDeliverySchedulerImpl(
    userPreferenceManager,
    digestService
  );
  
  // Set the scheduler in the digest service
  (digestService as any).deliveryScheduler = deliveryScheduler;
  
  // Helper method to expose the template renderer directly for tests
  (digestService as any).getEmailTemplateRenderer = () => templateRenderer;
  
  return digestService;
}