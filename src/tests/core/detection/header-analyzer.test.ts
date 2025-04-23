/**
 * Unit tests for the HeaderAnalyzer
 */

import { HeaderAnalyzer } from '../../../core/detection/analyzers/header-analyzer.js';
import { DetectionMethodType } from '../../../core/detection/interfaces.js';

describe('HeaderAnalyzer', () => {
  let analyzer: HeaderAnalyzer;
  
  beforeEach(() => {
    analyzer = new HeaderAnalyzer();
  });
  
  test('should return correct method type', () => {
    expect(analyzer.type).toBe(DetectionMethodType.HEADER_ANALYSIS);
  });
  
  test('should return correct weight', () => {
    expect(analyzer.getWeight()).toBe(0.4);
  });
  
  test('should detect List-Unsubscribe header', () => {
    const headers = {
      'list-unsubscribe': '<https://example.com/unsubscribe>',
      'from': 'sender@example.com',
      'subject': 'Test Newsletter'
    };
    
    const score = analyzer.checkListUnsubscribe(headers);
    expect(score).toBe(1.0);
  });
  
  test('should handle missing List-Unsubscribe header', () => {
    const headers = {
      'from': 'sender@example.com',
      'subject': 'Test Email'
    };
    
    const score = analyzer.checkListUnsubscribe(headers);
    expect(score).toBe(0.0);
  });
  
  test('should detect newsletter-specific headers', () => {
    const headers = {
      'x-mailchimp-id': '123456',
      'from': 'sender@example.com',
      'subject': 'Test Newsletter'
    };
    
    const score = analyzer.checkNewsletterHeaders(headers);
    expect(score).toBeGreaterThan(0);
  });
  
  test('should recognize newsletter sender patterns', () => {
    let score = analyzer.analyzeSenderPattern('newsletter@example.com');
    expect(score).toBeGreaterThan(0);
    
    score = analyzer.analyzeSenderPattern('Weekly Newsletter <news@example.com>');
    expect(score).toBeGreaterThan(0);
    
    score = analyzer.analyzeSenderPattern('regular@example.com');
    expect(score).toBe(0);
  });
  
  test('should analyze email with newsletter indicators', async () => {
    const email = {
      id: 'test123',
      payload: {
        headers: [
          { name: 'From', value: 'newsletter@example.com' },
          { name: 'Subject', value: 'Weekly Newsletter' },
          { name: 'List-Unsubscribe', value: '<https://example.com/unsubscribe>' }
        ]
      }
    };
    
    const result = await analyzer.analyze(email);
    expect(result.score).toBeGreaterThan(0.5);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.method).toBe(DetectionMethodType.HEADER_ANALYSIS);
  });
  
  test('should analyze email without newsletter indicators', async () => {
    const email = {
      id: 'test456',
      payload: {
        headers: [
          { name: 'From', value: 'person@example.com' },
          { name: 'Subject', value: 'Hello!' }
        ]
      }
    };
    
    const result = await analyzer.analyze(email);
    expect(result.score).toBeLessThan(0.5);
    expect(result.method).toBe(DetectionMethodType.HEADER_ANALYSIS);
  });
});