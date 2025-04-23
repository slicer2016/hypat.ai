# Hypat.ai
## Product Requirements Document (PRD)

**Document Version:** 1.0  
**Last Updated:** April 23, 2025  
**Status:** Draft

## Executive Summary

Hypat.ai is a specialized Model Context Protocol (MCP) server built on top of the GongRzhe/Gmail-MCP-Server that transforms newsletter emails into an organized knowledge system. The system identifies, categorizes, and extracts key information from newsletters, automatically delivering curated digests via email while allowing AI assistants like Claude to help users track, connect, and gain insights from their newsletter subscriptions.

## 1. Problem Statement

### 1.1 Current Challenges
- Newsletter content is scattered across crowded inboxes, making it difficult to organize and retrieve
- Valuable insights from newsletters are often lost or forgotten after initial reading
- No system exists to automatically categorize newsletters by theme or identify connections between them
- Users struggle to keep up with high newsletter volume, resulting in information overload
- Existing email management tools don't distinguish between newsletters and other types of email

### 1.2 Target User
Knowledge workers who subscribe to multiple newsletters and want to:
- Organize newsletter content by theme
- Receive daily and weekly email digests of newsletter content
- Discover connections between newsletter content
- Build a searchable knowledge base from newsletter insights
- Save time by having newsletters automatically identified and processed

## 2. Product Overview

### 2.1 Vision
Hypat.ai transforms scattered newsletter emails into a structured knowledge system that grows with the user, creating a unified repository of insights that would otherwise be lost in the inbox.

### 2.2 Core Value Proposition
"Never lose insights from your newsletters again – automatically identify, organize, summarize, and connect newsletter content from your Gmail account, delivered as convenient daily and weekly digests."

### 2.3 Key Features

1. **Newsletter Identification**
   - Automatically identify newsletter emails among regular emails
   - Recognize common newsletter patterns and structures
   - Support for identifying newsletters from popular platforms
   - User-configurable newsletter source identification

2. **Content Extraction & Processing**
   - Extract main content from newsletter HTML
   - Parse important sections and links
   - Identify key topics and themes
   - Store structured content for retrieval and analysis

3. **Smart Categorization**
   - Automatically categorize newsletters by theme
   - Create a tagging system for newsletter content
   - Generate concept maps connecting newsletter topics
   - Allow manual tagging and categorization

4. **Digest Generation & Delivery**
   - Create daily email digests of new newsletter content
   - Generate weekly thematic email digests across newsletters
   - Highlight important insights and trending topics
   - Include direct links to original content
   - Configurable delivery schedule and format preferences

5. **Knowledge Base Access**
   - Search across all processed newsletters via Claude
   - Filter by category, date, source, or theme
   - Create connections between related newsletter items
   - Generate insights based on content patterns

## 3. Technical Requirements

### 3.1 System Architecture

1. **Base Layer: Gmail MCP Server**
   - Utilize GongRzhe/Gmail-MCP-Server for Gmail API integration
   - Leverage existing authentication and email retrieval functionality
   - Use existing search and filtering capabilities

2. **Newsletter Processing Layer**
   - Newsletter detection engine
   - Content extraction framework
   - Text processing and analysis system
   - Categorization algorithm
   - Storage and indexing system

3. **Analytics Layer**
   - Theme detection and tracking
   - Connection identification
   - Trend analysis
   - Insight generation

4. **Email Delivery Layer**
   - Digest generation system
   - Email templating system
   - Scheduled delivery system
   - Verification request system

### 3.2 Newsletter Identification Methods

The system will employ multiple techniques to identify newsletter emails, with an iterative approach to improve accuracy:

1. **Initial Detection Phase**
   - **Header Analysis**
     - Look for the presence of `List-Unsubscribe` headers
     - Check for newsletter-specific X-headers from popular platforms
     - Analyze sender patterns (no-reply@, newsletter@, etc.)
   - **Content Structure Analysis**
     - Identify common newsletter layouts and templates
     - Detect recurring structural elements (mastheads, footers)
     - Recognize templated content sections
   - **Sender Pattern Recognition**
     - Build a database of known newsletter senders
     - Identify common newsletter sending domains
     - Track user's subscription patterns

