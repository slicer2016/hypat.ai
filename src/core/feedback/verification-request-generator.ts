/**
 * Verification Request Generator Implementation
 * Generates and manages verification requests for uncertain newsletter detections
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  FeedbackRepository, 
  VerificationRequest, 
  VerificationRequestGenerator, 
  VerificationStatus 
} from './interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the VerificationRequestGenerator interface
 */
export class VerificationRequestGeneratorImpl implements VerificationRequestGenerator {
  private logger: Logger;
  private repository: FeedbackRepository;
  
  // Configuration options
  private verificationExpiryDays: number = 7; // Verification requests expire after 7 days
  private maxResendCount: number = 3; // Maximum number of times to resend a request
  private baseUrl: string = 'https://hypat.ai/verify'; // Base URL for verification links
  
  constructor(repository: FeedbackRepository, config?: {
    verificationExpiryDays?: number;
    maxResendCount?: number;
    baseUrl?: string;
  }) {
    this.logger = new Logger('VerificationRequestGenerator');
    this.repository = repository;
    
    // Apply configuration options if provided
    if (config) {
      if (config.verificationExpiryDays) this.verificationExpiryDays = config.verificationExpiryDays;
      if (config.maxResendCount) this.maxResendCount = config.maxResendCount;
      if (config.baseUrl) this.baseUrl = config.baseUrl;
    }
  }

