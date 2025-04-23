# Hypat.ai

Hypat.ai is a specialized Model Context Protocol (MCP) server that transforms newsletter emails into an organized knowledge system. It's built on top of the GongRzhe/Gmail-MCP-Server and designed for knowledge workers who subscribe to multiple newsletters.

The system consists of multiple modules:

1. **Newsletter Detection Module**: Identifies if an email is a newsletter
2. **Content Processing Module**: Extracts and processes content from newsletters
3. **Categorization Module**: Organizes newsletters into categories and topics
4. **Email Digest Module**: Generates and delivers email digests of newsletter content
5. **User Feedback Module**: Collects and processes user feedback to improve detection

## Email Digest Module

The Email Digest Module is responsible for generating and delivering email digests of newsletter content. It provides the following features:

- Generate daily, weekly, and custom digests of newsletter content
- Create responsive HTML email templates using MJML
- Schedule digest deliveries with time zone awareness
- Send emails with tracking capabilities
- Track email opens and clicks
- Manage user preferences for digest delivery

### Architecture

The Email Digest Module is built using a modular, component-based architecture:

- **DigestGenerator**: Creates digest content from newsletter data
- **EmailTemplateRenderer**: Renders digest content using MJML templates
- **EmailDeliveryScheduler**: Schedules email deliveries with time zone awareness
- **EmailSender**: Sends emails using nodemailer
- **DeliveryTracker**: Tracks email delivery status, opens, and clicks
- **UserPreferenceManager**: Manages user preferences for digest delivery
- **DigestService**: Orchestrates all digest components

### Usage

To use the Email Digest Module, you need to initialize the components and wire them up:

```typescript
import { createDigestService } from 'hypat.ai';

// Create the digest service with all components wired up
const digestService = createDigestService(
  contentProcessor, // Your ContentProcessor implementation
  categorizer,      // Your Categorizer implementation
  {
    // SMTP configuration for email sending
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'user@example.com',
      pass: 'password'
    }
  }
);

// Start scheduling digests
digestService.scheduleDigests();
```

### Templates

The Email Digest Module uses MJML templates for creating responsive HTML emails. The module comes with several built-in templates:

- **daily-standard**: Standard daily digest template
- **weekly-standard**: Standard weekly digest template
- **verification**: Email verification template

You can add your own templates by placing them in the `src/core/digest/templates` directory.

### Customization

The Email Digest Module can be customized in several ways:

- **Templates**: Create custom MJML templates for different digest formats
- **Frequency**: Configure digest frequency (daily, weekly, bi-weekly, monthly)
- **Format**: Configure digest format (brief, standard, detailed)
- **Categories**: Include/exclude specific categories in digests
- **Newsletters**: Include/exclude specific newsletters in digests

## User Feedback Module

The User Feedback Module is responsible for collecting and processing user feedback on newsletter detection. It provides the following features:

- Collect user feedback on newsletter detection
- Generate verification requests for uncertain detections
- Analyze feedback patterns to identify improvements
- Apply feedback to improve detection accuracy
- Track user preferences for senders and domains

### Architecture

The User Feedback Module is built using a modular, component-based architecture:

- **FeedbackCollector**: Collects and processes user feedback
- **VerificationRequestGenerator**: Generates verification requests for uncertain detections
- **FeedbackAnalyzer**: Analyzes feedback patterns and generates insights
- **DetectionImprover**: Applies feedback to improve detection
- **FeedbackRepository**: Stores and retrieves feedback data
- **FeedbackService**: Orchestrates all feedback components

### Usage

To use the User Feedback Module, you need to initialize the components and wire them up:

```typescript
import { createFeedbackService } from 'hypat.ai';

// Create the feedback service with all components wired up
const feedbackService = createFeedbackService(
  newsletterDetector, // Your NewsletterDetector implementation (optional)
  {
    verificationExpiryDays: 7,
    maxResendCount: 3,
    verificationBaseUrl: 'https://hypat.ai/verify'
  }
);

// Submit feedback for an email
await feedbackService.submitFeedback('user-1', 'email-1', true);

// Get feedback statistics for a user
const stats = await feedbackService.getFeedbackStats('user-1');
```

### Verification Process

The User Feedback Module includes a verification process for handling uncertain detections:

1. When a newsletter is detected with low confidence, a verification request is generated
2. The user receives an email asking them to verify if the email is a newsletter
3. The user clicks a link to confirm or reject the classification
4. The feedback is collected and used to improve detection
5. Verification requests expire after a configurable period

## Development

### Prerequisites

- Node.js 18 or higher
- npm 7 or higher

### Installation

```bash
npm install
```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Type Checking

```bash
npm run typecheck
```

## License

ISC