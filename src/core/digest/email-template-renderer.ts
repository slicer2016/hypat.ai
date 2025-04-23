/**
 * Email Template Renderer Implementation
 * Renders digest content into email templates using MJML
 */

import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mjml2html from 'mjml';
import { render } from 'mjml-react';
import React from 'react';
import { 
  Digest, 
  DigestTemplate, 
  EmailTemplateRenderer 
} from './interfaces.js';
import { Logger } from '../../utils/logger.js';

/**
 * Implementation of the EmailTemplateRenderer interface
 */
export class EmailTemplateRendererImpl implements EmailTemplateRenderer {
  private logger: Logger;
  private templatesDir: string;
  
  // In-memory cache for templates (would be replaced by database in production)
  private templateCache: Map<string, DigestTemplate>;

  constructor(templatesDir?: string) {
    this.logger = new Logger('EmailTemplateRenderer');
    this.templatesDir = templatesDir || path.join(process.cwd(), 'src/core/digest/templates');
    this.templateCache = new Map<string, DigestTemplate>();
    
    // Initialize the template cache
    this.initializeTemplateCache().catch(error => {
      this.logger.error(`Error initializing template cache: ${error instanceof Error ? error.message : String(error)}`);
    });
  }

  /**
   * Initialize the template cache by loading templates from the templates directory
   */
  private async initializeTemplateCache(): Promise<void> {
    try {
      // Check if templates directory exists
      try {
        await fs.access(this.templatesDir);
      } catch (error) {
        this.logger.info(`Templates directory does not exist, creating: ${this.templatesDir}`);
        await fs.mkdir(this.templatesDir, { recursive: true });
      }

      // Create default templates if none exist
      const files = await fs.readdir(this.templatesDir);
      if (files.length === 0) {
        this.logger.info('No templates found, creating default templates');
        await this.createDefaultTemplates();
      } else {
        // Load existing templates
        for (const file of files) {
          if (file.endsWith('.mjml')) {
            const templateId = file.replace('.mjml', '');
            const templatePath = path.join(this.templatesDir, file);
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            
            // Create template object and add to cache
            this.templateCache.set(templateId, {
              id: templateId,
              name: this.formatTemplateName(templateId),
              description: `Template loaded from ${file}`,
              frequency: this.getFrequencyFromTemplateId(templateId),
              format: this.getFormatFromTemplateId(templateId),
              template: templateContent,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }

      this.logger.info(`Initialized template cache with ${this.templateCache.size} templates`);
    } catch (error) {
      this.logger.error(`Error initializing template cache: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Create default templates
   */
  private async createDefaultTemplates(): Promise<void> {
    try {
      // Create standard daily template
      const dailyStandardTemplate = this.createDailyStandardTemplate();
      await this.saveTemplate('daily-standard', dailyStandardTemplate);

      // Create weekly standard template
      const weeklyStandardTemplate = this.createWeeklyStandardTemplate();
      await this.saveTemplate('weekly-standard', weeklyStandardTemplate);

      // Create brief daily template
      const dailyBriefTemplate = this.createDailyBriefTemplate();
      await this.saveTemplate('daily-brief', dailyBriefTemplate);

      // Create detailed weekly template
      const weeklyDetailedTemplate = this.createWeeklyDetailedTemplate();
      await this.saveTemplate('weekly-detailed', weeklyDetailedTemplate);
    } catch (error) {
      this.logger.error(`Error creating default templates: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Save a template to the templates directory and cache
   * @param templateId The ID of the template
   * @param templateContent The template content
   */
  private async saveTemplate(templateId: string, templateContent: string): Promise<void> {
    try {
      // Save template to file
      const templatePath = path.join(this.templatesDir, `${templateId}.mjml`);
      await fs.writeFile(templatePath, templateContent, 'utf-8');

      // Add to cache
      this.templateCache.set(templateId, {
        id: templateId,
        name: this.formatTemplateName(templateId),
        description: `Default ${templateId} template`,
        frequency: this.getFrequencyFromTemplateId(templateId),
        format: this.getFormatFromTemplateId(templateId),
        template: templateContent,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      this.logger.info(`Created template: ${templateId}`);
    } catch (error) {
      this.logger.error(`Error saving template ${templateId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
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
      const template = await this.getTemplate(templateId);
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
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Replace placeholders in the template
      let mjmlTemplate = template.template;
      for (const [key, value] of Object.entries(data)) {
        const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        mjmlTemplate = mjmlTemplate.replace(placeholder, String(value));
      }

      // Special handling for sections
      if (data.sections) {
        // Replace the sections placeholder with the rendered sections
        const sectionsPlaceholder = /{{sections}}/g;
        const renderedSections = await this.renderSections(data.sections);
        mjmlTemplate = mjmlTemplate.replace(sectionsPlaceholder, renderedSections);
      }

      // Convert MJML to HTML
      const { html, errors } = mjml2html(mjmlTemplate);

      if (errors && errors.length > 0) {
        this.logger.warn(`MJML rendering errors: ${JSON.stringify(errors)}`);
      }

      return html;
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
      return Array.from(this.templateCache.values());
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
      return this.templateCache.get(templateId) || null;
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
   * Render digest sections to MJML
   * @param sections The sections to render
   */
  private async renderSections(sections: any[]): Promise<string> {
    try {
      let sectionsHtml = '';

      for (const section of sections) {
        sectionsHtml += `
          <mj-section padding="0 0 20px 0">
            <mj-column>
              <mj-text font-size="20px" font-weight="bold" padding-bottom="10px">${section.title}</mj-text>
              ${section.description ? `<mj-text font-size="14px" padding-bottom="10px">${section.description}</mj-text>` : ''}
            </mj-column>
          </mj-section>
        `;

        // Render items in this section
        if (section.items && section.items.length > 0) {
          for (const item of section.items) {
            sectionsHtml += `
              <mj-section padding="10px 0" border-bottom="1px solid #f0f0f0">
                <mj-column>
                  <mj-text font-size="16px" font-weight="bold">${item.title}</mj-text>
                  <mj-text font-size="12px" color="#999999">From ${item.newsletterName} · ${this.formatDate(new Date(item.publishedAt))}</mj-text>
                  <mj-text>${item.summary}</mj-text>
                  ${item.originalUrl ? `<mj-button href="${item.originalUrl}" background-color="#1976d2" color="white">Read More</mj-button>` : ''}
                </mj-column>
                ${item.imageUrl ? `
                <mj-column width="200px">
                  <mj-image src="${item.imageUrl}" alt="${item.title}" />
                </mj-column>
                ` : ''}
              </mj-section>
            `;
          }
        } else {
          sectionsHtml += `
            <mj-section padding="10px 0">
              <mj-column>
                <mj-text>No items in this section.</mj-text>
              </mj-column>
            </mj-section>
          `;
        }
      }

      return sectionsHtml;
    } catch (error) {
      this.logger.error(`Error rendering sections: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
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
  private getFrequencyFromTemplateId(templateId: string): any {
    if (templateId.includes('daily')) {
      return 'daily';
    } else if (templateId.includes('weekly')) {
      return 'weekly';
    } else if (templateId.includes('bi-weekly')) {
      return 'bi-weekly';
    } else if (templateId.includes('monthly')) {
      return 'monthly';
    }
    return 'daily'; // Default
  }

  /**
   * Extract format from template ID
   * @param templateId The template ID
   */
  private getFormatFromTemplateId(templateId: string): any {
    if (templateId.includes('brief')) {
      return 'brief';
    } else if (templateId.includes('detailed')) {
      return 'detailed';
    }
    return 'standard'; // Default
  }

  /**
   * Create a standard daily template
   */
  private createDailyStandardTemplate(): string {
    return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-font name="Roboto" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700" />
    <mj-attributes>
      <mj-all font-family="Roboto, Arial, sans-serif" />
      <mj-text font-weight="400" font-size="14px" color="#000000" line-height="24px" />
      <mj-section padding="0px" />
    </mj-attributes>
    <mj-style>
      a { text-decoration: none; color: #1976d2; }
      .shadow { box-shadow: 0 2px 5px 0 rgba(0,0,0,0.16), 0 2px 10px 0 rgba(0,0,0,0.12); }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f9f9f9">
    <!-- Header -->
    <mj-section padding="20px 0" background-color="#1976d2">
      <mj-column>
        <mj-text font-size="28px" color="#ffffff" font-weight="bold" align="center">
          Hypat.ai
        </mj-text>
        <mj-text font-size="18px" color="#ffffff" align="center">
          {{title}}
        </mj-text>
      </mj-column>
    </mj-section>
    
    <!-- Intro -->
    <mj-section padding="20px 0" background-color="#ffffff">
      <mj-column>
        <mj-text>
          {{description}}
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Sections -->
    {{sections}}
    
    <!-- Footer -->
    <mj-section padding="20px 0" background-color="#f0f0f0">
      <mj-column>
        <mj-text font-size="12px" align="center">
          This digest was generated on {{generatedAt}} by Hypat.ai
        </mj-text>
        <mj-text font-size="12px" align="center">
          <a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{preferencesUrl}}">Manage preferences</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
    `;
  }

  /**
   * Create a weekly standard template
   */
  private createWeeklyStandardTemplate(): string {
    return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-font name="Roboto" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700" />
    <mj-attributes>
      <mj-all font-family="Roboto, Arial, sans-serif" />
      <mj-text font-weight="400" font-size="14px" color="#000000" line-height="24px" />
      <mj-section padding="0px" />
    </mj-attributes>
    <mj-style>
      a { text-decoration: none; color: #1976d2; }
      .shadow { box-shadow: 0 2px 5px 0 rgba(0,0,0,0.16), 0 2px 10px 0 rgba(0,0,0,0.12); }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f9f9f9">
    <!-- Header -->
    <mj-section padding="20px 0" background-color="#1976d2">
      <mj-column>
        <mj-text font-size="28px" color="#ffffff" font-weight="bold" align="center">
          Hypat.ai
        </mj-text>
        <mj-text font-size="18px" color="#ffffff" align="center">
          {{title}}
        </mj-text>
      </mj-column>
    </mj-section>
    
    <!-- Intro -->
    <mj-section padding="20px 0" background-color="#ffffff">
      <mj-column>
        <mj-text>
          <p>Here's your weekly digest of newsletter content from {{startDate}} to {{endDate}}.</p>
          <p>{{description}}</p>
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Sections -->
    {{sections}}
    
    <!-- Footer -->
    <mj-section padding="20px 0" background-color="#f0f0f0">
      <mj-column>
        <mj-text font-size="12px" align="center">
          This digest was generated on {{generatedAt}} by Hypat.ai
        </mj-text>
        <mj-text font-size="12px" align="center">
          <a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{preferencesUrl}}">Manage preferences</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
    `;
  }

  /**
   * Create a brief daily template
   */
  private createDailyBriefTemplate(): string {
    return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-font name="Roboto" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700" />
    <mj-attributes>
      <mj-all font-family="Roboto, Arial, sans-serif" />
      <mj-text font-weight="400" font-size="14px" color="#000000" line-height="20px" />
      <mj-section padding="0px" />
    </mj-attributes>
    <mj-style>
      a { text-decoration: none; color: #1976d2; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f9f9f9">
    <!-- Header -->
    <mj-section padding="10px 0" background-color="#1976d2">
      <mj-column>
        <mj-text font-size="20px" color="#ffffff" font-weight="bold" align="center">
          {{title}}
        </mj-text>
      </mj-column>
    </mj-section>
    
    <!-- Intro -->
    <mj-section padding="10px 0" background-color="#ffffff">
      <mj-column>
        <mj-text>
          {{description}}
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Sections -->
    {{sections}}
    
    <!-- Footer -->
    <mj-section padding="10px 0" background-color="#f0f0f0">
      <mj-column>
        <mj-text font-size="10px" align="center">
          Generated on {{generatedAt}} | <a href="{{unsubscribeUrl}}">Unsubscribe</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
    `;
  }

  /**
   * Create a detailed weekly template
   */
  private createWeeklyDetailedTemplate(): string {
    return `
<mjml>
  <mj-head>
    <mj-title>{{title}}</mj-title>
    <mj-font name="Roboto" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700" />
    <mj-attributes>
      <mj-all font-family="Roboto, Arial, sans-serif" />
      <mj-text font-weight="400" font-size="14px" color="#000000" line-height="24px" />
      <mj-section padding="0px" />
    </mj-attributes>
    <mj-style>
      a { text-decoration: none; color: #1976d2; }
      .shadow { box-shadow: 0 2px 5px 0 rgba(0,0,0,0.16), 0 2px 10px 0 rgba(0,0,0,0.12); }
      .header { border-bottom: 4px solid #1976d2; }
      .category-header { border-left: 4px solid #1976d2; padding-left: 10px; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#f9f9f9">
    <!-- Header -->
    <mj-section padding="20px 0" background-color="#ffffff" css-class="header">
      <mj-column>
        <mj-text font-size="28px" color="#1976d2" font-weight="bold" align="center">
          Hypat.ai Weekly Digest
        </mj-text>
        <mj-text font-size="18px" color="#333333" align="center">
          {{title}}
        </mj-text>
        <mj-text font-size="14px" color="#666666" align="center">
          {{startDate}} to {{endDate}}
        </mj-text>
      </mj-column>
    </mj-section>
    
    <!-- Intro -->
    <mj-section padding="20px 0" background-color="#ffffff">
      <mj-column>
        <mj-text>
          <p>Here's your comprehensive weekly digest of all important newsletter content.</p>
          <p>{{description}}</p>
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Table of Contents -->
    <mj-section padding="20px 0" background-color="#f5f5f5">
      <mj-column>
        <mj-text font-size="18px" font-weight="bold">
          In This Digest:
        </mj-text>
        <mj-text>
          <ul>
            {{#each sections}}
            <li><a href="#section-{{id}}">{{title}}</a></li>
            {{/each}}
          </ul>
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Sections -->
    {{sections}}
    
    <!-- Footer -->
    <mj-section padding="20px 0" background-color="#f0f0f0">
      <mj-column>
        <mj-text font-size="12px" align="center">
          This digest was generated on {{generatedAt}} by Hypat.ai
        </mj-text>
        <mj-text font-size="12px" align="center">
          <a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="{{preferencesUrl}}">Manage preferences</a>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
    `;
  }
}