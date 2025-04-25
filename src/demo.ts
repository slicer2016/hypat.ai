/**
 * Hypat.ai Demo Script
 * Demonstrates key features of the Hypat.ai newsletter processing system
 */

import { DemoOutput } from './demo/demo-output.js';
import { DemoSetup } from './demo/demo-setup.js';
import { Config } from './config/config.js';
import { createNewsletterDetector } from './core/detection/index.js';
import { createCategorizer } from './core/categorization/index.js';
import { createContentProcessor } from './core/content-processing/index.js';
import { createDigestService } from './core/digest/index.js';
import { createFeedbackService } from './core/feedback/index.js';
import { Logger } from './utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * Main demo function
 */
async function runDemo() {
  // Initialize demo output and logger
  const output = new DemoOutput();
  const logger = new Logger('Demo');
  
  try {
    // Initialize Config
    const configPath = process.env.CONFIG_PATH || 'config.demo.json';
    logger.info(`Loading configuration from ${configPath}`);
    Config.initialize({ path: configPath });
    
    // Start the demo
    output.startDemo('Newsletter Management System', 'A walkthrough of key features and capabilities');
    
    // Set up demo sections
    output.setSections([
      {
        title: 'System Setup & Initialization',
        description: 'Setting up the Hypat.ai system and initializing with demo data'
      },
      {
        title: 'Newsletter Detection',
        description: 'Detecting newsletters from emails and calculating confidence scores'
      },
      {
        title: 'Content Processing & Extraction',
        description: 'Extracting and processing content from detected newsletters'
      },
      {
        title: 'Newsletter Categorization',
        description: 'Categorizing newsletters and exploring category relationships'
      },
      {
        title: 'Digest Generation',
        description: 'Generating daily and weekly digests with personalized content'
      },
      {
        title: 'User Feedback & Improvements',
        description: 'Processing user feedback to improve detection and categorization'
      }
    ]);
    
    // Section 1: System Setup & Initialization
    output.startSection(0);
    
    output.setSteps([
      {
        title: 'Initialize Demo Environment',
        description: 'Setting up the database and configuration'
      },
      {
        title: 'Generate Sample Data',
        description: 'Creating users, newsletters, categories, and preferences'
      },
      {
        title: 'Initialize Core Services',
        description: 'Setting up the detection, categorization, content processing, and digest services'
      }
    ]);
    
    // Step 1.1: Initialize Demo Environment
    output.startStep(0);
    
    output.printLoading('Initializing demo environment...');
    const demoSetup = new DemoSetup();
    await demoSetup.initialize();
    output.printSuccess('Demo environment initialized successfully');
    
    // Get repositories and database manager
    const repositoryFactory = demoSetup.getRepositoryFactory();
    
    // Step 1.2: Generate Sample Data
    output.nextStep();
    
    // Get repositories
    const userRepository = repositoryFactory.getSpecializedRepository('UserRepository');
    const newsletterRepository = repositoryFactory.getSpecializedRepository('NewsletterRepository');
    const categoryRepository = repositoryFactory.getSpecializedRepository('CategoryRepository');
    
    // Count entities
    const userCount = await userRepository.count();
    const newsletterCount = await newsletterRepository.count();
    const categoryCount = await categoryRepository.count();
    
    output.printHeading('Sample Data Generated', 2);
    output.printKeyValue('Users', userCount);
    output.printKeyValue('Newsletters', newsletterCount);
    output.printKeyValue('Categories', categoryCount);
    
    // List a few sample users
    const users = await userRepository.find({ limit: 2 });
    output.printHeading('Sample Users', 3);
    output.printTable(users, [
      { key: 'id', header: 'ID' },
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' }
    ]);
    
    // List a few sample categories
    const categories = await categoryRepository.find({ limit: 5 });
    output.printHeading('Sample Categories', 3);
    output.printTable(categories, [
      { key: 'id', header: 'ID', width: 15 },
      { key: 'name', header: 'Name', width: 20 },
      { key: 'description', header: 'Description', width: 40 }
    ]);
    
    // List a few sample newsletters
    const newsletters = await newsletterRepository.find({ limit: 5 });
    output.printHeading('Sample Newsletters', 3);
    output.printTable(newsletters, [
      { key: 'id', header: 'ID', width: 15 },
      { key: 'subject', header: 'Subject', width: 40 },
      { key: 'sender', header: 'Sender', width: 30 },
      { key: 'detectionConfidence', header: 'Confidence', width: 10 }
    ]);
    
    // Step 1.3: Initialize Core Services
    output.nextStep();
    
    output.printLoading('Initializing core services...');
    
    // Initialize core services
    const newsletterDetector = createNewsletterDetector();
    const categorizer = createCategorizer();
    const contentProcessor = createContentProcessor();
    const digestService = createDigestService(contentProcessor, categorizer);
    const feedbackService = createFeedbackService(newsletterDetector);
    
    output.printSuccess('Core services initialized successfully');
    
    // Section 2: Newsletter Detection
    output.nextSection();
    
    output.setSteps([
      {
        title: 'Detect Newsletters with Confidence Scores',
        description: 'Detect newsletters and calculate confidence scores'
      },
      {
        title: 'Detection Metrics and Thresholds',
        description: 'Explore detection metrics and threshold settings'
      },
      {
        title: 'Detection Analysis',
        description: 'Analyze detection results and metrics'
      }
    ]);
    
    // Step 2.1: Detect Newsletters with Confidence Scores
    output.startStep(0);
    
    // Get some newsletters to use for demonstration
    const sampleNewsletters = await newsletterRepository.find({ 
      orderBy: 'detectionConfidence', 
      limit: 8 
    });
    
    output.printHeading('Newsletter Detection Results', 2);
    output.printInfo('Detection uses multiple signals to calculate confidence scores:');
    output.printInfo('- Sender reputation and history');
    output.printInfo('- Email header analysis');
    output.printInfo('- Content structure patterns');
    output.printInfo('- User feedback (when available)');
    
    // Show detection results
    const detectionResults = sampleNewsletters.map(newsletter => ({
      id: newsletter.id,
      subject: newsletter.subject,
      sender: newsletter.sender.split('@')[1], // Just show domain
      confidence: newsletter.detectionConfidence.toFixed(4),
      status: newsletter.detectionConfidence > 0.8 ? 'High Confidence' : 
             newsletter.detectionConfidence > 0.6 ? 'Medium Confidence' : 'Low Confidence',
      verified: newsletter.isVerified ? 'Yes' : 'No'
    }));
    
    output.printTable(detectionResults, [
      { key: 'id', header: 'ID', width: 15 },
      { key: 'subject', header: 'Subject', width: 40 },
      { key: 'sender', header: 'Sender Domain', width: 20 },
      { key: 'confidence', header: 'Confidence', width: 10 },
      { key: 'status', header: 'Status', width: 15 },
      { key: 'verified', header: 'Verified', width: 5 }
    ]);
    
    // Step 2.2: Detection Metrics and Thresholds
    output.nextStep();
    
    output.printHeading('Detection Metrics and Thresholds', 2);
    
    // Calculate some statistics about detection confidence
    const allNewsletters = await newsletterRepository.find();
    
    const confidences = allNewsletters.map(n => n.detectionConfidence);
    const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const minConfidence = Math.min(...confidences);
    const maxConfidence = Math.max(...confidences);
    
    const highConfCount = confidences.filter(c => c > 0.8).length;
    const medConfCount = confidences.filter(c => c >= 0.6 && c <= 0.8).length;
    const lowConfCount = confidences.filter(c => c < 0.6).length;
    
    // Print the metrics
    output.printKeyValue('Average Confidence Score', avgConfidence.toFixed(4));
    output.printKeyValue('Minimum Confidence Score', minConfidence.toFixed(4));
    output.printKeyValue('Maximum Confidence Score', maxConfidence.toFixed(4));
    output.printKeyValue('High Confidence Newsletters', `${highConfCount} (${(highConfCount/confidences.length*100).toFixed(1)}%)`);
    output.printKeyValue('Medium Confidence Newsletters', `${medConfCount} (${(medConfCount/confidences.length*100).toFixed(1)}%)`);
    output.printKeyValue('Low Confidence Newsletters', `${lowConfCount} (${(lowConfCount/confidences.length*100).toFixed(1)}%)`);
    
    // Step 2.3: Detection Analysis
    output.nextStep();
    
    output.printHeading('Detection Analysis', 2);
    
    // Analyze detection per domain
    const domainStats: Record<string, { count: number, avgConfidence: number }> = {};
    
    for (const newsletter of allNewsletters) {
      const domain = newsletter.sender.split('@')[1];
      
      if (!domainStats[domain]) {
        domainStats[domain] = { count: 0, avgConfidence: 0 };
      }
      
      domainStats[domain].count += 1;
      domainStats[domain].avgConfidence += newsletter.detectionConfidence;
    }
    
    // Calculate averages and convert to array for sorting
    const domainStatsArray = Object.entries(domainStats).map(([domain, stats]) => ({
      domain,
      count: stats.count,
      avgConfidence: (stats.avgConfidence / stats.count).toFixed(4)
    }));
    
    // Sort by average confidence (descending)
    domainStatsArray.sort((a, b) => parseFloat(b.avgConfidence) - parseFloat(a.avgConfidence));
    
    // Print the top 5 domains by detection confidence
    output.printHeading('Top Domains by Detection Confidence', 3);
    output.printTable(domainStatsArray.slice(0, 5), [
      { key: 'domain', header: 'Domain', width: 25 },
      { key: 'count', header: 'Count', width: 10 },
      { key: 'avgConfidence', header: 'Avg. Confidence', width: 15 }
    ]);
    
    // Section 3: Content Processing & Extraction
    output.nextSection();
    
    output.setSteps([
      {
        title: 'Content Extraction',
        description: 'Extract content from detected newsletters'
      },
      {
        title: 'Topic Extraction',
        description: 'Extract and analyze topics from newsletter content'
      },
      {
        title: 'Link Extraction',
        description: 'Extract and categorize links from newsletters'
      }
    ]);
    
    // Step 3.1: Content Extraction
    output.startStep(0);
    
    // Get a sample newsletter for content extraction
    const sampleNewsletter = await newsletterRepository.findOne({ 
      orderBy: { field: 'detectionConfidence', direction: 'desc' } 
    });
    
    if (sampleNewsletter) {
      output.printHeading('Content Extraction Example', 2);
      output.printKeyValue('Newsletter ID', sampleNewsletter.id);
      output.printKeyValue('Subject', sampleNewsletter.subject);
      output.printKeyValue('Sender', sampleNewsletter.sender);
      
      // Simulate content extraction
      output.printLoading('Extracting content from newsletter...');
      
      // Extract a snippet of the content
      let contentSnippet = '';
      if (sampleNewsletter.contentText) {
        contentSnippet = sampleNewsletter.contentText.substring(0, 300) + '...';
      }
      
      output.printHeading('Extracted Content Snippet', 3);
      console.log(contentSnippet);
      
      // Generate a structure representation
      const sampleStructure = {
        title: sampleNewsletter.subject,
        sections: [
          { 
            id: 'section-1', 
            title: 'Introduction',
            type: 'header',
            level: 1 
          },
          { 
            id: 'section-2', 
            title: 'Main Content',
            type: 'content',
            level: 1 
          },
          { 
            id: 'section-3', 
            title: 'Further Reading',
            type: 'list',
            level: 1 
          }
        ],
        metadata: {
          author: sampleNewsletter.sender.split('@')[0],
          publisher: sampleNewsletter.sender.split('@')[1],
          publicationDate: sampleNewsletter.receivedDate.toISOString(),
          wordCount: Math.floor(Math.random() * 1000) + 500
        }
      };
      
      output.printHeading('Content Structure', 3);
      output.printObject(sampleStructure, 0, false);
    } else {
      output.printWarning('No sample newsletter found for content extraction');
    }
    
    // Step 3.2: Topic Extraction
    output.nextStep();
    
    if (sampleNewsletter) {
      output.printHeading('Topic Extraction Example', 2);
      
      // Simulate topic extraction
      output.printLoading('Extracting topics from newsletter content...');
      
      // Based on the newsletter metadata, derive sample topics
      const metadata = JSON.parse(sampleNewsletter.metadataJson || '{}');
      const category = metadata.category || 'Technology';
      
      // Create sample topics based on the category
      const sampleTopics = [
        {
          name: category,
          confidence: 0.95,
          keywords: [`${category.toLowerCase()}`, 'industry', 'updates']
        }
      ];
      
      // Add more specific topics based on category
      if (category === 'Technology') {
        sampleTopics.push(
          {
            name: 'Artificial Intelligence',
            confidence: 0.87,
            keywords: ['ai', 'machine learning', 'neural networks', 'algorithms']
          },
          {
            name: 'Cloud Computing',
            confidence: 0.76,
            keywords: ['cloud', 'aws', 'azure', 'infrastructure']
          }
        );
      } else if (category === 'Finance') {
        sampleTopics.push(
          {
            name: 'Investment Strategies',
            confidence: 0.82,
            keywords: ['investment', 'portfolio', 'stocks', 'risk']
          },
          {
            name: 'Market Analysis',
            confidence: 0.79,
            keywords: ['market', 'trends', 'analysis', 'forecast']
          }
        );
      } else if (category === 'Marketing') {
        sampleTopics.push(
          {
            name: 'Content Marketing',
            confidence: 0.88,
            keywords: ['content', 'strategy', 'audience', 'engagement']
          },
          {
            name: 'Social Media',
            confidence: 0.81,
            keywords: ['social', 'platforms', 'engagement', 'campaigns']
          }
        );
      } else {
        // Generic additional topics
        sampleTopics.push(
          {
            name: 'Industry Trends',
            confidence: 0.84,
            keywords: ['trends', 'industry', 'future', 'development']
          },
          {
            name: 'Best Practices',
            confidence: 0.78,
            keywords: ['best practices', 'optimization', 'efficiency', 'improvement']
          }
        );
      }
      
      // Print the topics
      output.printHeading('Extracted Topics', 3);
      output.printTable(sampleTopics, [
        { key: 'name', header: 'Topic', width: 25 },
        { key: 'confidence', header: 'Confidence', width: 15 },
        { key: 'keywords', header: 'Keywords', width: 40 }
      ]);
    } else {
      output.printWarning('No sample newsletter found for topic extraction');
    }
    
    // Step 3.3: Link Extraction
    output.nextStep();
    
    if (sampleNewsletter) {
      output.printHeading('Link Extraction Example', 2);
      
      // Simulate link extraction
      output.printLoading('Extracting links from newsletter content...');
      
      // Based on the newsletter metadata, derive sample links
      const metadata = JSON.parse(sampleNewsletter.metadataJson || '{}');
      const category = metadata.category || 'Technology';
      
      // Create sample links based on the category
      const sampleLinks = [
        {
          url: 'https://example.com/article1',
          text: 'Read the full article',
          category: category,
          isSponsored: false
        },
        {
          url: 'https://example.com/subscribe',
          text: 'Subscribe to our newsletter',
          category: 'Subscription',
          isSponsored: false
        }
      ];
      
      // Add more specific links based on category
      if (category === 'Technology') {
        sampleLinks.push(
          {
            url: 'https://example.com/tech/ai-news',
            text: 'Latest in AI Development',
            category: 'Artificial Intelligence',
            isSponsored: false
          },
          {
            url: 'https://example.com/sponsor/tech-event',
            text: 'Join our upcoming Tech Conference',
            category: 'Events',
            isSponsored: true
          }
        );
      } else if (category === 'Finance') {
        sampleLinks.push(
          {
            url: 'https://example.com/finance/market-report',
            text: 'This Week\'s Market Report',
            category: 'Market Analysis',
            isSponsored: false
          },
          {
            url: 'https://example.com/sponsor/investment-tool',
            text: 'Try our Investment Analysis Platform',
            category: 'Tools',
            isSponsored: true
          }
        );
      } else {
        // Generic additional links
        sampleLinks.push(
          {
            url: 'https://example.com/industry-report',
            text: 'Industry Report 2025',
            category: 'Reports',
            isSponsored: false
          },
          {
            url: 'https://example.com/sponsor/webinar',
            text: 'Register for our Sponsored Webinar',
            category: 'Events',
            isSponsored: true
          }
        );
      }
      
      // Print the links
      output.printHeading('Extracted Links', 3);
      output.printTable(sampleLinks, [
        { key: 'text', header: 'Link Text', width: 30 },
        { key: 'url', header: 'URL', width: 40 },
        { key: 'category', header: 'Category', width: 20 },
        { key: 'isSponsored', header: 'Sponsored', width: 10 }
      ]);
    } else {
      output.printWarning('No sample newsletter found for link extraction');
    }
    
    // Section 4: Newsletter Categorization
    output.nextSection();
    
    output.setSteps([
      {
        title: 'Category System Overview',
        description: 'Explore the categorization system and hierarchy'
      },
      {
        title: 'Automatic Categorization',
        description: 'Demonstrate automatic categorization of newsletters'
      },
      {
        title: 'Category Relationships',
        description: 'Explore category relationships and themes'
      }
    ]);
    
    // Step 4.1: Category System Overview
    output.startStep(0);
    
    output.printHeading('Category System Overview', 2);
    
    // Get all categories
    const allCategories = await categoryRepository.find();
    
    // Separate parent and child categories
    const parentCategories = allCategories.filter(c => !c.parentId);
    const childCategories = allCategories.filter(c => c.parentId);
    
    output.printKeyValue('Total Categories', allCategories.length);
    output.printKeyValue('Parent Categories', parentCategories.length);
    output.printKeyValue('Child Categories', childCategories.length);
    
    // Display parent categories
    output.printHeading('Main Categories', 3);
    output.printTable(parentCategories, [
      { key: 'id', header: 'ID', width: 15 },
      { key: 'name', header: 'Name', width: 20 },
      { key: 'description', header: 'Description', width: 40 }
    ]);
    
    // Display subcategories
    if (childCategories.length > 0) {
      output.printHeading('Subcategories', 3);
      
      // Enhance child categories with parent name
      const childCategoriesWithParent = childCategories.map(child => {
        const parent = parentCategories.find(p => p.id === child.parentId);
        return {
          ...child,
          parentName: parent ? parent.name : 'Unknown'
        };
      });
      
      output.printTable(childCategoriesWithParent, [
        { key: 'id', header: 'ID', width: 15 },
        { key: 'name', header: 'Name', width: 20 },
        { key: 'parentName', header: 'Parent Category', width: 20 },
        { key: 'description', header: 'Description', width: 40 }
      ]);
    }
    
    // Step 4.2: Automatic Categorization
    output.nextStep();
    
    output.printHeading('Automatic Categorization', 2);
    
    // Get category assignment repository
    const categoryAssignmentRepository = repositoryFactory.getSpecializedRepository('CategoryAssignmentRepository');
    
    // Get a sample of category assignments
    const categoryAssignments = await categoryAssignmentRepository.find({ limit: 10 });
    
    // Enhance assignments with newsletter and category info
    const enhancedAssignments = await Promise.all(categoryAssignments.map(async assignment => {
      const newsletter = await newsletterRepository.findById(assignment.newsletterId);
      const category = await categoryRepository.findById(assignment.categoryId);
      
      return {
        id: assignment.id,
        newsletterSubject: newsletter ? newsletter.subject : 'Unknown',
        categoryName: category ? category.name : 'Unknown',
        confidence: assignment.confidence,
        isManual: assignment.isManual
      };
    }));
    
    output.printHeading('Sample Category Assignments', 3);
    output.printTable(enhancedAssignments, [
      { key: 'newsletterSubject', header: 'Newsletter', width: 40 },
      { key: 'categoryName', header: 'Category', width: 20 },
      { key: 'confidence', header: 'Confidence', width: 10 },
      { key: 'isManual', header: 'Manual', width: 10 }
    ]);
    
    // Step 4.3: Category Relationships
    output.nextStep();
    
    output.printHeading('Category Relationships', 2);
    
    // Generate some sample category relationships
    // In a real scenario, these would be derived from newsletter content and categories
    const relationships = [
      { sourceCategory: 'Technology', targetCategory: 'Business', strength: 0.68 },
      { sourceCategory: 'Technology', targetCategory: 'Science', strength: 0.75 },
      { sourceCategory: 'Finance', targetCategory: 'Business', strength: 0.89 },
      { sourceCategory: 'Marketing', targetCategory: 'Business', strength: 0.82 },
      { sourceCategory: 'Science', targetCategory: 'Health', strength: 0.71 },
      { sourceCategory: 'Politics', targetCategory: 'Business', strength: 0.65 }
    ];
    
    output.printHeading('Category Relationships', 3);
    output.printTable(relationships, [
      { key: 'sourceCategory', header: 'Source Category', width: 20 },
      { key: 'targetCategory', header: 'Related Category', width: 20 },
      { key: 'strength', header: 'Relationship Strength', width: 20 }
    ]);
    
    // Display a sample thematic grouping
    const thematicGrouping = [
      {
        theme: 'Digital Transformation',
        categories: ['Technology', 'Business', 'Marketing'],
        relevance: 0.92
      },
      {
        theme: 'Investment & Markets',
        categories: ['Finance', 'Business', 'Economics'],
        relevance: 0.88
      },
      {
        theme: 'Health & Wellness',
        categories: ['Health', 'Science', 'Lifestyle'],
        relevance: 0.85
      }
    ];
    
    output.printHeading('Thematic Groupings', 3);
    output.printTable(thematicGrouping, [
      { key: 'theme', header: 'Theme', width: 25 },
      { key: 'categories', header: 'Categories', width: 40 },
      { key: 'relevance', header: 'Relevance', width: 10 }
    ]);
    
    // Section 5: Digest Generation
    output.nextSection();
    
    output.setSteps([
      {
        title: 'User Preferences',
        description: 'Explore user preferences for digest generation'
      },
      {
        title: 'Daily Digest Generation',
        description: 'Generate a daily digest for a sample user'
      },
      {
        title: 'Weekly Digest Generation',
        description: 'Generate a weekly digest with thematic organization'
      }
    ]);
    
    // Step 5.1: User Preferences
    output.startStep(0);
    
    output.printHeading('User Preferences for Digests', 2);
    
    // Get user preference repository
    const userPreferenceRepository = repositoryFactory.getSpecializedRepository('UserPreferenceRepository');
    
    // Get a sample user
    const sampleUser = users[0];
    
    if (sampleUser) {
      // Get user preferences
      const preferences = await userPreferenceRepository.find({ 
        where: { userId: sampleUser.id } 
      });
      
      // Organize preferences by key
      const preferencesMap: Record<string, string> = {};
      for (const pref of preferences) {
        preferencesMap[pref.preferenceKey] = pref.preferenceValue;
      }
      
      output.printHeading(`Preferences for User: ${sampleUser.name}`, 3);
      
      // Display the preferences in a more readable format
      const readablePreferences = [
        { 
          key: 'Digest Frequency', 
          value: preferencesMap['digest.frequency'] || 'daily' 
        },
        { 
          key: 'Digest Format', 
          value: preferencesMap['digest.format'] || 'standard' 
        },
        { 
          key: 'Delivery Time', 
          value: preferencesMap['digest.deliveryTime'] || '09:00' 
        },
        { 
          key: 'Timezone', 
          value: preferencesMap['digest.timezone'] || 'UTC' 
        }
      ];
      
      // If categories are specified, add them
      if (preferencesMap['digest.categories']) {
        const categoryIds = preferencesMap['digest.categories'].split(',');
        const categoryNames = await Promise.all(categoryIds.map(async id => {
          const category = await categoryRepository.findById(id);
          return category ? category.name : id;
        }));
        
        readablePreferences.push({
          key: 'Preferred Categories',
          value: categoryNames.join(', ')
        });
      }
      
      output.printTable(readablePreferences, [
        { key: 'key', header: 'Preference', width: 25 },
        { key: 'value', header: 'Value', width: 50 }
      ]);
    } else {
      output.printWarning('No sample user found for preference display');
    }
    
    // Step 5.2: Daily Digest Generation
    output.nextStep();
    
    output.printHeading('Daily Digest Generation', 2);
    
    if (sampleUser) {
      output.printLoading(`Generating daily digest for user: ${sampleUser.name}...`);
      
      // In a real implementation, this would call the digest service's generateDailyDigest method
      // For the demo, we'll use a simplified approach
      
      // Get recent newsletters (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentNewsletters = await newsletterRepository.find({
        where: {
          receivedDate: { $gte: yesterday }
        },
        limit: 10
      });
      
      // Generate digest metadata
      const digestId = `digest-${uuidv4()}`;
      const now = new Date();
      const digestMetadata = {
        id: digestId,
        title: `Your Daily Newsletter Digest - ${now.toLocaleDateString()}`,
        userId: sampleUser.id,
        frequency: 'daily',
        startDate: yesterday,
        endDate: now,
        generatedAt: now,
        newsletterCount: recentNewsletters.length
      };
      
      output.printHeading('Daily Digest', 3);
      output.printKeyValue('Digest ID', digestMetadata.id);
      output.printKeyValue('Title', digestMetadata.title);
      output.printKeyValue('Generated At', digestMetadata.generatedAt.toLocaleString());
      output.printKeyValue('Period', `${digestMetadata.startDate.toLocaleDateString()} to ${digestMetadata.endDate.toLocaleDateString()}`);
      output.printKeyValue('Newsletter Count', digestMetadata.newsletterCount);
      
      // Group newsletters by category
      const newslettersByCategory: Record<string, any[]> = {};
      
      for (const newsletter of recentNewsletters) {
        // Get categories for this newsletter
        const assignments = await categoryAssignmentRepository.find({
          where: { newsletterId: newsletter.id }
        });
        
        for (const assignment of assignments) {
          const category = await categoryRepository.findById(assignment.categoryId);
          if (category) {
            if (!newslettersByCategory[category.name]) {
              newslettersByCategory[category.name] = [];
            }
            
            newslettersByCategory[category.name].push({
              id: newsletter.id,
              subject: newsletter.subject,
              sender: newsletter.sender,
              receivedDate: newsletter.receivedDate
            });
          }
        }
      }
      
      // Display digest sections
      output.printHeading('Digest Sections', 3);
      
      for (const [category, newsletters] of Object.entries(newslettersByCategory)) {
        output.printHeading(category, 3);
        
        // Display newsletters in this category
        for (const newsletter of newsletters) {
          console.log(`- ${newsletter.subject} (${newsletter.sender.split('@')[0]}) - ${newsletter.receivedDate.toLocaleDateString()}`);
        }
        
        console.log('');
      }
    } else {
      output.printWarning('No sample user found for digest generation');
    }
    
    // Step 5.3: Weekly Digest Generation
    output.nextStep();
    
    output.printHeading('Weekly Digest Generation', 2);
    
    if (sampleUser) {
      output.printLoading(`Generating weekly digest for user: ${sampleUser.name}...`);
      
      // Get newsletters from the past week
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      const weeklyNewsletters = await newsletterRepository.find({
        where: {
          receivedDate: { $gte: lastWeek }
        },
        limit: 15
      });
      
      // Generate digest metadata
      const digestId = `digest-${uuidv4()}`;
      const now = new Date();
      const digestMetadata = {
        id: digestId,
        title: `Your Weekly Newsletter Digest - Week of ${lastWeek.toLocaleDateString()}`,
        userId: sampleUser.id,
        frequency: 'weekly',
        startDate: lastWeek,
        endDate: now,
        generatedAt: now,
        newsletterCount: weeklyNewsletters.length
      };
      
      output.printHeading('Weekly Digest', 3);
      output.printKeyValue('Digest ID', digestMetadata.id);
      output.printKeyValue('Title', digestMetadata.title);
      output.printKeyValue('Generated At', digestMetadata.generatedAt.toLocaleString());
      output.printKeyValue('Period', `${digestMetadata.startDate.toLocaleDateString()} to ${digestMetadata.endDate.toLocaleDateString()}`);
      output.printKeyValue('Newsletter Count', digestMetadata.newsletterCount);
      
      // For the weekly digest, organize by themes rather than just categories
      const themes = [
        {
          name: 'This Week\'s Top Stories',
          description: 'Most important content from the past week',
          newsletters: weeklyNewsletters.slice(0, 3).map(n => ({
            id: n.id,
            subject: n.subject,
            sender: n.sender,
            receivedDate: n.receivedDate
          }))
        },
        {
          name: 'Technology Insights',
          description: 'Latest developments in technology',
          newsletters: weeklyNewsletters.filter(n => {
            const metadata = JSON.parse(n.metadataJson || '{}');
            return metadata.category === 'Technology';
          }).map(n => ({
            id: n.id,
            subject: n.subject,
            sender: n.sender,
            receivedDate: n.receivedDate
          }))
        },
        {
          name: 'Business & Finance Updates',
          description: 'Important updates in business and finance',
          newsletters: weeklyNewsletters.filter(n => {
            const metadata = JSON.parse(n.metadataJson || '{}');
            return metadata.category === 'Business' || metadata.category === 'Finance';
          }).map(n => ({
            id: n.id,
            subject: n.subject,
            sender: n.sender,
            receivedDate: n.receivedDate
          }))
        }
      ];
      
      // Display digest sections
      output.printHeading('Thematic Digest Sections', 3);
      
      for (const theme of themes) {
        output.printHeading(theme.name, 3);
        output.printInfo(theme.description);
        
        // Display newsletters in this theme
        if (theme.newsletters.length > 0) {
          for (const newsletter of theme.newsletters) {
            console.log(`- ${newsletter.subject} (${newsletter.sender.split('@')[0]}) - ${newsletter.receivedDate.toLocaleDateString()}`);
          }
        } else {
          console.log('No newsletters in this theme.');
        }
        
        console.log('');
      }
    } else {
      output.printWarning('No sample user found for digest generation');
    }
    
    // Section 6: User Feedback & Improvements
    output.nextSection();
    
    output.setSteps([
      {
        title: 'Feedback Collection',
        description: 'Collect and process user feedback on newsletter detection'
      },
      {
        title: 'Detection Improvements',
        description: 'See how user feedback improves detection accuracy'
      },
      {
        title: 'Feedback Analytics',
        description: 'Analyze feedback patterns and metrics'
      }
    ]);
    
    // Step 6.1: Feedback Collection
    output.startStep(0);
    
    output.printHeading('User Feedback Collection', 2);
    
    // Get a newsletter with medium confidence for feedback
    const mediumConfidenceNewsletters = await newsletterRepository.find({
      where: {
        detectionConfidence: { $gte: 0.6, $lt: 0.8 }
      },
      limit: 1
    });
    
    if (mediumConfidenceNewsletters.length > 0) {
      const feedbackNewsletter = mediumConfidenceNewsletters[0];
      
      output.printHeading('Newsletter Requiring Feedback', 3);
      output.printKeyValue('Newsletter ID', feedbackNewsletter.id);
      output.printKeyValue('Subject', feedbackNewsletter.subject);
      output.printKeyValue('Sender', feedbackNewsletter.sender);
      output.printKeyValue('Current Confidence', feedbackNewsletter.detectionConfidence.toFixed(4));
      output.printKeyValue('Status', 'Needs Verification');
      
      // Simulate user feedback (positive in this case)
      output.printHeading('Submitting User Feedback', 3);
      output.printLoading('User confirms this is a newsletter...');
      
      // Record the original confidence
      const originalConfidence = feedbackNewsletter.detectionConfidence;
      
      // Simulate feedback submission
      // In a real implementation, this would call the feedbackService.submitFeedback method
      
      // Update the newsletter with improved confidence
      const improvedConfidence = Math.min(0.95, originalConfidence + 0.2);
      
      await newsletterRepository.update(feedbackNewsletter.id, {
        detectionConfidence: improvedConfidence,
        isVerified: true,
        updatedAt: new Date()
      });
      
      // Get the updated newsletter
      const updatedNewsletter = await newsletterRepository.findById(feedbackNewsletter.id);
      
      if (updatedNewsletter) {
        output.printHeading('Detection Improvement', 3);
        output.printComparison(
          'Detection Confidence',
          originalConfidence.toFixed(4),
          updatedNewsletter.detectionConfidence.toFixed(4),
          true
        );
        output.printSuccess('Feedback successfully applied. Detection confidence improved!');
      }
    } else {
      output.printWarning('No suitable newsletter found for feedback demonstration');
    }
    
    // Step 6.2: Detection Improvements
    output.nextStep();
    
    output.printHeading('Detection Improvements from Feedback', 2);
    
    // Generate some demo statistics about feedback effects
    const feedbackStats = {
      totalFeedback: 25,
      positiveConfirmations: 18,
      negativeRejections: 7,
      averageConfidenceImprovement: 0.15,
      accuracyBefore: 0.78,
      accuracyAfter: 0.92
    };
    
    output.printKeyValue('Total Feedback Submissions', feedbackStats.totalFeedback);
    output.printKeyValue('Positive Confirmations', feedbackStats.positiveConfirmations);
    output.printKeyValue('Negative Rejections', feedbackStats.negativeRejections);
    output.printKeyValue('Average Confidence Improvement', feedbackStats.averageConfidenceImprovement.toFixed(4));
    
    output.printHeading('Accuracy Improvements', 3);
    output.printComparison(
      'Detection Accuracy',
      (feedbackStats.accuracyBefore * 100).toFixed(1) + '%',
      (feedbackStats.accuracyAfter * 100).toFixed(1) + '%',
      true
    );
    
    // Show a chart of accuracy improvement over time using ASCII art
    output.printHeading('Accuracy Trend', 3);
    console.log('     |                                 *');
    console.log('     |                           *     |');
    console.log('     |                      *          |');
    console.log('  90%|                 *               |');
    console.log('     |           *                     |');
    console.log('     |       *                         |');
    console.log('     |   *                             |');
    console.log('  80%| *                               |');
    console.log('     |                                 |');
    console.log('     *---------------------------------*');
    console.log('       Initial    Week 1    Week 2    Now');
    
    // Step 6.3: Feedback Analytics
    output.nextStep();
    
    output.printHeading('Feedback Analytics', 2);
    
    // Generate sample domain-based feedback analysis
    const domainFeedbackStats = [
      { domain: 'substack.com', confirms: 12, rejects: 2, accuracy: 0.94 },
      { domain: 'beehiiv.com', confirms: 8, rejects: 1, accuracy: 0.92 },
      { domain: 'mailchimp.com', confirms: 6, rejects: 3, accuracy: 0.86 },
      { domain: 'medium.com', confirms: 5, rejects: 4, accuracy: 0.78 },
      { domain: 'convertkit.com', confirms: 9, rejects: 0, accuracy: 0.98 }
    ];
    
    output.printHeading('Feedback by Domain', 3);
    output.printTable(domainFeedbackStats, [
      { key: 'domain', header: 'Domain', width: 20 },
      { key: 'confirms', header: 'Confirms', width: 10 },
      { key: 'rejects', header: 'Rejects', width: 10 },
      { key: 'accuracy', header: 'Accuracy', width: 10 }
    ]);
    
    // Generate sample content pattern feedback analysis
    const contentPatternStats = [
      { pattern: 'Unsubscribe link present', confirms: 22, accuracy: 0.95 },
      { pattern: 'Multiple outbound links', confirms: 19, accuracy: 0.92 },
      { pattern: 'Consistent sender name', confirms: 18, accuracy: 0.90 },
      { pattern: 'HTML-rich content', confirms: 17, accuracy: 0.88 },
      { pattern: 'Regular sending pattern', confirms: 16, accuracy: 0.85 }
    ];
    
    output.printHeading('Content Patterns Analysis', 3);
    output.printTable(contentPatternStats, [
      { key: 'pattern', header: 'Content Pattern', width: 30 },
      { key: 'confirms', header: 'Confirmations', width: 15 },
      { key: 'accuracy', header: 'Predictive Accuracy', width: 20 }
    ]);
    
    // End the demo
    output.endDemo('Hypat.ai demo completed successfully!');
    
    // Clean up resources
    await demoSetup.cleanup();
  } catch (error) {
    logger.error(`Error running demo: ${error instanceof Error ? error.message : String(error)}`);
    console.error('Demo failed with an error:', error);
    
    process.exit(1);
  }
}

// Run the demo
runDemo().catch(error => {
  console.error('Fatal error running demo:', error);
  process.exit(1);
});