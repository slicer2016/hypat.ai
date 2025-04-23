# Hypat.ai

Hypat.ai is a specialized Model Context Protocol (MCP) server that transforms newsletter emails into an organized knowledge system. It's built on top of the GongRzhe/Gmail-MCP-Server and designed for knowledge workers who subscribe to multiple newsletters.

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