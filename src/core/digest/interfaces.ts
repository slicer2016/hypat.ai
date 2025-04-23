/**
 * Email Digest Module Interfaces
 * Defines interfaces for generating and delivering email digests of newsletter content
 */

import { Category } from '../categorization/interfaces.js';
import { Topic } from '../../interfaces/content-processing.js';

/**
 * Digest format options
 */
export enum DigestFormat {
  BRIEF = 'brief',     // Short summary with minimal details
  STANDARD = 'standard', // Regular amount of content
  DETAILED = 'detailed'  // Comprehensive with full details
}

/**
 * Digest frequency options
 */
export enum DigestFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BI_WEEKLY = 'bi-weekly',
  MONTHLY = 'monthly'
}

/**
 * User preferences for email digest delivery
 */
export interface DigestPreferences {
  userId: string;
  email: string;
  frequency: DigestFrequency;
  format: DigestFormat;
  timeOfDay?: string; // Time in HH:MM format (24-hour), user's local time
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) for weekly digests
  timezone: string; // IANA timezone identifier (e.g., "America/New_York")
  categories?: string[]; // IDs of categories to include
  excludedNewsletters?: string[]; // IDs of newsletters to exclude
  customization?: Record<string, any>; // Additional customization options
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Represents a digest item - a piece of content included in a digest
 */
export interface DigestItem {
  id: string;
  newsletterId: string;
  newsletterName: string;
  title: string;
  summary: string;
  content: string;
  originalUrl?: string;
  category?: Category;
  topics: Topic[];
  imageUrl?: string;
  importance: number; // 0-1 scale of importance/relevance
  publishedAt: Date;
  createdAt: Date;
}

/**
 * Represents a section in a digest (e.g., by category, topic, etc.)
 */
export interface DigestSection {
  id: string;
  title: string;
  description?: string;
  type: 'category' | 'topic' | 'newsletter' | 'custom';
  referenceId?: string; // ID of the category, topic, or newsletter
  items: DigestItem[];
}

/**
 * Represents a complete digest
 */
export interface Digest {
  id: string;
  userId: string;
  title: string;
  description: string;
  frequency: DigestFrequency;
  format: DigestFormat;
  sections: DigestSection[];
  startDate: Date; // Start of the period covered by this digest
  endDate: Date; // End of the period covered by this digest
  generatedAt: Date;
}

/**
 * Email delivery options
 */
export interface EmailDeliveryOptions {
  to: string;
  from: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType: string;
  }>;
  trackOpens?: boolean;
  trackClicks?: boolean;
  scheduledTime?: Date;
}

/**
 * Email delivery status
 */
export enum EmailDeliveryStatus {
  SCHEDULED = 'scheduled',
  SENDING = 'sending',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  FAILED = 'failed'
}

/**
 * Email delivery tracking information
 */
export interface DeliveryTracking {
  id: string;
  digestId: string;
  userId: string;
  email: string;
  subject: string;
  status: EmailDeliveryStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  failureReason?: string;
  retryCount: number;
  links?: Array<{
    url: string;
    clickCount: number;
    lastClickedAt?: Date;
  }>;
}

/**
 * Digest template interface
 */
export interface DigestTemplate {
  id: string;
  name: string;
  description: string;
  frequency: DigestFrequency;
  format: DigestFormat;
  template: string; // MJML template or reference to template file
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Digest generator interface
 */
export interface DigestGenerator {
  /**
   * Generate a daily digest for a user
   * @param userId The user ID to generate the digest for
   * @param date The date to generate the digest for (defaults to today)
   */
  generateDailyDigest(userId: string, date?: Date): Promise<Digest>;
  
  /**
   * Generate a weekly digest for a user
   * @param userId The user ID to generate the digest for
   * @param endDate The end date of the week (defaults to today)
   */
  generateWeeklyDigest(userId: string, endDate?: Date): Promise<Digest>;
  
  /**
   * Generate a digest for a custom date range
   * @param userId The user ID to generate the digest for
   * @param startDate The start date of the range
   * @param endDate The end date of the range
   * @param format The digest format to use
   */
  generateCustomDigest(userId: string, startDate: Date, endDate: Date, format?: DigestFormat): Promise<Digest>;
}

/**
 * Email template renderer interface
 */
export interface EmailTemplateRenderer {
  /**
   * Render a digest to HTML using a template
   * @param digest The digest to render
   * @param templateId The ID of the template to use
   */
  renderDigest(digest: Digest, templateId: string): Promise<string>;
  
  /**
   * Render a custom template with data
   * @param templateId The ID of the template to use
   * @param data The data to render the template with
   */
  renderTemplate(templateId: string, data: Record<string, any>): Promise<string>;
  
  /**
   * Get all available templates
   */
  getTemplates(): Promise<DigestTemplate[]>;
  
  /**
   * Get a template by ID
   * @param templateId The ID of the template to get
   */
  getTemplate(templateId: string): Promise<DigestTemplate | null>;
}

/**
 * Email delivery scheduler interface
 */
export interface EmailDeliveryScheduler {
  /**
   * Schedule a digest delivery
   * @param userId The user ID to schedule for
   * @param digestType The type of digest to schedule
   * @param options Additional scheduling options
   */
  scheduleDigestDelivery(userId: string, digestType: DigestFrequency, options?: {
    specific?: Date;
    recurring?: boolean;
  }): Promise<string>; // Returns the schedule ID
  
