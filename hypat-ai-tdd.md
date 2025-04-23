# Hypat.ai
## Technical Design Document (TDD)

**Document Version:** 1.0  
**Last Updated:** April 23, 2025  
**Status:** Draft

## 1. System Architecture Overview

Hypat.ai is designed as a layered application that builds upon the GongRzhe/Gmail-MCP-Server. The system consists of several key components arranged in a modular, extensible architecture:

```
┌─────────────────────────────────────────────────┐
│ Client Layer                                    │
│ ┌─────────────┐ ┌──────────────────────────┐   │
│ │Claude/AI    │ │ Email Digest Recipients  │   │
│ └─────────────┘ └──────────────────────────┘   │
└─────────────────────────────────────────────────┘
                    ▲
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ Hypat.ai Core                                   │
│ ┌─────────────┐ ┌──────────────┐ ┌────────────┐ │
│ │ MCP Tools   │ │MCP Resources │ │MCP Prompts │ │
│ └─────────────┘ └──────────────┘ └────────────┘ │
│ ┌─────────────┐ ┌──────────────┐ ┌────────────┐ │
│ │Newsletter   │ │Content       │ │Analytics   │ │
│ │Detector     │ │Processor     │ │Engine      │ │
│ └─────────────┘ └──────────────┘ └────────────┘ │
│ ┌─────────────┐ ┌──────────────┐ ┌────────────┐ │
│ │Email Digest │ │Verification  │ │User        │ │
│ │Generator    │ │System        │ │Feedback    │ │
│ └─────────────┘ └──────────────┘ └────────────┘ │
└─────────────────────────────────────────────────┘
                    ▲
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ Base Gmail MCP Server                           │
│ ┌─────────────┐ ┌──────────────┐ ┌────────────┐ │
│ │Gmail Tools  │ │Gmail Auth    │ │Gmail API   │ │
│ └─────────────┘ └──────────────┘ └────────────┘ │
└─────────────────────────────────────────────────┘
                    ▲
                    │
                    ▼
┌─────────────────────────────────────────────────┐
│ Data Layer                                      │
│ ┌─────────────┐ ┌──────────────┐ ┌────────────┐ │
│ │ SQLite DB   │ │ Repository   │ │ Services   │ │
│ │             │ │ Pattern      │ │            │ │
│ └─────────────┘ └──────────────┘ └────────────┘ │
└─────────────────────────────────────────────────┘
```

## 2. Core Modules

### 2.1 MCP Server Module

**Purpose**: Implements Model Context Protocol server functionality, handling tools, resources, and prompts.

**Responsibilities**:
- Initialize and manage MCP server instance
- Register and expose tools for newsletter operations
- Process incoming tool calls from Claude
- Manage resources and prompts
- Handle communication with Gmail MCP Server

**Key Components**:
- `McpServerManager`: Initializes and manages the MCP server instance
- `ToolRegistry`: Registers and manages MCP tools
- `ResourceRegistry`: Manages MCP resources
- `PromptRegistry`: Manages MCP prompts
- `GmailMcpClient`: Communicates with Gmail MCP Server

### 2.2 Newsletter Detection Module

**Purpose**: Identify newsletter emails among regular emails with configurable confidence thresholds.

**Responsibilities**:
- Analyze email headers to identify newsletters
- Examine email content structure for newsletter patterns
- Track and utilize sender reputation for newsletter identification
- Integrate with user feedback to improve accuracy
- Apply confidence scoring to detection results

**Key Components**:
- `HeaderAnalyzer`: Analyzes email headers for newsletter indicators
- `ContentStructureAnalyzer`: Examines email content for newsletter patterns
- `SenderReputationTracker`: Maintains database of newsletter senders
- `DetectionConfidenceCalculator`: Calculates overall confidence score
- `UserFeedbackIntegrator`: Incorporates user feedback into detection

### 2.3 Content Processing Module

**Purpose**: Extract and analyze content from newsletter emails.

**Responsibilities**:
- Extract meaningful content from HTML newsletters
- Parse newsletter structure to identify sections
- Extract links and resources
- Identify key topics and themes
- Store processed content for retrieval

**Key Components**:
- `HtmlContentExtractor`: Extracts main content from HTML emails
- `NewsletterStructureParser`: Identifies sections in newsletters
- `LinkExtractor`: Extracts and categorizes links
- `TopicExtractor`: Identifies key topics in newsletter content
- `ContentRepository`: Stores processed content

