/**
 * Unit tests for the NewsletterDetectorImpl
 */

import { NewsletterDetectorImpl } from '../../../core/detection/newsletter-detector-impl.js';
import { DetectionMethodType, UserFeedback } from '../../../core/detection/interfaces.js';

describe('NewsletterDetectorImpl', () => {
  let detector: NewsletterDetectorImpl;
  
  beforeEach(() => {
    detector = new NewsletterDetectorImpl();
  });
  
  test('should detect a clear newsletter email', async () => {
    // Create a mock email with strong newsletter signals
    const newsletterEmail = {
      id: 'test123',
      payload: {
        headers: [
          { name: 'From', value: 'newsletter@example.com' },
          { name: 'Subject', value: 'Weekly Newsletter' },
          { name: 'List-Unsubscribe', value: '<https://example.com/unsubscribe>' }
        ],
        mimeType: 'text/html',
        body: {
          data: Buffer.from(`
            <html>
              <body>
                <table width="600" cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                    <td>
                      <div class="header">Newsletter Title</div>
                      <div class="content">
                        <h1>Main Article</h1>
                        <p>Content here</p>
                        <a href="#" class="button">Read More</a>
                      </div>
                      <div class="footer">
                        <p>You are receiving this because you subscribed.</p>
                        <p><a href="#">Unsubscribe</a> | <a href="#">View in browser</a></p>
                      </div>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `).toString('base64')
        }
      }
    };
    
    const result = await detector.detectNewsletter(newsletterEmail);
    expect(result.isNewsletter).toBe(true);
    expect(result.combinedScore).toBeGreaterThan(0.6);
    expect(result.needsVerification).toBe(false); // Score should be high enough to not need verification
    expect(result.scores.length).toBe(4); // Should have scores from all 4 methods
  });
  
  test('should detect a clear non-newsletter email', async () => {
    // Create a mock email with no newsletter signals
    const regularEmail = {
      id: 'test456',
      payload: {
        headers: [
          { name: 'From', value: 'person@example.com' },
          { name: 'Subject', value: 'Hello!' }
        ],
        mimeType: 'text/plain',
        body: {
          data: Buffer.from('Hello, this is a regular email message.').toString('base64')
        }
      }
    };
    
    const result = await detector.detectNewsletter(regularEmail);
    expect(result.isNewsletter).toBe(false);
    expect(result.combinedScore).toBeLessThan(0.4);
    expect(result.scores.length).toBe(4); // Should have scores from all 4 methods
  });
  
  test('should incorporate user feedback', async () => {
    // Create mock email
    const email = {
      id: 'test789',
      payload: {
        headers: [
          { name: 'From', value: 'sender@example.com' },
          { name: 'Subject', value: 'Test Email' }
        ]
      }
    };
    
    // Create mock user feedback
    const userFeedback: UserFeedback = {
      confirmedNewsletters: new Set(['sender@example.com']),
      rejectedNewsletters: new Set(),
      trustedDomains: new Set(['example.com']),
      blockedDomains: new Set()
    };
    
    const result = await detector.detectNewsletter(email, userFeedback);
    expect(result.isNewsletter).toBe(true);
    expect(result.combinedScore).toBeGreaterThan(0.6);
    expect(result.needsVerification).toBe(false); // Should not need verification with explicit feedback
    
    // Find the user feedback score
    const feedbackScore = result.scores.find(s => s.method === DetectionMethodType.USER_FEEDBACK);
    expect(feedbackScore).toBeDefined();
    expect(feedbackScore?.score).toBeGreaterThan(0.9); // Should be high with confirmed newsletter
    expect(feedbackScore?.confidence).toBeGreaterThan(0.9); // Should have high confidence
  });
  
  test('should calculate confidence score for specific methods', async () => {
    const email = {
      id: 'test101',
      payload: {
        headers: [
          { name: 'From', value: 'newsletter@example.com' },
          { name: 'Subject', value: 'Weekly Newsletter' },
          { name: 'List-Unsubscribe', value: '<https://example.com/unsubscribe>' }
        ]
      }
    };
    
    // Calculate score using only header analysis
    const headerOnlyScore = await detector.getConfidenceScore(email, [DetectionMethodType.HEADER_ANALYSIS]);
    expect(headerOnlyScore).toBeGreaterThan(0);
    
    // Calculate score using all methods
    const allMethodsScore = await detector.getConfidenceScore(email);
    expect(allMethodsScore).toBeGreaterThan(0);
    
    // The scores might be different due to other analysis methods
    expect(headerOnlyScore).not.toBe(allMethodsScore);
  });
  
  test('should determine need for verification', () => {
    const clearNewsletterResult = {
      isNewsletter: true,
      combinedScore: 0.9,
      needsVerification: false,
      scores: [],
      email: { id: 'test1' }
    };
    
    const ambiguousResult = {
      isNewsletter: true,
      combinedScore: 0.55,
      needsVerification: false,
      scores: [],
      email: { id: 'test2' }
    };
    
    const clearNonNewsletterResult = {
      isNewsletter: false,
      combinedScore: 0.1,
      needsVerification: false,
      scores: [],
      email: { id: 'test3' }
    };
    
    expect(detector.needsVerification(clearNewsletterResult)).toBe(false);
    expect(detector.needsVerification(ambiguousResult)).toBe(true);
    expect(detector.needsVerification(clearNonNewsletterResult)).toBe(false);
  });
});