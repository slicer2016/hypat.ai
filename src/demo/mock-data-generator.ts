/**
 * Mock Data Generator for Hypat.ai Demo
 * Generates realistic sample data for demonstration purposes
 */

import { v4 as uuidv4 } from 'uuid';
import { DateTime } from 'luxon';
import { 
  NewsletterEntity, 
  UserEntity, 
  CategoryEntity,
  UserPreferenceEntity
} from '../data/interfaces.js';
import { DigestFrequency, DigestFormat } from '../core/digest/interfaces.js';
import { Logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs/promises';

// Sample newsletter sender domains
const NEWSLETTER_DOMAINS = [
  'substack.com',
  'beehiiv.com',
  'convertkit.com',
  'mailchimp.com',
  'techcrunch.com',
  'thehustle.co',
  'axios.com',
  'forbes.com',
  'wsj.com',
  'medium.com',
  'morningbrew.com',
  'bloomberg.com',
  'economist.com',
  'nationalgeographic.com',
  'insiderai.substack.com',
  'theverge.com'
];

// Sample newsletter names by category
const NEWSLETTER_NAMES: Record<string, string[]> = {
  'Technology': [
    'Tech Today',
    'AI Weekly',
    'Developer Digest',
    'Cloud Computing News',
    'Tech Insights',
    'Cutting Edge Tech',
    'Code Chronicles',
    'The Daily Dev'
  ],
  'Finance': [
    'Money Matters',
    'Investment Insights',
    'Financial Freedom',
    'Stock Market Daily',
    'Crypto Corner',
    'Wealth Wire',
    'Banking Bulletin',
    'Economic Essentials'
  ],
  'Marketing': [
    'Marketing Masterclass',
    'Growth Tactics',
    'Digital Marketer',
    'Content Creation',
    'SEO Secrets',
    'Social Media Trends',
    'Brand Builder',
    'Marketing Metrics'
  ],
  'Science': [
    'Science Spotlight',
    'Research Roundup',
    'Discovery Digest',
    'Scientific American',
    'Lab Notes',
    'Future of Science',
    'Biology Briefing',
    'Physics Phenomena'
  ],
  'Business': [
    'Business Brief',
    'Startup Stories',
    'Entrepreneur Essentials',
    'Business Strategy',
    'Leadership Lessons',
    'Corporate Chronicle',
    'Management Memos',
    'Business Trends'
  ],
  'Health': [
    'Health Headlines',
    'Wellness Weekly',
    'Medical Minute',
    'Fitness Focus',
    'Nutrition Notes',
    'Mental Health Matters',
    'Healthcare Highlights',
    'Longevity Learnings'
  ],
  'Politics': [
    'Political Pulse',
    'Policy Perspectives',
    'Government Gazette',
    'Democracy Digest',
    'World Affairs',
    'Political Analysis',
    'Capitol Connections',
    'Global Governance'
  ],
  'Culture': [
    'Culture Club',
    'Arts Appreciation',
    'Entertainment Express',
    'Creative Corner',
    'Media Musings',
    'Film Fanatic',
    'Book Bytes',
    'Music Moments'
  ]
};

/**
 * Helper function to generate random date within a range
 * @param startDate Start of date range
 * @param endDate End of date range
 */
function randomDate(startDate: Date, endDate: Date): Date {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime);
}

/**
 * Helper function to pick a random item from an array
 * @param array The array to pick from
 */
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Helper function to generate Lorem Ipsum text
 * @param paragraphs Number of paragraphs to generate
 * @param minSentences Minimum sentences per paragraph
 * @param maxSentences Maximum sentences per paragraph
 */
function generateLoremIpsum(paragraphs: number, minSentences = 3, maxSentences = 8): string {
  const sentences = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.",
    "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.",
    "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
    "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam.",
    "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur.",
    "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit.",
    "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus.",
    "Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis.",
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis.",
    "Et harum quidem rerum facilis est et expedita distinctio.",
    "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit.",
    "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus."
  ];

  let result = '';

  for (let i = 0; i < paragraphs; i++) {
    const numSentences = Math.floor(Math.random() * (maxSentences - minSentences + 1)) + minSentences;
    const paragraph = [];
    
    for (let j = 0; j < numSentences; j++) {
      paragraph.push(randomItem(sentences));
    }
    
    result += paragraph.join(' ') + '\n\n';
  }

  return result;
}