### 2.4 Categorization Module

**Purpose**: Organize newsletters into categories and themes.

**Responsibilities**:
- Apply categorization algorithms to newsletter content
- Maintain category taxonomy
- Track themes across multiple newsletters
- Allow for manual categorization
- Generate relationships between categories

**Key Components**:
- `CategoryManager`: Manages category taxonomy
- `ThemeDetector`: Identifies themes in newsletter content
- `CategoryMatcher`: Matches newsletters to categories
- `RelationshipGenerator`: Creates relationships between categories
- `ManualCategorizationHandler`: Processes manual categorization

### 2.5 Email Digest Module

**Purpose**: Generate and deliver email digests of newsletter content.

**Responsibilities**:
- Generate daily and weekly digests
- Create HTML email templates
- Schedule and send emails
- Track email delivery
- Handle user preferences for digests

**Key Components**:
- `DigestGenerator`: Creates digest content
- `EmailTemplateRenderer`: Renders HTML email templates
- `EmailDeliveryScheduler`: Schedules email delivery
- `EmailSender`: Sends emails
- `DeliveryTracker`: Tracks email delivery status
- `UserPreferenceManager`: Manages user preferences for digests

### 2.6 User Feedback Module

**Purpose**: Collect and utilize user feedback to improve system accuracy.

**Responsibilities**:
- Collect user feedback on newsletter detection
- Track user preferences for senders and domains
- Generate verification requests
- Apply feedback to improve detection
- Maintain feedback database

**Key Components**:
- `FeedbackCollector`: Collects user feedback
- `VerificationRequestGenerator`: Creates verification requests
- `FeedbackAnalyzer`: Analyzes feedback patterns
- `DetectionImprover`: Applies feedback to improve detection
- `FeedbackRepository`: Stores user feedback

### 2.7 Data Access Module

**Purpose**: Provide structured access to system data.

**Responsibilities**:
- Manage database connections
- Implement repository pattern for data access
- Handle data migrations
- Provide caching mechanism
- Maintain data integrity

**Key Components**:
- `DatabaseManager`: Manages database connections
- `RepositoryFactory`: Creates repository instances
- `MigrationManager`: Handles database migrations
- `CacheManager`: Provides caching functionality
- `DataIntegrityValidator`: Validates data integrity

## 3. Database Schema

The system will use SQLite with a structured schema including:

- **User Management Tables**: For user authentication and preferences
- **Newsletter Tables**: For storing newsletter metadata and content
- **Categorization Tables**: For organizing newsletters into categories
- **Feedback Tables**: For tracking user feedback and verification
- **Digest Tables**: For managing digest generation and delivery
- **Analytics Tables**: For tracking system usage and performance

## 4. Key Interfaces

### 4.1 Gmail MCP Interface

Communicates with GongRzhe/Gmail-MCP-Server to access Gmail data:

```
interface GmailMcpClient {
  connect(): Promise<void>;
  searchEmails(query: string, options: SearchOptions): Promise<Email[]>;
  getEmail(id: string, options: GetEmailOptions): Promise<Email>;
  disconnect(): Promise<void>;
}
```

### 4.2 Newsletter Detection Interface

Identifies newsletters with confidence scoring:

```
interface NewsletterDetector {
  detectNewsletter(email: Email, userFeedback?: UserFeedback): Promise<DetectionResult>;
  getConfidenceScore(email: Email, methods: DetectionMethod[]): number;
  needsVerification(detectionResult: DetectionResult): boolean;
}
```

### 4.3 Content Processor Interface

Extracts and processes newsletter content:

```
interface ContentProcessor {
  extractContent(email: Email): Promise<ExtractedContent>;
  parseStructure(content: string): NewsletterStructure;
  extractLinks(content: string): Link[];
  extractTopics(content: string): Topic[];
}
```

### 4.4 Categorization Interface

Categorizes newsletters by content:

```
interface Categorizer {
  categorizeNewsletter(content: ExtractedContent): Promise<Category[]>;
  getCategories(userId: string): Promise<Category[]>;
  addCategory(category: Category): Promise<void>;
  linkNewsletterToCategory(newsletterId: string, categoryId: string, confidence: number): Promise<void>;
}
```

### 4.5 Email Digest Interface

Generates and sends email digests:

```
interface DigestService {
  generateDailyDigest(userId: string): Promise<Digest>;
  generateWeeklyDigest(userId: string): Promise<Digest>;
  renderEmailTemplate(digest: Digest, template: string): string;
  sendEmail(to: string, subject: string, content: string): Promise<void>;
  scheduleDigests(): void;
}
```

