/**
 * Email Delivery Scheduler Implementation
 * Schedules email deliveries with time zone awareness and user preferences
 */

import { v4 as uuidv4 } from 'uuid';
import { CronJob } from 'cron';
import { DateTime } from 'luxon';
import { 
  DigestFrequency, 
  DigestGenerator, 
  DigestService, 
  EmailDeliveryOptions, 
  EmailDeliveryScheduler, 
  UserPreferenceManager 
} from './interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Schedule record for storing scheduled deliveries
 */
interface ScheduleRecord {
  id: string;
  userId: string;
  digestType?: DigestFrequency;
  options?: EmailDeliveryOptions;
  cronJob?: CronJob;
  nextRunTime: Date;
  recurring: boolean;
  createdAt: Date;
}

/**
 * Implementation of the EmailDeliveryScheduler interface
 */
export class EmailDeliverySchedulerImpl implements EmailDeliveryScheduler {
  private logger: Logger;
  private schedules: Map<string, ScheduleRecord>;
  private userPreferenceManager: UserPreferenceManager;
  private digestService: DigestService;
  private running: boolean = false;
  
  constructor(
    userPreferenceManager: UserPreferenceManager,
    digestService: DigestService
  ) {
    this.logger = new Logger('EmailDeliveryScheduler');
    this.schedules = new Map<string, ScheduleRecord>();
    this.userPreferenceManager = userPreferenceManager;
    this.digestService = digestService;
  }

