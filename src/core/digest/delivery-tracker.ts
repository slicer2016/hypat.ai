/**
 * Delivery Tracker Implementation
 * Tracks email delivery status, opens, and clicks
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  DeliveryTracker, 
  DeliveryTracking, 
  EmailDeliveryStatus 
} from './interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the DeliveryTracker interface
 */
export class DeliveryTrackerImpl implements DeliveryTracker {
  private logger: Logger;
  
  // In-memory storage for tracking records (would be replaced by database in production)
  private trackingRecords: Map<string, DeliveryTracking>;
  
  constructor() {
    this.logger = new Logger('DeliveryTracker');
    this.trackingRecords = new Map<string, DeliveryTracking>();
  }

  /**
   * Track a new email delivery
   * @param digestId The ID of the digest
   * @param userId The ID of the user
   * @param email The email address
   * @param subject The email subject
   */
  async trackDelivery(
    digestId: string, 
    userId: string, 
    email: string, 
    subject: string
  ): Promise<DeliveryTracking> {
    try {
      this.logger.info(`Tracking delivery for digest: ${digestId} to user: ${userId}`);
      
      // Create a tracking record
      const tracking: DeliveryTracking = {
        id: uuidv4(),
        digestId,
        userId,
        email,
        subject,
        status: EmailDeliveryStatus.SCHEDULED,
        retryCount: 0,
        links: []
      };
      
      // Store the tracking record
      this.trackingRecords.set(tracking.id, tracking);
      
      this.logger.info(`Created tracking record: ${tracking.id} for digest: ${digestId}`);
      return tracking;
    } catch (error) {
      this.logger.error(`Error tracking delivery: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to track delivery: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update the status of a tracked delivery
   * @param trackingId The ID of the tracking record
   * @param status The new status
   * @param metadata Additional metadata
   */
  async updateStatus(
    trackingId: string, 
    status: EmailDeliveryStatus, 
    metadata?: Record<string, any>
  ): Promise<DeliveryTracking> {
    try {
      this.logger.info(`Updating status for tracking record: ${trackingId} to: ${status}`);
      
      // Get the tracking record
      const tracking = this.trackingRecords.get(trackingId);
      if (!tracking) {
        throw new Error(`Tracking record not found: ${trackingId}`);
      }
      
      // Update the status
      tracking.status = status;
      
      // Update timestamp based on status
      switch (status) {
        case EmailDeliveryStatus.SENDING:
          tracking.sentAt = new Date();
          break;
        case EmailDeliveryStatus.DELIVERED:
          tracking.deliveredAt = new Date();
          break;
        case EmailDeliveryStatus.OPENED:
          tracking.openedAt = new Date();
          break;
        case EmailDeliveryStatus.CLICKED:
          tracking.clickedAt = new Date();
          break;
        case EmailDeliveryStatus.FAILED:
          tracking.failureReason = metadata?.error?.toString() || 'Unknown error';
          tracking.retryCount++;
          break;
      }
      
      // Update other metadata if provided
      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          if (key !== 'status' && key !== 'id') {
            (tracking as any)[key] = value;
          }
        });
      }
      
      // Store the updated tracking record
      this.trackingRecords.set(trackingId, tracking);
      
      this.logger.info(`Updated status for tracking record: ${trackingId} to: ${status}`);
      return tracking;
    } catch (error) {
      this.logger.error(`Error updating status: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to update status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Track an email open
   * @param trackingId The ID of the tracking record
   */
  async trackOpen(trackingId: string): Promise<DeliveryTracking> {
    try {
      this.logger.info(`Tracking open for tracking record: ${trackingId}`);
      
      // Get the tracking record
      const tracking = this.trackingRecords.get(trackingId);
      if (!tracking) {
        throw new Error(`Tracking record not found: ${trackingId}`);
      }
      
      // Update the status if not already opened
      if (tracking.status !== EmailDeliveryStatus.OPENED) {
        return this.updateStatus(trackingId, EmailDeliveryStatus.OPENED);
      }
      
      // Update the openedAt timestamp if already opened
      tracking.openedAt = new Date();
      
      // Store the updated tracking record
      this.trackingRecords.set(trackingId, tracking);
      
      this.logger.info(`Tracked open for tracking record: ${trackingId}`);
      return tracking;
    } catch (error) {
      this.logger.error(`Error tracking open: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to track open: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Track a link click
   * @param trackingId The ID of the tracking record
   * @param url The URL that was clicked
   */
  async trackClick(trackingId: string, url: string): Promise<DeliveryTracking> {
    try {
      this.logger.info(`Tracking click for tracking record: ${trackingId} on URL: ${url}`);
      
      // Get the tracking record
      const tracking = this.trackingRecords.get(trackingId);
      if (!tracking) {
        throw new Error(`Tracking record not found: ${trackingId}`);
      }
      
      // Update the status if not already clicked
      if (tracking.status !== EmailDeliveryStatus.CLICKED) {
        await this.updateStatus(trackingId, EmailDeliveryStatus.CLICKED);
      }
      
      // Initialize links array if needed
      if (!tracking.links) {
        tracking.links = [];
      }
      
      // Find the link or create a new entry
      const linkEntry = tracking.links.find(link => link.url === url);
      if (linkEntry) {
        // Update existing link entry
        linkEntry.clickCount++;
        linkEntry.lastClickedAt = new Date();
      } else {
        // Create new link entry
        tracking.links.push({
          url,
          clickCount: 1,
          lastClickedAt: new Date()
        });
      }
      
      // Store the updated tracking record
      this.trackingRecords.set(trackingId, tracking);
      
      this.logger.info(`Tracked click for tracking record: ${trackingId} on URL: ${url}`);
      return tracking;
    } catch (error) {
      this.logger.error(`Error tracking click: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to track click: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get tracking information for a digest
   * @param digestId The ID of the digest
   */
  async getTrackingForDigest(digestId: string): Promise<DeliveryTracking | null> {
    try {
      this.logger.info(`Getting tracking information for digest: ${digestId}`);
      
      // Find the tracking record for the digest
      for (const tracking of this.trackingRecords.values()) {
        if (tracking.digestId === digestId) {
          return tracking;
        }
      }
      
      this.logger.info(`No tracking information found for digest: ${digestId}`);
      return null;
    } catch (error) {
      this.logger.error(`Error getting tracking for digest: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to get tracking for digest: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all tracking records for a user
   * @param userId The ID of the user
   * @param limit The maximum number of records to return
   * @param offset The offset to start from
   */
  async getTrackingForUser(
    userId: string, 
    limit?: number, 
    offset?: number
  ): Promise<DeliveryTracking[]> {
    try {
      this.logger.info(`Getting tracking records for user: ${userId} (limit: ${limit}, offset: ${offset})`);
      
      // Find all tracking records for the user
      const userTracking = Array.from(this.trackingRecords.values())
        .filter(tracking => tracking.userId === userId)
        .sort((a, b) => {
          // Sort by most recent first (based on any timestamp available)
          const aDate = a.sentAt || a.deliveredAt || a.openedAt || a.clickedAt;
          const bDate = b.sentAt || b.deliveredAt || b.openedAt || b.clickedAt;
          
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          
          return bDate.getTime() - aDate.getTime();
        });
      
      // Apply pagination if needed
      let paginatedTracking = userTracking;
      if (offset !== undefined && offset > 0) {
        paginatedTracking = paginatedTracking.slice(offset);
      }
      if (limit !== undefined && limit > 0) {
        paginatedTracking = paginatedTracking.slice(0, limit);
      }
      
      this.logger.info(`Found ${paginatedTracking.length} tracking records for user: ${userId}`);
      return paginatedTracking;
    } catch (error) {
      this.logger.error(`Error getting tracking for user: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to get tracking for user: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate tracking statistics for a user
   * @param userId The ID of the user
   */
  async generateUserStats(userId: string): Promise<{
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    openRate: number;
    clickRate: number;
    mostRecentActivity?: Date;
  }> {
    try {
      // Get all tracking records for the user
      const userTracking = await this.getTrackingForUser(userId);
      
      // Calculate statistics
      const totalSent = userTracking.filter(t => 
        t.status === EmailDeliveryStatus.DELIVERED || 
        t.status === EmailDeliveryStatus.OPENED || 
        t.status === EmailDeliveryStatus.CLICKED
      ).length;
      
      const totalOpened = userTracking.filter(t => 
        t.status === EmailDeliveryStatus.OPENED || 
        t.status === EmailDeliveryStatus.CLICKED
      ).length;
      
      const totalClicked = userTracking.filter(t => 
        t.status === EmailDeliveryStatus.CLICKED
      ).length;
      
      // Calculate rates
      const openRate = totalSent > 0 ? totalOpened / totalSent : 0;
      const clickRate = totalSent > 0 ? totalClicked / totalSent : 0;
      
      // Find most recent activity
      const activityDates = userTracking
        .map(t => t.clickedAt || t.openedAt || t.deliveredAt || t.sentAt)
        .filter(date => date !== undefined) as Date[];
      
      const mostRecentActivity = activityDates.length > 0 
        ? new Date(Math.max(...activityDates.map(d => d.getTime())))
        : undefined;
      
      return {
        totalSent,
        totalOpened,
        totalClicked,
        openRate,
        clickRate,
        mostRecentActivity
      };
    } catch (error) {
      this.logger.error(`Error generating user stats: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to generate user stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}