2. **User Verification Phase**
   - Present identified newsletters to the user for confirmation
   - Allow users to select which detected newsletters to include in their knowledge base
   - Provide options to mark false positives and false negatives
   - Support for bulk selection/deselection of newsletters

3. **Learning & Improvement Phase**
   - Record user feedback on detection accuracy
   - Build a personalized newsletter identification model
   - Continuously refine detection algorithms based on user interactions
   - Track preferences for specific senders or newsletter types

### 3.3 Database Schema

The system will use SQLite database with tables for:
- Newsletters and newsletter content
- Categories and newsletter-category relationships
- Entities and topics extracted from newsletters
- User feedback and preferences
- Digest generation and tracking
- Email delivery status

### 3.4 MCP Capabilities

#### 3.4.1 Tools

1. **GetNewsletters**
   - Retrieve newsletters from Gmail
   - Parameters: time range, newsletter sources, limit, categories
   - Returns: processed newsletter content with metadata

2. **CategorizeNewsletter**
   - Manually categorize a newsletter
   - Parameters: newsletter ID, categories
   - Returns: updated categorization

3. **SearchNewsletters**
   - Search across processed newsletter content
   - Parameters: query, categories, date range, sources
   - Returns: matching content with relevance scores

4. **GenerateDigest**
   - Create a thematic digest of newsletter content
   - Parameters: time period, categories, detail level, format
   - Returns: formatted digest with thematic organization

5. **GetCategories**
   - Retrieve available newsletter categories
   - Parameters: parent category (optional)
   - Returns: list of categories with descriptions

6. **GetNewsletterSources**
   - Retrieve list of identified newsletter sources
   - Parameters: none
   - Returns: list of sources with details

7. **VerifyNewsletters**
   - Present detected newsletters to user for verification
   - Parameters: detection results with confidence scores, limit
   - Returns: interface for user selection/confirmation

8. **UpdateNewsletterFeedback**
   - Record user feedback on newsletter detection
   - Parameters: newsletter IDs, user actions (confirm/reject)
   - Returns: confirmation of feedback registration

9. **ConfigureDigestDelivery**
   - Set up email digest delivery preferences
   - Parameters: frequency (daily/weekly/both), delivery time, format preferences
   - Returns: confirmation of preference settings

10. **SendDigestEmail**
    - Send digest email to the user
    - Parameters: digest ID, email address, format
    - Returns: confirmation of email delivery

#### 3.4.2 Resources

1. **NewsletterLibrary**
   - Complete catalog of processed newsletters
   - Includes metadata, extracted content, and categorization

2. **ThemeMap**
   - Visual representation of newsletter themes
   - Shows relationships between topics and content items

3. **SourceAnalytics**
   - Statistics about newsletter sources
   - Frequency, volume, and engagement metrics

#### 3.4.3 Prompts

1. **NewsletterAnalysis**
   - Template for analyzing newsletter content
   - Includes questions about key takeaways, connections, etc.

2. **ThemeExploration**
   - Template for exploring specific themes
   - Helps identify trends and patterns in newsletter content

## 4. User Experience

### 4.1 Key User Journeys

**Journey 1: Initial Setup**
1. User installs Hypat.ai
2. User authenticates with Gmail using existing Gmail MCP server OAuth process
3. System begins scanning email for newsletters and categorizing them
4. User reviews and verifies detected newsletters
5. User configures digest delivery preferences (frequency, timing, format)
6. Initial knowledge base is created from newsletter history
7. User receives first daily digest email of newsletter content

**Journey 2: Daily Interaction**
1. User receives new newsletters in Gmail
2. System automatically processes new newsletters
3. System prepares a daily digest email
4. User receives the daily digest email at configured time
5. User can click through from digest to original newsletters
6. User occasionally receives verification requests for uncertain newsletter detections
7. User can ask Claude questions about their newsletter content