  /**
   * Schedule a digest delivery
   * @param userId The user ID to schedule for
   * @param digestType The type of digest to schedule
   * @param options Additional scheduling options
   */
  async scheduleDigestDelivery(
    userId: string, 
    digestType: DigestFrequency, 
    options?: {
      specific?: Date;
      recurring?: boolean;
    }
  ): Promise<string> {
    try {
      this.logger.info(`Scheduling ${digestType} digest delivery for user: ${userId}`);
      
      // Get user preferences to determine schedule timing
      const userPreferences = await this.userPreferenceManager.getDigestPreferences(userId);
      if (!userPreferences) {
        throw new Error(`User preferences not found for user: ${userId}`);
      }
      
      const scheduleId = uuidv4();
      const recurring = options?.recurring !== undefined ? options.recurring : true;
      let nextRunTime: Date;
      
      if (options?.specific) {
        // Use the specific date if provided
        nextRunTime = options.specific;
      } else {
        // Calculate next run time based on preferences and digest type
        nextRunTime = this.calculateNextRunTime(
          digestType, 
          userPreferences.timeOfDay, 
          userPreferences.dayOfWeek, 
          userPreferences.timezone
        );
      }
      
      // Create the schedule record
      const scheduleRecord: ScheduleRecord = {
        id: scheduleId,
        userId,
        digestType,
        nextRunTime,
        recurring,
        createdAt: new Date()
      };
      
      // Set up the cron job if applicable
      if (recurring) {
        // Create a cron expression based on digest frequency and user preferences
        const cronExpression = this.createCronExpression(
          digestType,
          userPreferences.timeOfDay,
          userPreferences.dayOfWeek,
          userPreferences.timezone
        );
        
        this.logger.info(`Created cron expression: ${cronExpression} for ${digestType} digest`);
        
        const cronJob = new CronJob(
          cronExpression,
          () => {
            this.executeDigestDelivery(userId, digestType)
              .catch(error => {
                this.logger.error(`Error executing digest delivery: ${error instanceof Error ? error.message : String(error)}`);
              });
          },
          null, // onComplete
          this.running, // start
          userPreferences.timezone // timezone
        );
        
        scheduleRecord.cronJob = cronJob;
        
        // Start the job if scheduler is running
        if (this.running) {
          cronJob.start();
        }
      }
      
      // Store the schedule
      this.schedules.set(scheduleId, scheduleRecord);
      
      this.logger.info(`Scheduled ${digestType} digest delivery for user: ${userId} with ID: ${scheduleId}`);
      return scheduleId;
    } catch (error) {
      this.logger.error(`Error scheduling digest delivery: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to schedule digest delivery: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Schedule a one-time email delivery
   * @param options The email delivery options
   */
  async scheduleOneTimeDelivery(options: EmailDeliveryOptions): Promise<string> {
    try {
      this.logger.info(`Scheduling one-time email delivery to: ${options.to}`);
      
      const scheduleId = uuidv4();
      
      let nextRunTime: Date;
      if (options.scheduledTime) {
        nextRunTime = options.scheduledTime;
      } else {
        // Default to immediate delivery (5 seconds from now)
        nextRunTime = new Date(Date.now() + 5000);
      }
      
      // Create the schedule record
      const scheduleRecord: ScheduleRecord = {
        id: scheduleId,
        userId: 'one-time', // Placeholder for one-time deliveries
        options,
        nextRunTime,
        recurring: false,
        createdAt: new Date()
      };
      
      // Set a timeout for one-time delivery
      const delay = Math.max(0, nextRunTime.getTime() - Date.now());
      
      if (this.running) {
        setTimeout(() => {
          this.executeOneTimeDelivery(scheduleId, options)
            .catch(error => {
              this.logger.error(`Error executing one-time delivery: ${error instanceof Error ? error.message : String(error)}`);
            });
        }, delay);
      }
      
      // Store the schedule
      this.schedules.set(scheduleId, scheduleRecord);
      
      this.logger.info(`Scheduled one-time email delivery with ID: ${scheduleId} for: ${nextRunTime.toISOString()}`);
      return scheduleId;
    } catch (error) {
      this.logger.error(`Error scheduling one-time delivery: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to schedule one-time delivery: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Cancel a scheduled delivery
   * @param scheduleId The ID of the schedule to cancel
   */
  async cancelScheduledDelivery(scheduleId: string): Promise<boolean> {
    try {
      this.logger.info(`Cancelling scheduled delivery: ${scheduleId}`);
      
      const schedule = this.schedules.get(scheduleId);
      if (!schedule) {
        this.logger.warn(`Schedule not found for ID: ${scheduleId}`);
        return false;
      }
      
      // Stop the cron job if it exists
      if (schedule.cronJob) {
        schedule.cronJob.stop();
      }
      
      // Remove the schedule
      this.schedules.delete(scheduleId);
      
      this.logger.info(`Cancelled scheduled delivery: ${scheduleId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error cancelling scheduled delivery: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Get all scheduled deliveries for a user
   * @param userId The user ID to get schedules for
   */
  async getSchedulesForUser(userId: string): Promise<Array<{
    id: string;
    userId: string;
    digestType: DigestFrequency;
    nextRunTime: Date;
    recurring: boolean;
  }>> {
    try {
      this.logger.info(`Getting schedules for user: ${userId}`);
      
      const userSchedules = Array.from(this.schedules.values())
        .filter(schedule => schedule.userId === userId && schedule.digestType !== undefined)
        .map(schedule => ({
          id: schedule.id,
          userId: schedule.userId,
          digestType: schedule.digestType as DigestFrequency,
          nextRunTime: schedule.nextRunTime,
          recurring: schedule.recurring
        }));
      
      this.logger.info(`Found ${userSchedules.length} schedules for user: ${userId}`);
      return userSchedules;
    } catch (error) {
      this.logger.error(`Error getting schedules for user: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to get schedules for user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    try {
      this.logger.info('Starting email delivery scheduler');
      
      if (this.running) {
        this.logger.warn('Scheduler is already running');
        return;
      }
      
      this.running = true;
      
      // Start all cron jobs
      for (const [scheduleId, schedule] of this.schedules.entries()) {
        if (schedule.cronJob) {
          schedule.cronJob.start();
          this.logger.info(`Started cron job for schedule: ${scheduleId}`);
        }
      }
      
      this.logger.info('Email delivery scheduler started');
    } catch (error) {
      this.logger.error(`Error starting scheduler: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to start scheduler: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    try {
      this.logger.info('Stopping email delivery scheduler');
      
      if (!this.running) {
        this.logger.warn('Scheduler is not running');
        return;
      }
      
      this.running = false;
      
      // Stop all cron jobs
      for (const [scheduleId, schedule] of this.schedules.entries()) {
        if (schedule.cronJob) {
          schedule.cronJob.stop();
          this.logger.info(`Stopped cron job for schedule: ${scheduleId}`);
        }
      }
      
      this.logger.info('Email delivery scheduler stopped');
    } catch (error) {
      this.logger.error(`Error stopping scheduler: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to stop scheduler: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute a scheduled digest delivery
   * @param userId The user ID
   * @param digestType The type of digest to deliver
   */
  private async executeDigestDelivery(userId: string, digestType: DigestFrequency): Promise<void> {
    try {
      this.logger.info(`Executing ${digestType} digest delivery for user: ${userId}`);
      
      // Get user preferences
      const userPreferences = await this.userPreferenceManager.getDigestPreferences(userId);
      if (!userPreferences) {
        throw new Error(`User preferences not found for user: ${userId}`);
      }
      
      // Generate the digest
      let digest;
      switch (digestType) {
        case DigestFrequency.DAILY:
          digest = await this.digestService.generateDailyDigest(userId);
          break;
        case DigestFrequency.WEEKLY:
          digest = await this.digestService.generateWeeklyDigest(userId);
          break;
        default:
          throw new Error(`Unsupported digest type: ${digestType}`);
      }
      
      // Render the digest to HTML
      const templateId = `${digestType}-${userPreferences.format}`;
      const renderedHtml = this.digestService.renderEmailTemplate(digest, templateId);
      
      // Send the email
      await this.digestService.sendEmail(
        userPreferences.email,
        digest.title,
        renderedHtml
      );
      
      this.logger.info(`Successfully delivered ${digestType} digest to user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error executing digest delivery: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Execute a one-time email delivery
   * @param scheduleId The schedule ID
   * @param options The email delivery options
   */
  private async executeOneTimeDelivery(scheduleId: string, options: EmailDeliveryOptions): Promise<void> {
    try {
      this.logger.info(`Executing one-time email delivery for schedule: ${scheduleId}`);
      
      // Send the email
      await this.digestService.sendEmail(
        options.to,
        options.subject,
        options.html || options.text || ''
      );
      
      // Remove the schedule after execution
      this.schedules.delete(scheduleId);
      
      this.logger.info(`Successfully executed one-time email delivery for schedule: ${scheduleId}`);
    } catch (error) {
      this.logger.error(`Error executing one-time delivery: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Calculate the next run time based on digest type and user preferences
   * @param digestType The digest frequency
   * @param timeOfDay The preferred time of day (HH:MM)
   * @param dayOfWeek The preferred day of week (0-6)
   * @param timezone The user's timezone
   */
  private calculateNextRunTime(
    digestType: DigestFrequency,
    timeOfDay?: string,
    dayOfWeek?: number,
    timezone: string = 'UTC'
  ): Date {
    // Default time is 8:00 AM if not specified
    const defaultTime = '08:00';
    const time = timeOfDay || defaultTime;
    const [hours, minutes] = time.split(':').map(Number);
    
    // Start with current time in user's timezone
    let dateTime = DateTime.now().setZone(timezone);
    
    // Set the time
    dateTime = dateTime.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
    
    // If the time has already passed today, move to tomorrow
    if (dateTime < DateTime.now().setZone(timezone)) {
      dateTime = dateTime.plus({ days: 1 });
    }
    
    // Adjust based on digest frequency
    switch (digestType) {
      case DigestFrequency.DAILY:
        // Already set for tomorrow if needed
        break;
      
      case DigestFrequency.WEEKLY:
        // Default to Monday if not specified
        const targetDay = dayOfWeek !== undefined ? dayOfWeek : 1;
        
        // Calculate days to add to reach the target day
        let daysToAdd = targetDay - dateTime.weekday;
        if (daysToAdd <= 0) {
          daysToAdd += 7; // Move to next week
        }
        
        dateTime = dateTime.plus({ days: daysToAdd });
        break;
      
      case DigestFrequency.BI_WEEKLY:
        // Default to Monday if not specified
        const biWeeklyTargetDay = dayOfWeek !== undefined ? dayOfWeek : 1;
        
        // Calculate days to add to reach the target day
        let biWeeklyDaysToAdd = biWeeklyTargetDay - dateTime.weekday;
        if (biWeeklyDaysToAdd <= 0) {
          biWeeklyDaysToAdd += 7; // Move to next week
        }
        
        dateTime = dateTime.plus({ days: biWeeklyDaysToAdd });
        
        // Add another week to make it bi-weekly
        dateTime = dateTime.plus({ weeks: 1 });
        break;
      
      case DigestFrequency.MONTHLY:
        // Default to 1st day of month if not specified
        const targetDate = dayOfWeek !== undefined ? dayOfWeek + 1 : 1;
        
        // Move to next month if target date has passed this month
        if (dateTime.day > targetDate || (dateTime.day === targetDate && dateTime < DateTime.now().setZone(timezone))) {
          dateTime = dateTime.plus({ months: 1 });
        }
        
        // Set the target date
        dateTime = dateTime.set({ day: targetDate });
        break;
    }
    
    return dateTime.toJSDate();
  }

  /**
   * Create a cron expression based on digest frequency and user preferences
   * @param digestType The digest frequency
   * @param timeOfDay The preferred time of day (HH:MM)
   * @param dayOfWeek The preferred day of week (0-6)
   * @param timezone The user's timezone
   */
  private createCronExpression(
    digestType: DigestFrequency,
    timeOfDay?: string,
    dayOfWeek?: number,
    timezone: string = 'UTC'
  ): string {
    // Default time is 8:00 AM if not specified
    const defaultTime = '08:00';
    const time = timeOfDay || defaultTime;
    const [hours, minutes] = time.split(':').map(Number);
    
    // Create different cron expressions based on digest frequency
    switch (digestType) {
      case DigestFrequency.DAILY:
        // Run daily at the specified time
        return `0 ${minutes} ${hours} * * *`;
      
      case DigestFrequency.WEEKLY:
        // Run weekly on the specified day at the specified time
        // Default to Monday (1) if not specified
        const weeklyDay = dayOfWeek !== undefined ? dayOfWeek : 1;
        return `0 ${minutes} ${hours} * * ${weeklyDay}`;
      
      case DigestFrequency.BI_WEEKLY:
        // Bi-weekly is more complex, we'll use a daily cron expression and additional logic
        // to only execute every other week
        const biWeeklyDay = dayOfWeek !== undefined ? dayOfWeek : 1;
        return `0 ${minutes} ${hours} * * ${biWeeklyDay}`;
      
      case DigestFrequency.MONTHLY:
        // Run monthly on the specified date at the specified time
        // Default to 1st day of month if not specified
        const monthlyDate = dayOfWeek !== undefined ? dayOfWeek + 1 : 1;
        return `0 ${minutes} ${hours} ${monthlyDate} * *`;
      
      default:
        throw new Error(`Unsupported digest frequency: ${digestType}`);
    }
  }
}