  /**
   * Generate a verification request for an uncertain detection
   * @param userId The ID of the user
   * @param emailId The ID of the email
   * @param confidence The confidence score of the detection
   */
  async generateVerificationRequest(
    userId: string, 
    emailId: string, 
    confidence: number
  ): Promise<VerificationRequest> {
    try {
      this.logger.info(`Generating verification request for user ${userId}, email ${emailId}`);
      
      // Get email details (in a real implementation, this would fetch from the email repository)
      const emailDetails = await this.getEmailDetails(emailId);
      
      // Check if there's already a pending verification request for this email
      const pendingRequests = await this.repository.getPendingVerificationRequests(userId);
      const existingRequest = pendingRequests.find(req => req.emailId === emailId);
      
      if (existingRequest) {
        this.logger.info(`Verification request already exists for email ${emailId}`);
        return existingRequest;
      }
      
      // Generate a unique token for the verification links
      const token = uuidv4();
      
      // Calculate expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.verificationExpiryDays);
      
      // Create the verification request
      const request: VerificationRequest = {
        id: uuidv4(),
        userId,
        emailId,
        messageId: emailDetails.messageId,
        sender: emailDetails.sender,
        senderDomain: this.extractDomain(emailDetails.sender),
        subject: emailDetails.subject,
        confidence,
        status: VerificationStatus.PENDING,
        generatedAt: new Date(),
        expiresAt,
        requestSentCount: 0,
        token
      };
      
      // Save the verification request
      const savedRequest = await this.repository.saveVerificationRequest(request);
      
      this.logger.info(`Generated verification request ${request.id} for email ${emailId}`);
      return savedRequest;
    } catch (error) {
      this.logger.error(`Error generating verification request: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to generate verification request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format a verification request for email delivery
   * @param verificationRequest The verification request
   */
  async formatVerificationEmail(verificationRequest: VerificationRequest): Promise<{
    subject: string;
    body: string;
    html: string;
  }> {
    try {
      this.logger.info(`Formatting verification email for request ${verificationRequest.id}`);
      
      // Generate verification links
      const confirmLink = `${this.baseUrl}?token=${verificationRequest.token}&action=confirm`;
      const rejectLink = `${this.baseUrl}?token=${verificationRequest.token}&action=reject`;
      const ignoreLink = `${this.baseUrl}?token=${verificationRequest.token}&action=ignore`;
      
      // Create the subject line
      const subject = `Is this a newsletter? ${verificationRequest.subject || ''}`;
      
      // Create the plain text body
      const body = `
Hello,

We need your help to improve our newsletter detection. 
We're not sure if the email "${verificationRequest.subject || ''}" from ${verificationRequest.sender} is a newsletter.

Please help us by clicking one of the links below:

Yes, this is a newsletter: ${confirmLink}
No, this is not a newsletter: ${rejectLink}
Ignore this email: ${ignoreLink}

This verification request will expire on ${verificationRequest.expiresAt.toLocaleDateString()}.

Thank you for your help!
Hypat.ai
      `.trim();
      
      // Create the HTML body
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Newsletter Verification</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #1976d2; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .email-details { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .verification-buttons { text-align: center; margin: 30px 0; }
    .button { display: inline-block; padding: 10px 20px; margin: 0 10px; border-radius: 5px; text-decoration: none; color: white; font-weight: bold; }
    .confirm { background-color: #4caf50; }
    .reject { background-color: #f44336; }
    .ignore { background-color: #9e9e9e; }
    .footer { font-size: 12px; color: #666; margin-top: 30px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Newsletter Verification</h1>
  </div>
  <div class="content">
    <p>Hello,</p>
    <p>We need your help to improve our newsletter detection. We're not sure if the following email is a newsletter:</p>
    
    <div class="email-details">
      <p><strong>Subject:</strong> ${verificationRequest.subject || '(No subject)'}</p>
      <p><strong>From:</strong> ${verificationRequest.sender}</p>
      <p><strong>Received:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
    
    <p>Please help us by clicking one of the buttons below:</p>
    
    <div class="verification-buttons">
      <a href="${confirmLink}" class="button confirm">Yes, this is a newsletter</a>
      <a href="${rejectLink}" class="button reject">No, this is not a newsletter</a>
      <a href="${ignoreLink}" class="button ignore">Ignore this email</a>
    </div>
    
    <p>This verification request will expire on ${verificationRequest.expiresAt.toLocaleDateString()}.</p>
    
    <div class="footer">
      <p>Thank you for your help!</p>
      <p>Hypat.ai</p>
    </div>
  </div>
</body>
</html>
      `.trim();
      
      this.logger.info(`Formatted verification email for request ${verificationRequest.id}`);
      return { subject, body, html };
    } catch (error) {
      this.logger.error(`Error formatting verification email: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to format verification email: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process expired verification requests
   */
  async processExpiredRequests(): Promise<number> {
    try {
      this.logger.info('Processing expired verification requests');
      
      // Get all expired verification requests
      const expiredRequests = await this.repository.getExpiredVerificationRequests();
      
      let processedCount = 0;
      
      // Update each expired request
      for (const request of expiredRequests) {
        // Only update if the request is still pending
        if (request.status === VerificationStatus.PENDING) {
          await this.repository.updateVerificationRequestStatus(
            request.id, 
            VerificationStatus.EXPIRED
          );
          
          processedCount++;
        }
      }
      
      this.logger.info(`Processed ${processedCount} expired verification requests`);
      return processedCount;
    } catch (error) {
      this.logger.error(`Error processing expired requests: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to process expired requests: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Resend a verification request
   * @param requestId The ID of the verification request
   */
  async resendVerificationRequest(requestId: string): Promise<VerificationRequest> {
    try {
      this.logger.info(`Resending verification request ${requestId}`);
      
      // Get the verification request
      const request = await this.repository.getVerificationRequest(requestId);
      if (!request) {
        throw new Error(`Verification request not found: ${requestId}`);
      }
      
      // Check if the request is still pending
      if (request.status !== VerificationStatus.PENDING) {
        this.logger.warn(`Cannot resend verification request ${requestId} with status ${request.status}`);
        throw new Error(`Cannot resend verification request with status: ${request.status}`);
      }
      
      // Check if we've reached the maximum number of resends
      if (request.requestSentCount >= this.maxResendCount) {
        this.logger.warn(`Maximum resend count reached for verification request ${requestId}`);
        throw new Error(`Maximum resend count reached for verification request`);
      }
      
      // Update the request sent count
      request.requestSentCount++;
      
      // Reset the expiration date
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + this.verificationExpiryDays);
      request.expiresAt = newExpiresAt;
      
      // Save the updated request
      const savedRequest = await this.repository.saveVerificationRequest(request);
      
      this.logger.info(`Resent verification request ${requestId} (sent count: ${request.requestSentCount})`);
      return savedRequest;
    } catch (error) {
      this.logger.error(`Error resending verification request: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to resend verification request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract domain from an email address
   * @param email The email address
   */
  private extractDomain(email: string): string {
    const match = email.match(/@([^@]+)$/);
    return match ? match[1].toLowerCase() : '';
  }

  /**
   * Get email details (in a real implementation, this would fetch from the email repository)
   * @param emailId The ID of the email
   */
  private async getEmailDetails(emailId: string): Promise<{
    messageId: string;
    sender: string;
    subject: string;
  }> {
    // This is a mock implementation that would normally fetch from a database
    return {
      messageId: `<${uuidv4()}@example.com>`,
      sender: `sender-${Math.floor(Math.random() * 10)}@example.com`,
      subject: `Test Email ${emailId}`
    };
  }
}