### 4.6 User Feedback Interface

Manages user feedback on newsletter detection:

```
interface FeedbackService {
  getUserFeedback(userId: string): Promise<UserFeedback>;
  addUserFeedback(feedback: FeedbackInput): Promise<void>;
  generateVerificationRequest(newsletters: Newsletter[]): Promise<VerificationRequest>;
  applyFeedbackToDetection(feedback: UserFeedback, detector: NewsletterDetector): void;
}
```

## 5. Implementation Strategies

### 5.1 Newsletter Detection Strategy

Multiple detection techniques with weighted confidence scoring:

1. **Header-Based Detection**:
   - Check for List-Unsubscribe headers
   - Identify newsletter-specific X-headers
   - Analyze sender patterns

2. **Content Structure Analysis**:
   - Identify templated layouts
   - Detect newsletter-specific elements
   - Analyze content patterns

3. **Sender Reputation**:
   - Track known newsletter senders
   - Analyze domain reputation
   - Utilize user feedback history

4. **Combined Confidence Calculation**:
   - Weight each detection method
   - Calculate overall confidence score
   - Apply verification threshold

### 5.2 Content Extraction Strategy

Content extraction focused on preserving newsletter structure:

1. **HTML Processing**:
   - Remove unnecessary elements
   - Identify main content area
   - Preserve important formatting

2. **Structure Identification**:
   - Detect headings and sections
   - Identify important content blocks
   - Extract metadata

3. **Resource Extraction**:
   - Extract and categorize links
   - Identify and store images
   - Process embedded content

### 5.3 Categorization Strategy

Multi-faceted categorization approach:

1. **Text Analysis**:
   - Extract keywords using TF-IDF
   - Identify entities and concepts
   - Analyze text sentiment

2. **Taxonomy Matching**:
   - Match content to predefined categories
   - Calculate relevance scores
   - Identify multiple applicable categories

3. **Learning from User Feedback**:
   - Adjust categorization based on user input
   - Learn from manual categorization
   - Refine category models over time

### 5.4 Email Delivery Strategy

Reliable email delivery with tracking:

1. **Template-Based Generation**:
   - MJML responsive email templates
   - Dynamic content rendering
   - Consistent branding elements

2. **Scheduled Delivery**:
   - User-configurable schedules
   - Time zone awareness
   - Optimal delivery time analysis

3. **Delivery Tracking**:
   - Track email open rates
   - Monitor link clicks
   - Adjust delivery strategy based on engagement

## 6. Testing Strategy

### 6.1 Unit Testing

- Test each module in isolation with mock dependencies
- Focus on core algorithms and business logic
- Achieve high code coverage for critical components
- Use dependency injection for testability

### 6.2 Integration Testing

- Test interaction between modules
- Verify data flow between components
- Test with real database but mock external services
- Focus on boundary conditions and error handling

### 6.3 End-to-End Testing

- Test complete workflows from email detection to digest delivery
- Verify MCP tool interactions with Claude
- Test email template rendering and delivery
- Verify user feedback integration

### 6.4 Performance Testing

- Test system with large email volumes
- Measure and optimize detection accuracy
- Benchmark content processing performance
- Verify scalability of database operations

## 7. Deployment Strategy

### 7.1 Local Deployment

- Packaged as a Claude Desktop MCP server
- Simple installation process with minimal dependencies
- Local SQLite database for data storage
- User-configurable settings

### 7.2 Configuration Management

- Store configuration in standard locations
- Support for environment variables
- User-editable configuration files
- Secure credential storage

### 7.3 Updates and Maintenance

- Version checking and update notification
- Simple update process
- Database migration support
- Configuration preservation during updates

## 8. Future Technical Considerations

### 8.1 Machine Learning Integration

- Train models on collected detection data
- Personalize detection based on user feedback
- Improve categorization with learning algorithms
- Enhance content extraction with ML

### 8.2 Scalability Considerations

- Support for multiple email accounts
- Optimization for large newsletter volumes
- Improved database indexing and querying
- Background processing for heavy operations

### 8.3 Advanced Analytics

- User engagement tracking
- Newsletter content trend analysis
- Topic evolution over time
- Interest prediction and recommendation

### 8.4 Integration Expansion

- Support for additional email providers
- Integration with other MCP servers
- API for third-party integrations
- Mobile app synchronization