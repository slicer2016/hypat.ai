/**
 * Email Template Renderer Tests
 */

import { Digest, DigestFormat, DigestFrequency } from '../../../core/digest/interfaces.js';
import { EmailTemplateRendererImpl } from '../../../core/digest/email-template-renderer.js';
import { v4 as uuidv4 } from 'uuid';

// For test simplicity, we'll mock external dependencies directly in the test
jest.mock('fs', () => ({
  promises: {
    access: jest.fn().mockResolvedValue(undefined),
    mkdir: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue([]),
    readFile: jest.fn().mockResolvedValue(''),
    writeFile: jest.fn().mockResolvedValue(undefined)
  }
}));

jest.mock('mjml', () => jest.fn().mockReturnValue({
  html: '<html><body>Rendered HTML</body></html>',
  errors: []
}));

// Mock path.join for consistent path handling
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/'))
}));

describe('EmailTemplateRenderer', () => {
  let renderer: EmailTemplateRendererImpl;
  const templatesDir = '/test/templates';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure fs.readdir returns empty array by default
    jest.requireMock('fs').promises.readdir.mockResolvedValue([]);
    renderer = new EmailTemplateRendererImpl(templatesDir);
  });
  
  test('creates default templates if none exist', async () => {
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const mockMkdir = jest.requireMock('fs').promises.mkdir;
    const mockWriteFile = jest.requireMock('fs').promises.writeFile;
    
    expect(mockMkdir).toHaveBeenCalledWith(templatesDir, { recursive: true });
    expect(mockWriteFile).toHaveBeenCalledTimes(4); // Four default templates
  });
  
  test('loads existing templates from filesystem', async () => {
    // Mock readdir to return template files
    jest.requireMock('fs').promises.readdir.mockResolvedValue([
      'daily-standard.mjml', 
      'weekly-standard.mjml'
    ]);
    
    // Mock readFile to return template content
    jest.requireMock('fs').promises.readFile.mockResolvedValue('Template content');
    
    // Create new renderer to trigger template loading
    renderer = new EmailTemplateRendererImpl(templatesDir);
    
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const templates = await renderer.getTemplates();
    expect(templates.length).toBe(2);
    expect(templates[0].id).toBe('daily-standard');
    expect(templates[1].id).toBe('weekly-standard');
  });
  
  test('renders digest to HTML using template', async () => {
    // Add a template to the renderer
    await (renderer as any).saveTemplate('test-template', 'Test template content');
    
    // Create sample digest
    const digest: Digest = {
      id: uuidv4(),
      userId: 'user-1',
      title: 'Test Digest',
      description: 'Test Description',
      frequency: DigestFrequency.DAILY,
      format: DigestFormat.STANDARD,
      sections: [
        {
          id: 'section-1',
          title: 'Test Section',
          type: 'category',
          items: [
            {
              id: 'item-1',
              newsletterId: 'newsletter-1',
              newsletterName: 'Test Newsletter',
              title: 'Test Item',
              summary: 'Test Summary',
              content: 'Test Content',
              topics: [],
              importance: 0.5,
              publishedAt: new Date(),
              createdAt: new Date()
            }
          ]
        }
      ],
      startDate: new Date(),
      endDate: new Date(),
      generatedAt: new Date()
    };
    
    const html = await renderer.renderDigest(digest, 'test-template');
    expect(html).toBe('<html><body>Rendered HTML</body></html>');
  });
  
  test('throws error when template not found', async () => {
    // Create sample digest
    const digest: Digest = {
      id: uuidv4(),
      userId: 'user-1',
      title: 'Test Digest',
      description: 'Test Description',
      frequency: DigestFrequency.DAILY,
      format: DigestFormat.STANDARD,
      sections: [],
      startDate: new Date(),
      endDate: new Date(),
      generatedAt: new Date()
    };
    
    await expect(renderer.renderDigest(digest, 'non-existent-template')).rejects.toThrow('Template not found');
  });
  
  test('renders custom template with provided data', async () => {
    // Add a template to the renderer
    await (renderer as any).saveTemplate('custom-template', 'Hello {{name}}!');
    
    const html = await renderer.renderTemplate('custom-template', { name: 'World' });
    expect(html).toBe('<html><body>Rendered HTML</body></html>');
  });
});