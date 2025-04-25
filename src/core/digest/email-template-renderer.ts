/**
 * Email Template Renderer Implementation
 * Renders digest content into email templates using simple string templates
 * Simplified version for initial implementation
 */

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  Digest, 
  DigestTemplate, 
  EmailTemplateRenderer,
  DigestFrequency,
  DigestFormat
} from './interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the EmailTemplateRenderer interface
 */
export class EmailTemplateRendererImpl implements EmailTemplateRenderer {
  private logger: Logger;
  private templatesDir: string;
  
  // In-memory predefined templates (simplified approach)
  private predefinedTemplates: Map<string, DigestTemplate>;

  constructor(templatesDir?: string) {
    this.logger = new Logger('EmailTemplateRenderer');
    this.templatesDir = templatesDir || path.join(process.cwd(), 'src/core/digest/templates');
    
    // Initialize with predefined templates immediately
    // This avoids async loading issues in tests
    this.predefinedTemplates = new Map<string, DigestTemplate>();
    this.initializePredefinedTemplates();
  }
  
  /**
   * Initialize predefined templates synchronously
   */
  private initializePredefinedTemplates(): void {
    try {
      // Create standard daily template
      this.predefinedTemplates.set('daily-standard', {
        id: 'daily-standard',
        name: 'Daily Standard',
        description: 'Standard daily digest template',
        frequency: DigestFrequency.DAILY,
        format: DigestFormat.STANDARD,
        template: this.createDailyStandardTemplate(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create weekly standard template
      this.predefinedTemplates.set('weekly-standard', {
        id: 'weekly-standard',
        name: 'Weekly Standard',
        description: 'Standard weekly digest template',
        frequency: DigestFrequency.WEEKLY,
        format: DigestFormat.STANDARD,
        template: this.createWeeklyStandardTemplate(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create verification template
      this.predefinedTemplates.set('verification', {
        id: 'verification',
        name: 'Verification',
        description: 'Newsletter verification email template',
        frequency: 'once' as any, // Special case for verification emails
        format: DigestFormat.STANDARD,
        template: this.createVerificationTemplate(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      this.logger.info(`Initialized template cache with ${this.predefinedTemplates.size} templates`);
    } catch (error) {
      this.logger.error(`Error initializing templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create verification template for newsletters that need user verification
   */
  private createVerificationTemplate(): string {
    return `
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #1976d2; padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; }
    .footer { background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; }
    .button { display: inline-block; background-color: #1976d2; color: white; padding: 10px 20px; 
              text-decoration: none; border-radius: 4px; margin: 10px 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Newsletter Verification</h1>
    </div>
    <div class="content">
      <p>We need your help confirming if an email is a newsletter:</p>
      <h2>{{subject}}</h2>
      <p>From: {{sender}}</p>
      <p>{{description}}</p>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="{{confirmUrl}}" class="button">Yes, it's a newsletter</a>
        <a href="{{rejectUrl}}" class="button">No, it's not a newsletter</a>
      </div>
    </div>
    <div class="footer">
      <p>Hypat.ai - Smart Newsletter Management</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Render a digest to HTML using a template
   * @param digest The digest to render
   * @param templateId The ID of the template to use
   */
  async renderDigest(digest: Digest, templateId: string): Promise<string> {
    try {
      this.logger.info(`Rendering digest ${digest.id} with template ${templateId}`);

      // Get the template
      const template = this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Prepare the data for rendering
      const templateData = this.prepareDigestTemplateData(digest);

      // Render the template with the data
      return this.renderTemplate(templateId, templateData);
    } catch (error) {
      this.logger.error(`Error rendering digest: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to render digest: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Render a custom template with data
   * @param templateId The ID of the template to use
   * @param data The data to render the template with
   */
  async renderTemplate(templateId: string, data: Record<string, any>): Promise<string> {
    try {
      this.logger.info(`Rendering template ${templateId}`);

      // Get the template
      const template = this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Replace placeholders in the template
      let htmlTemplate = template.template;
      
      // Replace simple placeholders
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
          htmlTemplate = htmlTemplate.replace(placeholder, String(value));
        }
      }

      // Special handling for sections
      if (data.sections && Array.isArray(data.sections)) {
        // Replace the sections placeholder with the rendered sections
        const sectionsPlaceholder = /{{sections}}/g;
        const renderedSections = this.renderSections(data.sections);
        htmlTemplate = htmlTemplate.replace(sectionsPlaceholder, renderedSections);
      }

      return htmlTemplate;
    } catch (error) {
      this.logger.error(`Error rendering template ${templateId}: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to render template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all available templates
   */
  async getTemplates(): Promise<DigestTemplate[]> {
    try {
      return Array.from(this.predefinedTemplates.values());
    } catch (error) {
      this.logger.error(`Error getting templates: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to get templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a template by ID
   * @param templateId The ID of the template to get
   */
  async getTemplate(templateId: string): Promise<DigestTemplate | null> {
    try {
      return this.predefinedTemplates.get(templateId) || null;
    } catch (error) {
      this.logger.error(`Error getting template ${templateId}: ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Failed to get template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Prepare template data from a digest
   * @param digest The digest to prepare data from
   */
  private prepareDigestTemplateData(digest: Digest): Record<string, any> {
    return {
      title: digest.title,
      description: digest.description,
      startDate: this.formatDate(digest.startDate),
      endDate: this.formatDate(digest.endDate),
      generatedAt: this.formatDate(digest.generatedAt),
      sections: digest.sections,
      frequency: digest.frequency,
      format: digest.format,
      userId: digest.userId,
      trackingId: digest.id // Use digest ID as tracking ID
    };
  }

  /**
   * Render digest sections to HTML
   * @param sections The sections to render
   */
  private renderSections(sections: any[]): string {
    try {
      let sectionsHtml = '';

      for (const section of sections) {
        sectionsHtml += `
          <div style="margin-bottom: 20px;">
            <h2 style="margin-bottom: 10px;">${section.title}</h2>
            ${section.description ? `<p style="margin-bottom: 10px; color: #666;">${section.description}</p>` : ''}
          </div>
        `;

        // Render items in this section
        if (section.items && section.items.length > 0) {
          for (const item of section.items) {
            sectionsHtml += `
              <div style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                <h3 style="margin-bottom: 5px;">${item.title}</h3>
                <p style="margin-bottom: 5px; font-size: 12px; color: #999;">
                  From ${item.newsletterName || 'Newsletter'} · ${this.formatDate(new Date(item.publishedAt || new Date()))}
                </p>
                <p>${item.summary || ''}</p>
                ${item.originalUrl ? `<a href="${item.originalUrl}" style="display: inline-block; background-color: #1976d2; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">Read More</a>` : ''}
                ${item.imageUrl ? `<div style="text-align: center; margin-top: 10px;"><img src="${item.imageUrl}" alt="${item.title}" style="max-width: 100%; height: auto;" /></div>` : ''}
              </div>
            `;
          }
        } else {
          sectionsHtml += `
            <div style="padding: 10px 0;">
              <p>No items in this section.</p>
            </div>
          `;
        }
      }

      return sectionsHtml;
    } catch (error) {
      this.logger.error(`Error rendering sections: ${error instanceof Error ? error.message : String(error)}`);
      return '<p>Error rendering sections</p>';
    }
  }

  /**
   * Format a date for display
   * @param date The date to format
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Format a template ID as a display name
   * @param templateId The template ID
   */
  private formatTemplateName(templateId: string): string {
    return templateId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Extract frequency from template ID
   * @param templateId The template ID
   */
  private getFrequencyFromTemplateId(templateId: string): DigestFrequency {
    if (templateId.includes('daily')) {
      return DigestFrequency.DAILY;
    } else if (templateId.includes('weekly')) {
      return DigestFrequency.WEEKLY;
    } else if (templateId.includes('bi-weekly')) {
      return DigestFrequency.BI_WEEKLY;
    } else if (templateId.includes('monthly')) {
      return DigestFrequency.MONTHLY;
    }
    return DigestFrequency.DAILY; // Default
  }

  /**
   * Extract format from template ID
   * @param templateId The template ID
   */
  private getFormatFromTemplateId(templateId: string): DigestFormat {
    if (templateId.includes('brief')) {
      return DigestFormat.BRIEF;
    } else if (templateId.includes('detailed')) {
      return DigestFormat.DETAILED;
    }
    return DigestFormat.STANDARD; // Default
  }

  /**
   * Create a standard daily template
   */
  private createDailyStandardTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #1976d2; padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; }
    .footer { background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; }
    a { color: #1976d2; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">Hypat.ai</h1>
      <h2 style="margin: 10px 0 0 0; font-size: 18px;">{{title}}</h2>
    </div>
    
    <div class="content">
      <p>{{description}}</p>
      
      <!-- Newsletter Sections -->
      {{sections}}
    </div>
    
    <div class="footer">
      <p>This digest was generated on {{generatedAt}} by Hypat.ai</p>
      <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{preferencesUrl}}">Manage preferences</a></p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Create a weekly standard template
   */
  private createWeeklyStandardTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background-color: #1976d2; padding: 20px; text-align: center; color: white; }
    .content { padding: 20px; }
    .footer { background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; }
    a { color: #1976d2; text-decoration: none; }
    .section { margin-bottom: 20px; }
    .item { padding: 10px; border-bottom: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">Weekly Digest</h1>
      <h2 style="margin: 10px 0 0 0; font-size: 18px;">{{title}}</h2>
    </div>
    
    <div class="content">
      <p>Here's your weekly digest of newsletter content from {{startDate}} to {{endDate}}.</p>
      <p>{{description}}</p>
      
      <!-- Newsletter Sections -->
      {{sections}}
    </div>
    
    <div class="footer">
      <p>This digest was generated on {{generatedAt}} by Hypat.ai</p>
      <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{preferencesUrl}}">Manage preferences</a></p>
    </div>
  </div>
</body>
</html>
    `;
  }
}