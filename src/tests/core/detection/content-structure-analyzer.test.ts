/**
 * Unit tests for the ContentStructureAnalyzer
 */

import { ContentStructureAnalyzer } from '../../../core/detection/analyzers/content-structure-analyzer.js';
import { DetectionMethodType } from '../../../core/detection/interfaces.js';

describe('ContentStructureAnalyzer', () => {
  let analyzer: ContentStructureAnalyzer;
  
  beforeEach(() => {
    analyzer = new ContentStructureAnalyzer();
  });
  
  test('should return correct method type', () => {
    expect(analyzer.type).toBe(DetectionMethodType.CONTENT_STRUCTURE);
  });
  
  test('should return correct weight', () => {
    expect(analyzer.getWeight()).toBe(0.3);
  });
  
  test('should identify newsletter layout', () => {
    const htmlContent = `
      <html>
        <body>
          <table width="600" cellpadding="0" cellspacing="0" border="0" align="center">
            <tr>
              <td>
                <div class="header">Newsletter Title</div>
                <div class="content">Newsletter content here</div>
                <div class="footer">
                  <p>Unsubscribe | View in browser</p>
                </div>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
    
    const score = analyzer.identifyNewsletterLayout(htmlContent);
    expect(score).toBeGreaterThan(0.5);
  });
  
  test('should detect structural elements', () => {
    const htmlContent = `
      <html>
        <body>
          <div class="header">
            <img src="logo.png" alt="Company Logo" />
          </div>
          <div class="content">
            <h1>Newsletter Title</h1>
            <p>Content here</p>
            <a href="https://example.com" class="button">Read More</a>
          </div>
          <div class="footer">
            <p>You are receiving this because you subscribed.</p>
            <p><a href="https://example.com/unsubscribe">Unsubscribe</a></p>
          </div>
        </body>
      </html>
    `;
    
    const score = analyzer.detectStructuralElements(htmlContent);
    expect(score).toBeGreaterThan(0.5);
  });
  
  test('should recognize templated sections', () => {
    const htmlContent = `
      <html>
        <body>
          <div class="article">
            <h2>Article 1</h2>
            <p>Content here</p>
            <a href="#">Read More</a>
          </div>
          <div class="article">
            <h2>Article 2</h2>
            <p>Content here</p>
            <a href="#">Read More</a>
          </div>
          <div class="article">
            <h2>Article 3</h2>
            <p>Content here</p>
            <a href="#">Read More</a>
          </div>
        </body>
      </html>
    `;
    
    const score = analyzer.recognizeTemplatedSections(htmlContent);
    expect(score).toBeGreaterThan(0.5);
  });
  
  test('should analyze email with newsletter structure', async () => {
    const email = {
      id: 'test123',
      payload: {
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
    
    const result = await analyzer.analyze(email);
    expect(result.score).toBeGreaterThan(0.5);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.method).toBe(DetectionMethodType.CONTENT_STRUCTURE);
  });
  
  test('should analyze email without newsletter structure', async () => {
    const email = {
      id: 'test456',
      payload: {
        mimeType: 'text/html',
        body: {
          data: Buffer.from(`
            <html>
              <body>
                <p>Hello,</p>
                <p>This is a regular email with no newsletter structure.</p>
                <p>Regards,<br>Sender</p>
              </body>
            </html>
          `).toString('base64')
        }
      }
    };
    
    const result = await analyzer.analyze(email);
    expect(result.score).toBeLessThan(0.5);
    expect(result.method).toBe(DetectionMethodType.CONTENT_STRUCTURE);
  });
});