**Journey 3: Weekly Review**
1. System generates a comprehensive weekly thematic digest
2. User receives the weekly digest email with content organized by topic
3. System highlights connections between content pieces
4. User can explore detailed insights by clicking through to Claude
5. System suggests related content based on interests and patterns

### 4.2 Integration Points

1. **Gmail Integration**
   - Gmail MCP Server handles authentication and email access
   - Hypat.ai utilizes Gmail API via the base MCP server

2. **Claude AI Integration**
   - MCP provides tools for Claude to access and analyze newsletters
   - Claude can generate insights and summaries using newsletter content
   - Claude provides natural language interface for system configuration

3. **Email Delivery System**
   - Automated digest emails sent to user's preferred email address
   - Verification requests sent via email for user confirmation
   - HTML email templates with responsive design for all devices

### 4.3 Digest Email Design

1. **Daily Digest Email**
   - Header with date and newsletter count
   - Summary section with key statistics
   - Content organized by themes/categories
   - Brief excerpts with links to original newsletters
   - Visual indicators for trending topics
   - Clean, scannable layout optimized for quick reading

2. **Weekly Digest Email**
   - More comprehensive overview of the week
   - Thematic organization with topic summaries
   - Trend indicators showing momentum across topics
   - Content connections and relationships
   - Visual data representations where appropriate
   - Links to explore topics further through Claude

## 5. Implementation Plan

### 5.1 Phase 1: Core Functionality (Weekend Project)

**Day 1 (Saturday)**
- Set up Gmail MCP Server integration
- Implement initial newsletter detection algorithms
- Create user validation mechanism for detected newsletters
- Develop SQLite database schema with feedback tracking capability
- Build basic API endpoints including verification interface
- Create simple email templates for digests

**Day 2 (Sunday)**
- Implement basic content extraction framework
- Develop simple categorization system
- Create basic search functionality
- Implement digest generation
- Set up email delivery system for digest emails
- Develop email verification request system
- Test with sample newsletter content
- Finalize MCP tools and resources

### 5.2 Phase 2: Iterative Improvement (Post-Weekend)

- Analyze detection performance and user feedback
- Refine newsletter detection algorithms based on initial findings
- Enhance content extraction quality
- Improve categorization system
- Enhance digest email designs with improved visual elements
- Implement user preference management for digest emails
- Add personalization based on user interaction patterns

### 5.3 Phase 3: Advanced Features (Long-term)

- Implement machine learning for newsletter detection based on collected feedback
- Create personalized detection models per user
- Develop web dashboard interface (optional supplement to email delivery)
- Add collaborative filtering for recommendations
- Implement cross-user insights (anonymized)
- Enhance email digests with interactive elements

## 6. Success Metrics

### 6.1 Technical Metrics
- Newsletter detection accuracy (>90%)
- Content extraction quality (>85% of valuable content preserved)
- Categorization precision (>80% accuracy)
- System performance (processing time <30s per newsletter)

### 6.2 User Metrics
- Time saved reviewing newsletters (target: 30+ minutes per week)
- Knowledge retention improvement
- Newsletter insights discovered
- System usage frequency (target: daily)

## 7. Limitations and Considerations

### 7.1 Technical Limitations
- Initial newsletter detection may have false positives and false negatives
- Varied newsletter formats may challenge content extraction
- Category detection accuracy dependent on content clarity
- Initial setup requires Gmail authentication
- Processing complex newsletters with multiple sections may be challenging

### 7.2 Privacy Considerations
- All data stored locally by default
- Email access limited to newsletter content only
- No content shared with third parties
- Transparent data handling policies

### 7.3 User Experience Considerations
- Balancing automation with user control for newsletter identification
- Finding appropriate frequency for verification requests
- Preventing user fatigue from excessive validation requests
- Ensuring interface clarity when presenting newsletters for verification

## 8. Future Enhancements

- Integration with additional email providers
- Mobile application for on-the-go access
- Advanced knowledge graph visualization
- Collaboration and sharing features
- AI-powered content recommendations
- Integration with note-taking systems