/**
 * Generate a mock HTML newsletter based on category
 * @param category The newsletter category
 * @param title The newsletter title 
 */
function generateNewsletterHtml(category: string, title: string): string {
  const headerColor = {
    'Technology': '#007bff',
    'Finance': '#28a745',
    'Marketing': '#fd7e14',
    'Science': '#6f42c1',
    'Business': '#17a2b8',
    'Health': '#dc3545',
    'Politics': '#6c757d',
    'Culture': '#e83e8c'
  }[category] || '#343a40';

  // Generate a few section titles based on category
  const sectionTitles = generateSectionTitles(category, 3);
  
  // Generate content for each section
  const sections = sectionTitles.map(sectionTitle => {
    const paragraphs = Math.floor(Math.random() * 3) + 2; // 2-4 paragraphs
    const content = generateLoremIpsum(paragraphs);
    return `
      <div class="section" style="margin-bottom: 25px;">
        <h2 style="color: ${headerColor}; font-size: 22px; margin-bottom: 10px;">${sectionTitle}</h2>
        <div class="content">
          ${content.split('\n\n').map(p => `<p style="margin-bottom: 15px; line-height: 1.5;">${p}</p>`).join('')}
        </div>
      </div>
    `;
  }).join('');

  // Generate a few links
  const links = generateLinks(category, 3);
  const linksHtml = links.map(link => 
    `<li style="margin-bottom: 10px;"><a href="${link.url}" style="color: ${headerColor}; text-decoration: none;">${link.text}</a></li>`
  ).join('');

  // Create the newsletter HTML
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div class="container" style="background-color: #ffffff; border-radius: 5px; padding: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
        <div class="header" style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eeeeee; margin-bottom: 20px;">
          <h1 style="color: ${headerColor}; font-size: 28px; margin-bottom: 10px;">${title}</h1>
          <p style="color: #666666; font-size: 16px; margin-top: 0;">${generateLoremIpsum(1, 1, 1).trim()}</p>
        </div>
        
        <div class="main-content">
          ${sections}
        </div>
        
        <div class="further-reading" style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <h3 style="color: ${headerColor}; font-size: 18px; margin-top: 0;">Further Reading</h3>
          <ul style="padding-left: 20px;">
            ${linksHtml}
          </ul>
        </div>
        
        <div class="footer" style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eeeeee; text-align: center; color: #999999; font-size: 14px;">
          <p>© ${new Date().getFullYear()} ${title}. All rights reserved.</p>
          <p>
            <a href="#" style="color: #999999; text-decoration: none; margin: 0 5px;">Unsubscribe</a> | 
            <a href="#" style="color: #999999; text-decoration: none; margin: 0 5px;">Preferences</a> | 
            <a href="#" style="color: #999999; text-decoration: none; margin: 0 5px;">View in browser</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate section titles based on category
 * @param category The newsletter category
 * @param count Number of section titles to generate
 */
function generateSectionTitles(category: string, count: number): string[] {
  const titles: Record<string, string[]> = {
    'Technology': [
      'Latest Tech News', 'Industry Updates', 'Product Releases', 
      'Developer Tools', 'Tech Trends', 'AI Advancements',
      'Programming Tips', 'Cloud Innovations', 'Cybersecurity Alerts'
    ],
    'Finance': [
      'Market Overview', 'Investment Strategies', 'Stock Picks', 
      'Crypto Updates', 'Economic Outlook', 'Personal Finance Tips',
      'Retirement Planning', 'Tax Strategies', 'Financial News'
    ],
    'Marketing': [
      'Digital Marketing Trends', 'Content Strategy', 'SEO Updates', 
      'Social Media Tips', 'Email Marketing', 'Analytics Insights',
      'Growth Hacking', 'Branding Strategies', 'Marketing ROI'
    ],
    'Science': [
      'Research Highlights', 'Scientific Breakthroughs', 'Innovation Spotlight', 
      'Climate Updates', 'Space Exploration', 'Medical Discoveries',
      'Technology Advances', 'Environmental News', 'Physics Corner'
    ],
    'Business': [
      'Industry Insights', 'Leadership Lessons', 'Startup News', 
      'Management Tips', 'Corporate Strategy', 'Entrepreneurship',
      'Business Technology', 'Workplace Culture', 'Case Studies'
    ],
    'Health': [
      'Wellness Tips', 'Nutrition News', 'Fitness Updates', 
      'Mental Health', 'Medical Research', 'Healthy Living',
      'Disease Prevention', 'Healthcare Policy', 'Expert Interviews'
    ],
    'Politics': [
      'Policy Updates', 'Global Affairs', 'Legislative News', 
      'Election Coverage', 'Political Analysis', 'International Relations',
      'Democracy Watch', 'Government Actions', 'Public Opinion'
    ],
    'Culture': [
      'Arts & Entertainment', 'Book Reviews', 'Film Analysis', 
      'Music Highlights', 'Cultural Trends', 'Media Spotlight',
      'Creative Inspiration', 'Art Exhibitions', 'Cultural Commentary'
    ]
  };

  const categoryTitles = titles[category] || titles['Technology'];
  const result: string[] = [];
  
  // Get unique random titles
  const availableTitles = [...categoryTitles];
  for (let i = 0; i < count && availableTitles.length > 0; i++) {
    const index = Math.floor(Math.random() * availableTitles.length);
    result.push(availableTitles[index]);
    availableTitles.splice(index, 1);
  }
  
  return result;
}

/**
 * Generate links based on category
 * @param category The newsletter category
 * @param count Number of links to generate
 */
function generateLinks(category: string, count: number): Array<{url: string, text: string}> {
  const links: Record<string, Array<{url: string, text: string}>> = {
    'Technology': [
      {url: 'https://example.com/tech-news', text: 'Top 10 Tech Trends for 2025'},
      {url: 'https://example.com/ai-news', text: 'How AI is Transforming Industries'},
      {url: 'https://example.com/developer', text: 'Essential Developer Tools'},
      {url: 'https://example.com/cloud', text: 'Cloud Computing Explained'},
      {url: 'https://example.com/cybersecurity', text: 'Cybersecurity Best Practices'}
    ],
    'Finance': [
      {url: 'https://example.com/stocks', text: 'Stock Market Outlook 2025'},
      {url: 'https://example.com/crypto', text: 'Cryptocurrency Analysis'},
      {url: 'https://example.com/investing', text: 'Investment Strategies for Beginners'},
      {url: 'https://example.com/retirement', text: 'Planning for Retirement'},
      {url: 'https://example.com/taxes', text: 'Tax Optimization Tips'}
    ],
    'Marketing': [
      {url: 'https://example.com/digital-marketing', text: 'Digital Marketing Playbook'},
      {url: 'https://example.com/content', text: 'Content Creation Strategies'},
      {url: 'https://example.com/seo', text: 'SEO Guide for 2025'},
      {url: 'https://example.com/social', text: 'Social Media Marketing Tips'},
      {url: 'https://example.com/email', text: 'Email Marketing Best Practices'}
    ],
    'Science': [
      {url: 'https://example.com/research', text: 'Latest Scientific Research'},
      {url: 'https://example.com/space', text: 'Space Exploration Updates'},
      {url: 'https://example.com/climate', text: 'Climate Science Explained'},
      {url: 'https://example.com/biology', text: 'Breakthroughs in Biology'},
      {url: 'https://example.com/physics', text: 'Physics Discoveries 2025'}
    ],
    'Business': [
      {url: 'https://example.com/business', text: 'Business Trends 2025'},
      {url: 'https://example.com/startup', text: 'Startup Success Stories'},
      {url: 'https://example.com/leadership', text: 'Leadership in the Digital Age'},
      {url: 'https://example.com/management', text: 'Management Techniques'},
      {url: 'https://example.com/strategy', text: 'Strategic Planning Guide'}
    ],
    'Health': [
      {url: 'https://example.com/wellness', text: 'Wellness Guide 2025'},
      {url: 'https://example.com/nutrition', text: 'Nutrition Science Updates'},
      {url: 'https://example.com/fitness', text: 'Fitness Strategies'},
      {url: 'https://example.com/mental-health', text: 'Mental Health Resources'},
      {url: 'https://example.com/medicine', text: 'Medical Breakthroughs'}
    ],
    'Politics': [
      {url: 'https://example.com/policy', text: 'Policy Analysis 2025'},
      {url: 'https://example.com/global', text: 'Global Affairs Summary'},
      {url: 'https://example.com/legislation', text: 'Legislative Updates'},
      {url: 'https://example.com/democracy', text: 'State of Democracy Report'},
      {url: 'https://example.com/election', text: 'Election Coverage Guide'}
    ],
    'Culture': [
      {url: 'https://example.com/arts', text: 'Arts & Culture Review'},
      {url: 'https://example.com/books', text: 'Book Recommendations 2025'},
      {url: 'https://example.com/film', text: 'Film Analysis'},
      {url: 'https://example.com/music', text: 'Music Trends'},
      {url: 'https://example.com/media', text: 'Media Literacy Guide'}
    ]
  };

  const categoryLinks = links[category] || links['Technology'];
  const result: Array<{url: string, text: string}> = [];
  
  // Get unique random links
  const availableLinks = [...categoryLinks];
  for (let i = 0; i < count && availableLinks.length > 0; i++) {
    const index = Math.floor(Math.random() * availableLinks.length);
    result.push(availableLinks[index]);
    availableLinks.splice(index, 1);
  }
  
  return result;
}

/**
 * Mock data generator for the Hypat.ai demo
 */
export class MockDataGenerator {
  private logger: Logger;
  
  constructor() {
    this.logger = new Logger('MockDataGenerator');
  }
  
  /**
   * Generate sample user entities
   * @param count Number of users to generate
   */
  async generateUsers(count: number = 2): Promise<UserEntity[]> {
    this.logger.info(`Generating ${count} user entities`);
    
    const users: UserEntity[] = [];
    
    for (let i = 1; i <= count; i++) {
      const user: UserEntity = {
        id: `user-${i}`,
        email: `user${i}@example.com`,
        name: `User ${i}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      users.push(user);
    }
    
    return users;
  }
  
  /**
   * Generate sample category entities
   */
  async generateCategories(): Promise<CategoryEntity[]> {
    this.logger.info('Generating category entities');
    
    const categories: CategoryEntity[] = [];
    const categoryNames = Object.keys(NEWSLETTER_NAMES);
    
    // Primary categories
    for (const name of categoryNames) {
      const category: CategoryEntity = {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        description: `${name} newsletters and content`,
        icon: `${name.toLowerCase()}-icon`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      categories.push(category);
    }
    
    // Add a few subcategories
    const subcategories = [
      { id: 'artificial-intelligence', parentId: 'technology', name: 'Artificial Intelligence', description: 'AI and machine learning newsletters' },
      { id: 'web-development', parentId: 'technology', name: 'Web Development', description: 'Web development and design newsletters' },
      { id: 'investing', parentId: 'finance', name: 'Investing', description: 'Investment strategy newsletters' },
      { id: 'cryptocurrency', parentId: 'finance', name: 'Cryptocurrency', description: 'Crypto and blockchain newsletters' },
      { id: 'digital-marketing', parentId: 'marketing', name: 'Digital Marketing', description: 'Digital marketing newsletters' },
      { id: 'content-marketing', parentId: 'marketing', name: 'Content Marketing', description: 'Content creation and marketing newsletters' }
    ];
    
    for (const sub of subcategories) {
      const category: CategoryEntity = {
        id: sub.id,
        name: sub.name,
        description: sub.description,
        parentId: sub.parentId,
        icon: `${sub.id}-icon`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      categories.push(category);
    }
    
    return categories;
  }
  
  /**
   * Generate sample newsletter entities
   * @param count Number of newsletters to generate
   * @param startDate Start date for newsletter generation
   * @param endDate End date for newsletter generation
   */
  async generateNewsletters(count: number = 30, startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate: Date = new Date()): Promise<NewsletterEntity[]> {
    this.logger.info(`Generating ${count} newsletter entities`);
    
    const newsletters: NewsletterEntity[] = [];
    const categoryNames = Object.keys(NEWSLETTER_NAMES);
    
    for (let i = 1; i <= count; i++) {
      // Choose a random category
      const category = randomItem(categoryNames);
      
      // Choose a random newsletter name from that category
      const name = randomItem(NEWSLETTER_NAMES[category]);
      
      // Generate subject with a random suffix for uniqueness
      const subject = `${name} - ${randomItem([
        'Weekly Update',
        'Latest Edition',
        'Breaking News',
        'This Week\'s Insights',
        'Special Report',
        'Monthly Recap',
        'Hot Topics',
        'Trending Now'
      ])} #${Math.floor(Math.random() * 100)}`;
      
      // Choose sender domain and create sender email
      const domain = randomItem(NEWSLETTER_DOMAINS);
      const sender = `${name.toLowerCase().replace(/\s+/g, '.')}@${domain}`;
      
      // Generate random received date
      const receivedDate = randomDate(startDate, endDate);
      
      // Generate HTML content
      const contentHtml = generateNewsletterHtml(category, name);
      
      // Generate plain text version (simplified)
      const contentText = contentHtml
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Create newsletter entity
      const newsletter: NewsletterEntity = {
        id: `newsletter-${i}`,
        emailId: `email-${uuidv4()}`,
        subject,
        sender,
        receivedDate,
        contentHtml,
        contentText,
        metadataJson: JSON.stringify({
          category,
          sender,
          receivedDate: receivedDate.toISOString(),
          domain,
          name
        }),
        detectionConfidence: 0.75 + (Math.random() * 0.25), // High confidence between 0.75 and 1.0
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      newsletters.push(newsletter);
    }
    
    // Add a few newsletters with lower confidence scores
    for (let i = 1; i <= Math.min(5, Math.ceil(count * 0.15)); i++) {
      const index = count - i;
      if (newsletters[index]) {
        newsletters[index].detectionConfidence = 0.5 + (Math.random() * 0.25); // Medium confidence between 0.5 and 0.75
        newsletters[index].isVerified = false;
      }
    }
    
    return newsletters;
  }

  /**
   * Generate sample user preferences
   * @param userId User ID to generate preferences for
   * @param categories List of categories to choose from
   */
  async generateUserPreferences(userId: string, categories: CategoryEntity[]): Promise<UserPreferenceEntity[]> {
    this.logger.info(`Generating user preferences for user ${userId}`);
    
    const preferences: UserPreferenceEntity[] = [];
    
    // Digest frequency preference
    preferences.push({
      id: uuidv4(),
      userId,
      preferenceKey: 'digest.frequency',
      preferenceValue: DigestFrequency.DAILY,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Digest format preference
    preferences.push({
      id: uuidv4(),
      userId,
      preferenceKey: 'digest.format',
      preferenceValue: DigestFormat.STANDARD,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Email delivery time preference (9:00 AM)
    preferences.push({
      id: uuidv4(),
      userId,
      preferenceKey: 'digest.deliveryTime',
      preferenceValue: '09:00',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Timezone preference (UTC)
    preferences.push({
      id: uuidv4(),
      userId,
      preferenceKey: 'digest.timezone',
      preferenceValue: 'UTC',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Category preferences (include 3-5 random categories)
    const categoryCount = Math.floor(Math.random() * 3) + 3; // 3-5 categories
    const shuffledCategories = [...categories].sort(() => Math.random() - 0.5);
    const selectedCategories = shuffledCategories.slice(0, categoryCount);
    
    // Add selected categories as preferences
    preferences.push({
      id: uuidv4(),
      userId,
      preferenceKey: 'digest.categories',
      preferenceValue: selectedCategories.map(c => c.id).join(','),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return preferences;
  }

  /**
   * Generate sample category assignments for newsletters
   * @param newsletters List of newsletters to assign categories to
   * @param categories List of categories to assign
   */
  async generateCategoryAssignments(newsletters: NewsletterEntity[], categories: CategoryEntity[]): Promise<any[]> {
    this.logger.info(`Generating category assignments for ${newsletters.length} newsletters`);
    
    const assignments: any[] = [];
    const categoryMap = new Map<string, CategoryEntity>();
    
    // Create category map for easier lookup
    for (const category of categories) {
      categoryMap.set(category.name.toLowerCase(), category);
    }
    
    for (const newsletter of newsletters) {
      // Extract category from metadata
      let metadata: any = {};
      try {
        metadata = JSON.parse(newsletter.metadataJson || '{}');
      } catch (e) {
        this.logger.warn(`Failed to parse metadata for newsletter ${newsletter.id}`);
      }
      
      const primaryCategory = metadata.category || 'Technology';
      const primaryCategoryEntity = categoryMap.get(primaryCategory.toLowerCase()) || 
                                    categoryMap.get('technology');
      
      if (primaryCategoryEntity) {
        // Add primary category assignment
        assignments.push({
          id: uuidv4(),
          newsletterId: newsletter.id,
          categoryId: primaryCategoryEntity.id,
          confidence: 0.85 + (Math.random() * 0.15), // High confidence 0.85 - 1.0
          isManual: false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // 50% chance to add a second category
        if (Math.random() > 0.5) {
          // Get a random different category
          const otherCategories = categories.filter(c => c.id !== primaryCategoryEntity.id);
          if (otherCategories.length > 0) {
            const secondaryCategory = randomItem(otherCategories);
            
            assignments.push({
              id: uuidv4(),
              newsletterId: newsletter.id,
              categoryId: secondaryCategory.id,
              confidence: 0.5 + (Math.random() * 0.3), // Medium confidence 0.5 - 0.8
              isManual: false,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }
    }
    
    return assignments;
  }

  /**
   * Generate sample email templates for the demo
   * Load templates from the core/digest/templates directory
   */
  async loadEmailTemplates(): Promise<Record<string, string>> {
    this.logger.info('Loading email templates');
    
    const templates: Record<string, string> = {};
    const templatesDir = path.join(process.cwd(), 'src/core/digest/templates');
    
    try {
      const files = await fs.readdir(templatesDir);
      for (const file of files) {
        if (file.endsWith('.mjml')) {
          const templateName = file.replace('.mjml', '');
          const templatePath = path.join(templatesDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          templates[templateName] = templateContent;
        }
      }
    } catch (e) {
      this.logger.error(`Failed to load templates: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    // Fall back to simple templates if no templates were loaded
    if (Object.keys(templates).length === 0) {
      templates['daily-standard'] = this.generateSimpleTemplate('daily');
      templates['weekly-standard'] = this.generateSimpleTemplate('weekly');
      templates['verification'] = this.generateSimpleTemplate('verification');
    }
    
    return templates;
  }
  
  /**
   * Generate a simple email template fallback
   * @param type The type of template ('daily', 'weekly', or 'verification')
   */
  private generateSimpleTemplate(type: 'daily' | 'weekly' | 'verification'): string {
    switch (type) {
      case 'daily':
        return `
          <mjml>
            <mj-body>
              <mj-section>
                <mj-column>
                  <mj-text>Daily Digest</mj-text>
                  <mj-text>{{content}}</mj-text>
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>
        `;
      case 'weekly':
        return `
          <mjml>
            <mj-body>
              <mj-section>
                <mj-column>
                  <mj-text>Weekly Digest</mj-text>
                  <mj-text>{{content}}</mj-text>
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>
        `;
      case 'verification':
        return `
          <mjml>
            <mj-body>
              <mj-section>
                <mj-column>
                  <mj-text>Newsletter Verification</mj-text>
                  <mj-text>Please verify this newsletter.</mj-text>
                  <mj-button href="{{confirmUrl}}">Yes, it's a newsletter</mj-button>
                  <mj-button href="{{rejectUrl}}">No, it's not a newsletter</mj-button>
                </mj-column>
              </mj-section>
            </mj-body>
          </mjml>
        `;
    }
  }
}