  /**
   * Schedule a one-time email delivery
   * @param options The email delivery options
   */
  scheduleOneTimeDelivery(options: EmailDeliveryOptions): Promise<string>; // Returns the schedule ID
  
  /**
   * Cancel a scheduled delivery
   * @param scheduleId The ID of the schedule to cancel
   */
  cancelScheduledDelivery(scheduleId: string): Promise<boolean>;
  
  /**
   * Get all scheduled deliveries for a user
   * @param userId The user ID to get schedules for
   */
  getSchedulesForUser(userId: string): Promise<Array<{
    id: string;
    userId: string;
    digestType: DigestFrequency;
    nextRunTime: Date;
    recurring: boolean;
  }>>;
  
  /**
   * Start the scheduler
   */
  start(): Promise<void>;
  
  /**
   * Stop the scheduler
   */
  stop(): Promise<void>;
}

/**
 * Email sender interface
 */
export interface EmailSender {
  /**
   * Send an email
   * @param options The email delivery options
   */
  sendEmail(options: EmailDeliveryOptions): Promise<{ 
    success: boolean; 
    messageId?: string; 
    error?: Error 
  }>;
  
  /**
   * Send a digest as an email
   * @param digest The digest to send
   * @param recipient The email address to send to
   * @param renderedHtml The rendered HTML content
   */
  sendDigest(digest: Digest, recipient: string, renderedHtml: string): Promise<{ 
    success: boolean; 
    messageId?: string; 
    error?: Error 
  }>;
}

/**
 * Delivery tracker interface
 */
export interface DeliveryTracker {
  /**
   * Track a new email delivery
   * @param digestId The ID of the digest
   * @param userId The ID of the user
   * @param email The email address
   * @param subject The email subject
   */
  trackDelivery(digestId: string, userId: string, email: string, subject: string): Promise<DeliveryTracking>;
  
  /**
   * Update the status of a tracked delivery
   * @param trackingId The ID of the tracking record
   * @param status The new status
   * @param metadata Additional metadata
   */
  updateStatus(trackingId: string, status: EmailDeliveryStatus, metadata?: Record<string, any>): Promise<DeliveryTracking>;
  
  /**
   * Track an email open
   * @param trackingId The ID of the tracking record
   */
  trackOpen(trackingId: string): Promise<DeliveryTracking>;
  
  /**
   * Track a link click
   * @param trackingId The ID of the tracking record
   * @param url The URL that was clicked
   */
  trackClick(trackingId: string, url: string): Promise<DeliveryTracking>;
  
  /**
   * Get tracking information for a digest
   * @param digestId The ID of the digest
   */
  getTrackingForDigest(digestId: string): Promise<DeliveryTracking | null>;
  
  /**
   * Get all tracking records for a user
   * @param userId The ID of the user
   * @param limit The maximum number of records to return
   * @param offset The offset to start from
   */
  getTrackingForUser(userId: string, limit?: number, offset?: number): Promise<DeliveryTracking[]>;
}

/**
 * User preference manager interface
 */
export interface UserPreferenceManager {
  /**
   * Get digest preferences for a user
   * @param userId The ID of the user
   */
  getDigestPreferences(userId: string): Promise<DigestPreferences | null>;
  
  /**
   * Update digest preferences for a user
   * @param userId The ID of the user
   * @param preferences The digest preferences to update
   */
  updateDigestPreferences(userId: string, preferences: Partial<DigestPreferences>): Promise<DigestPreferences>;
  
  /**
   * Add a category to a user's digest preferences
   * @param userId The ID of the user
   * @param categoryId The ID of the category to add
   */
  addCategory(userId: string, categoryId: string): Promise<DigestPreferences>;
  
  /**
   * Remove a category from a user's digest preferences
   * @param userId The ID of the user
   * @param categoryId The ID of the category to remove
   */
  removeCategory(userId: string, categoryId: string): Promise<DigestPreferences>;
  
  /**
   * Exclude a newsletter from a user's digests
   * @param userId The ID of the user
   * @param newsletterId The ID of the newsletter to exclude
   */
  excludeNewsletter(userId: string, newsletterId: string): Promise<DigestPreferences>;
  
  /**
   * Include a previously excluded newsletter in a user's digests
   * @param userId The ID of the user
   * @param newsletterId The ID of the newsletter to include
   */
  includeNewsletter(userId: string, newsletterId: string): Promise<DigestPreferences>;
}

/**
 * DigestService interface as defined in the TDD
 */
export interface DigestService {
  /**
   * Generate a daily digest for a user
   * @param userId The ID of the user
   */
  generateDailyDigest(userId: string): Promise<Digest>;
  
  /**
   * Generate a weekly digest for a user
   * @param userId The ID of the user
   */
  generateWeeklyDigest(userId: string): Promise<Digest>;
  
  /**
   * Render an email template
   * @param digest The digest to render
   * @param template The template to use
   */
  renderEmailTemplate(digest: Digest, template: string): string;
  
  /**
   * Send an email
   * @param to The recipient
   * @param subject The subject
   * @param content The content
   */
  sendEmail(to: string, subject: string, content: string): Promise<void>;
  
  /**
   * Schedule digest deliveries
   */
  scheduleDigests(): void;
}