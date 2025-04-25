/**
 * Feedback Flow Integration Test
 * 
 * Tests the newsletter feedback system:
 * - Generating verification requests
 * - Processing user feedback
 * - Improving detection based on feedback
 */

import { TestFixture } from './test-fixture.js';
import { createFeedbackService } from '../../core/feedback/index.js';
import { createNewsletterDetector } from '../../core/detection/index.js';
import { VerifyNewslettersTool } from '../../tools/verify-newsletters-tool.js';
import { UpdateNewsletterFeedbackTool } from '../../tools/update-newsletter-feedback-tool.js';

describe('Feedback Flow Integration Tests', () => {
  // Test fixture
  let fixture: TestFixture;
  let primaryUserId: string;
  let newsletterIds: string[] = [];
  
  // Hook to set up test fixture before all tests
  beforeAll(async () => {
    fixture = new TestFixture();
    await fixture.setup();
    
    // Get primary user ID
    primaryUserId = fixture.testUsers.get('primary').id;
    
    // Create test newsletters with varying confidence levels
    await createTestNewsletters();
  });
  
  // Hook to tear down test fixture after all tests
  afterAll(async () => {
    await fixture.teardown();
  });
  
  /**
   * Helper to create test newsletters with different confidence levels
   */
  async function createTestNewsletters() {
    const newsletterRepository = fixture.repositoryFactory.getSpecializedRepository('NewsletterRepository');
    
    // High confidence newsletter (likely newsletter)
    const highConfidenceNewsletter = await newsletterRepository.create({
      id: 'high-confidence-newsletter', // Use fixed IDs for predictability in tests
      emailId: 'high-confidence-newsletter',
      subject: 'Weekly Technology Newsletter',
      sender: 'tech-updates@example.com',
      receivedDate: new Date(),
      detectionConfidence: 0.95,
      isVerified: false, // Not yet verified
      processedContentJson: JSON.stringify({
        content: '<h1>Tech Weekly</h1><p>This week\'s technology news</p>',
        summary: 'Weekly summary of technology news and updates.',
        topics: ['technology', 'software', 'AI']
      })
    });
    
    newsletterIds.push(highConfidenceNewsletter.id);
    
    // Medium confidence newsletter (somewhat uncertain)
    const mediumConfidenceNewsletter = await newsletterRepository.create({
      id: 'medium-confidence-newsletter', // Use fixed IDs for predictability in tests
      emailId: 'medium-confidence-newsletter',
      subject: 'Updates on Your Account',
      sender: 'updates@service.com',
      receivedDate: new Date(),
      detectionConfidence: 0.65,
      isVerified: false, // Not yet verified
      processedContentJson: JSON.stringify({
        content: '<h1>Account Updates</h1><p>Recent changes to your account</p>',
        summary: 'Information about recent account changes and updates.',
        topics: ['account', 'updates', 'service']
      })
    });
    
    newsletterIds.push(mediumConfidenceNewsletter.id);
    
    // Low confidence newsletter (probably not a newsletter)
    const lowConfidenceNewsletter = await newsletterRepository.create({
      id: 'low-confidence-newsletter', // Use fixed IDs for predictability in tests
      emailId: 'low-confidence-newsletter',
      subject: 'Re: Meeting tomorrow',
      sender: 'colleague@example.com',
      receivedDate: new Date(),
      detectionConfidence: 0.3,
      isVerified: false, // Not yet verified
      processedContentJson: JSON.stringify({
        content: '<p>Hi, Let\'s discuss the project tomorrow at 2pm.</p>',
        summary: 'Email about scheduling a meeting to discuss a project.',
        topics: ['meeting', 'project', 'scheduling']
      })
    });
    
    newsletterIds.push(lowConfidenceNewsletter.id);
    
    console.log('Created test newsletters with IDs:', newsletterIds);
  }
  
  // Test verification request generation
  describe('Verification Request Generation', () => {
    it('should identify newsletters needing verification', async () => {
      // Get feedback service
      const feedbackService = createFeedbackService();
      
      // Get verification generator from feedback service
      const verificationGenerator = feedbackService.getVerificationRequestGenerator();
      
      // Generate verification requests
      const verificationRequests = await verificationGenerator.generateVerificationRequests({
        confidenceThreshold: 0.7, // Items below this need verification
        limit: 10
      });
      
      // Verify results
      expect(verificationRequests).toBeDefined();
      expect(verificationRequests.length).toBeGreaterThan(0);
      
      // Should include at least the medium and low confidence newsletters
      const requestIds = verificationRequests.map(r => r.id);
      
      // The medium confidence newsletter should be included
      expect(requestIds).toContain('medium-confidence-newsletter');
      
      // The low confidence newsletter should also be included
      expect(requestIds).toContain('low-confidence-newsletter');
      
      // Each request should have verification actions
      for (const request of verificationRequests) {
        expect(request).toHaveProperty('actions');
        expect(request.actions.length).toBeGreaterThan(0);
        
        // Should have standard verification actions
        const actionTypes = request.actions.map(a => a.type);
        expect(actionTypes).toContain('confirm');
        expect(actionTypes).toContain('reject');
      }
    });
    
    it('should use the VerifyNewslettersTool correctly', async () => {
      // Use the tool to get newsletters needing verification
      const result = await VerifyNewslettersTool.handler({
        confidenceThreshold: 0.7,
        limit: 10,
        includeSummary: true
      });
      
      // Verify tool output
      expect(result).toHaveProperty('content');
      expect(result.content.length).toBeGreaterThan(0);
      
      // Should have JSON output with newsletters to verify
      const jsonOutput = result.content.find(c => c.type === 'json');
      expect(jsonOutput).toBeDefined();
      expect(jsonOutput?.json).toHaveProperty('newsletters');
      expect(jsonOutput?.json.newsletters.length).toBeGreaterThan(0);
      
      // Should include verification actions
      expect(jsonOutput?.json).toHaveProperty('verificationActions');
      expect(jsonOutput?.json.verificationActions.length).toBeGreaterThan(0);
      
      // The medium and low confidence newsletters should be included
      const newslettersToVerify = jsonOutput?.json.newsletters;
      const includedIds = newslettersToVerify.map((n: any) => n.id);
      
      expect(includedIds).toContain(newsletterIds[1]); // Medium confidence
      expect(includedIds).toContain(newsletterIds[2]); // Low confidence
    });
  });
  
  // Test feedback processing
  describe('Feedback Processing', () => {
    it('should process user feedback on newsletters', async () => {
      // Get feedback service
      const feedbackService = createFeedbackService();
      
      // Submit feedback for high confidence newsletter (confirm)
      await feedbackService.submitFeedback({
        userId: primaryUserId,
        newsletterId: newsletterIds[0],
        feedbackType: 'confirm',
        comment: 'This is definitely a newsletter'
      });
      
      // Submit feedback for medium confidence newsletter (confirm)
      await feedbackService.submitFeedback({
        userId: primaryUserId,
        newsletterId: newsletterIds[1],
        feedbackType: 'confirm',
        comment: 'This looks like a newsletter to me'
      });
      
      // Submit feedback for low confidence newsletter (reject)
      await feedbackService.submitFeedback({
        userId: primaryUserId,
        newsletterId: newsletterIds[2],
        feedbackType: 'reject',
        comment: 'This is just a regular email, not a newsletter'
      });
      
      // Verify feedback was recorded in the database
      const feedbackRepository = fixture.repositoryFactory.getSpecializedRepository('FeedbackRepository');
      
      const allFeedback = await feedbackRepository.find({
        where: { userId: primaryUserId }
      });
      
      // Should have recorded three feedback items
      expect(allFeedback.length).toBe(3);
      
      // Newsletters should be marked as verified
      const newsletterRepository = fixture.repositoryFactory.getSpecializedRepository('NewsletterRepository');
      
      for (const id of newsletterIds) {
        const newsletter = await newsletterRepository.findById(id);
        expect(newsletter?.isVerified).toBe(true);
      }
    });
    
    it('should use the UpdateNewsletterFeedbackTool correctly', async () => {
      // Create a new unverified newsletter
      const newsletterRepository = fixture.repositoryFactory.getSpecializedRepository('NewsletterRepository');
      
      const newNewsletter = await newsletterRepository.create({
        emailId: 'new-unverified-newsletter',
        subject: 'Science Weekly Digest',
        sender: 'science-digest@example.com',
        receivedDate: new Date(),
        detectionConfidence: 0.75,
        isVerified: false,
        processedContentJson: JSON.stringify({
          content: '<h1>Science Weekly</h1><p>This week\'s science news</p>',
          summary: 'Weekly summary of science news and discoveries.',
          topics: ['science', 'research', 'discoveries']
        })
      });
      
      // Use the tool to submit feedback
      const result = await UpdateNewsletterFeedbackTool.handler({
        userId: primaryUserId,
        actions: [
          {
            newsletterId: newNewsletter.id,
            action: 'confirm',
            comment: 'This is a science newsletter'
          }
        ]
      });
      
      // Verify tool output
      expect(result).toHaveProperty('content');
      expect(result.content[0].text).toContain('Processed');
      expect(result.content[0].text).toContain('feedback actions');
      
      // Verify the newsletter was updated
      const updatedNewsletter = await newsletterRepository.findById(newNewsletter.id);
      expect(updatedNewsletter?.isVerified).toBe(true);
      
      // Verify feedback was recorded
      const feedbackRepository = fixture.repositoryFactory.getSpecializedRepository('FeedbackRepository');
      
      const feedback = await feedbackRepository.find({
        where: {
          userId: primaryUserId,
          newsletterId: newNewsletter.id
        }
      });
      
      expect(feedback.length).toBe(1);
      expect(feedback[0].feedbackType).toBe('confirm');
      expect(feedback[0].comment).toBe('This is a science newsletter');
    });
  });
  
  // Test detection improvement based on feedback
  describe('Detection Improvement', () => {
    it('should improve detection based on user feedback', async () => {
      // Get feedback service
      const feedbackService = createFeedbackService();
      
      // Get the feedback analyzer
      const feedbackAnalyzer = feedbackService.getFeedbackAnalyzer();
      
      // Analyze feedback
      const analysis = await feedbackAnalyzer.analyzeFeedback();
      
      // Verify analysis
      expect(analysis).toHaveProperty('patterns');
      expect(analysis).toHaveProperty('senderTrustScores');
      expect(analysis).toHaveProperty('recommendations');
      
      // Should have found patterns in confirmed newsletters
      expect(analysis.patterns.confirmed.length).toBeGreaterThan(0);
      
      // Get the detection improver
      const detectionImprover = feedbackService.getDetectionImprover();
      
      // Apply improvements
      await detectionImprover.applyImprovements(analysis);
      
      // Create a test email similar to confirmed newsletters
      const testEmail = {
        id: 'test-email-after-feedback',
        threadId: 'thread-test',
        labelIds: ['INBOX'],
        payload: {
          headers: [
            { name: 'From', value: 'tech-updates@example.com' },
            { name: 'Subject', value: 'Another Tech Newsletter' },
            { name: 'Date', value: new Date().toISOString() }
          ],
          body: {
            data: Buffer.from('<h1>Tech Updates</h1><p>More technology news</p>').toString('base64')
          }
        }
      };
      
      // Get newsletter detector with improvements applied
      const detector = createNewsletterDetector();
      
      // Detect newsletter with improvements
      const result = await detector.detectNewsletter(testEmail);
      
      // Verification:
      // Since we confirmed previous tech newsletters from this sender,
      // this similar email should have a high confidence score
      expect(result.isNewsletter).toBe(true);
      expect(result.combinedScore).toBeGreaterThan(0.8);
      
      // Should have a score component influenced by feedback
      const feedbackScore = result.scores.find(s => s.method.includes('feedback'));
      expect(feedbackScore).toBeDefined();
      expect(feedbackScore?.score).toBeGreaterThan(0.8);
    });
  });
});