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
 * @param contentProcessor The content processor to use
 * @param categorizer The categorizer to use
 * @param smtpConfig SMTP configuration for email sending
 */
export function createDigestService(
  contentProcessor: ContentProcessor,
  categorizer: Categorizer,
  smtpConfig: {
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
  
  const digestGenerator = new DigestGeneratorImpl(
    contentProcessor,
    categorizer,
    userPreferenceManager
  );
  
  const templateRenderer = new EmailTemplateRendererImpl();
  
  const deliveryTracker = new DeliveryTrackerImpl();
  
  const emailSender = new EmailSenderImpl(
    smtpConfig,
    `Hypat.ai Digests <digests@hypat.ai>`,
    deliveryTracker
  );
  
  // Create digest service (need it for the scheduler)
  const digestService = new DigestServiceImpl(
    digestGenerator,
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
  
  return {
    digestGenerator,
    templateRenderer,
    deliveryScheduler,
    emailSender,
    deliveryTracker,
    userPreferenceManager,
    digestService
  };
}