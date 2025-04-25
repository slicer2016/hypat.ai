# Hypat.ai

![Hypat.ai Logo](docs/images/hypat-logo.png)

Hypat.ai is a specialized Model Context Protocol (MCP) server that transforms newsletter emails into an organized knowledge system. It's built on top of the GongRzhe/Gmail-MCP-Server and designed for knowledge workers who subscribe to multiple newsletters.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/slicer2016/hypat.ai/actions/workflows/test.yml/badge.svg)](https://github.com/slicer2016/hypat.ai/actions/workflows/test.yml)
[![npm version](https://badge.fury.io/js/hypat.ai.svg)](https://www.npmjs.com/package/hypat.ai)

## Overview

Hypat.ai helps you manage newsletter overload by automatically identifying, categorizing, and digesting your newsletter subscriptions. It extracts valuable content and delivers personalized digests based on your preferences.

The system consists of multiple modules:

1. **Newsletter Detection Module**: Identifies if an email is a newsletter
2. **Content Processing Module**: Extracts and processes content from newsletters
3. **Categorization Module**: Organizes newsletters into categories and topics
4. **Email Digest Module**: Generates and delivers email digests of newsletter content
5. **User Feedback Module**: Collects and processes user feedback to improve detection

## Features

- **Automatic Newsletter Detection**: Identify newsletters in your email inbox
- **Content Extraction**: Extract and process content from newsletters
- **Smart Categorization**: Organize newsletters into categories and topics
- **Digest Generation**: Generate daily, weekly, or custom digests of newsletter content
- **User Feedback**: Improve detection and categorization through user feedback
- **MCP Integration**: Seamlessly integrate with Gmail MCP Server
- **Interactive Demo**: Try out the system with our comprehensive demo

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- A Gmail account (for full functionality)

### Installation

```bash
# Install globally
npm install -g hypat.ai

# Or install as a project dependency
npm install hypat.ai
```

### Quick Start

1. Install the package:
   ```bash
   npm install hypat.ai
   ```

2. Create a configuration file:
   ```bash
   cp node_modules/hypat.ai/config.example.json config.json
   ```

3. Edit the configuration file with your settings

4. Run the demo to explore features:
   ```bash
   npx hypat demo
   ```

5. Start the server:
   ```bash
   npx hypat start
   ```

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

## Installation and Setup

### Prerequisites

- Node.js 18 or higher
- npm 7 or higher
- A Gmail account with the Gmail-MCP-Server setup

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/hypat.ai.git
cd hypat.ai
```

2. Install dependencies:

```bash
npm install
```

3. Copy the example environment file and configure it:

```bash
cp .env.example .env
# Edit .env with your settings
```

4. Create configuration files for your environments:

```bash
cp config.example.json config.json
cp config.development.json config.development.json
# Edit config files with your settings
```

5. Build the application:

```bash
npm run build
```

6. Run database migrations:

```bash
npm run db:migrate
```

### Configuration

Hypat.ai supports multiple configuration methods:

1. **Environment Variables**: Set in `.env` file or directly in your shell
2. **JSON Configuration Files**: Use `config.json` or environment-specific files like `config.development.json`
3. **Command Line Arguments**: Provide configuration via CLI arguments

#### Important Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `DATABASE_TYPE` | Database type (sqlite, mysql, postgresql) | sqlite |
| `DATABASE_FILENAME` | SQLite database file path | data/database.sqlite |
| `EMAIL_TRANSPORT` | Email transport (smtp, ses, mock) | smtp |
| `EMAIL_SENDER_ADDRESS` | Email sender address | hypat@example.com |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | info |
| `MCP_MOCK_GMAIL` | Use mock Gmail client for development | false |

See `.env.example` for a complete list of configuration options.

## Usage

### Running the Application

Start the application in development mode:

```bash
npm run dev
```

Start the application with production settings:

```bash
npm run start:prod
```

Run database migrations:

```bash
npm run db:migrate
```

### Command Line Options

```
Usage: hypat.ai [options]

Options:
  -V, --version             output the version number
  -c, --config <path>       Path to configuration file
  -e, --env <environment>   Environment (development, test, production) (default: "development")
  -v, --verbose             Enable verbose logging
  --migrate                 Run database migrations and exit
  -h, --help                display help for command
```

### Testing

Run all tests:

```bash
npm test
```

Run unit tests only:

```bash
npm run test:unit
```

Run integration tests only:

```bash
npm run test:integration
```

Generate test coverage report:

```bash
npm run test:coverage
```

### Development

During development, you can use the development mode with verbose logging:

```bash
npm run dev
```

Check code quality:

```bash
npm run lint
npm run typecheck
```

## Demo Mode

Hypat.ai includes a comprehensive demo mode that showcases its capabilities using mock data. This is a great way to understand how the system works and explore its features without setting up a full Gmail integration.

### Running the Demo

To run the demo:

```bash
npm run demo
```

This will initialize the system with sample data and guide you through key features including:

1. Newsletter detection with confidence scoring
2. Content extraction and processing
3. Automatic categorization of newsletters
4. Digest generation (daily and weekly)
5. User feedback processing and detection improvements

The demo uses a separate SQLite database file (`data/demo-database.sqlite`) so it won't interfere with your production data.

### What the Demo Showcases

![Demo Screenshot](docs/images/demo-screenshot.png)

The demo provides a comprehensive walkthrough of Hypat.ai's capabilities:

- **System Setup**: How the system is initialized and configured
- **Newsletter Detection**: How emails are analyzed to determine if they're newsletters
- **Content Processing**: How content is extracted and processed from newsletters
- **Categorization**: How newsletters are automatically categorized and organized
- **Digest Generation**: How daily and weekly digests are created from processed newsletters
- **User Feedback**: How user feedback improves detection and categorization

Each section includes detailed explanations and visual examples of the data and processes involved.

### Demo Configuration

The demo uses a separate configuration file (`config.demo.json`) with settings optimized for demonstration:

- Uses a mock Gmail client instead of connecting to the real Gmail API
- Uses a separate SQLite database for demo data
- Pre-configures sample users and preferences
- Uses colorized console output for better visualization

You can customize the demo by editing `config.demo.json` to change settings like:

- The number of sample newsletters to generate
- The users to create
- The categories to include
- Whether to run the full workflow or just specific parts

### Next Steps After the Demo

After exploring the demo, you might want to:

1. **Set up a real integration**: Configure the system to work with your Gmail account using the Gmail MCP Server
2. **Customize the categories**: Define your own categories that match your newsletter interests
3. **Configure your digest preferences**: Set up delivery preferences for your digest emails
4. **Deploy to a server**: Set up Hypat.ai on a server for continuous operation

See the [Installation and Setup](#installation-and-setup) section for details on how to get started with a real deployment.

## Troubleshooting

### Common Issues

#### Database Connection Errors

**Issue**: `Error: SQLITE_CANTOPEN: unable to open database file`

**Solution**: 
- Ensure the database directory exists and is writable
- Check the database path in your configuration
- For SQLite, try creating the database directory: `mkdir -p data`

#### Template Rendering Issues

**Issue**: `Error: Cannot find template: daily-standard`

**Solution**:
- Verify the templates directory path in your configuration
- Check if the template file exists and is readable
- For development, try using the simplified template renderer

#### Gmail MCP Connection Errors

**Issue**: `Error: Failed to connect to Gmail MCP Server`

**Solution**:
- Verify your Gmail MCP Server is running and accessible
- Check network connectivity and firewall settings
- In development, try using the mock Gmail client: `MCP_MOCK_GMAIL=true`

#### Email Sending Issues

**Issue**: `Error: Failed to send email`

**Solution**:
- Verify your SMTP settings (host, port, credentials)
- Check if your SMTP server requires authentication
- For testing, use the mock email transport: `EMAIL_TRANSPORT=mock`

### Logging

To enable more detailed logging:

```bash
LOG_LEVEL=debug npm run dev
```

Or use the verbose flag:

```bash
npm run dev -v
```

Logs are output to the console and to the log files in the `logs` directory (if file logging is enabled).

### Helpful Commands

Check database status:

```bash
sqlite3 data/database.sqlite ".tables"
```

Test email configuration:

```bash
npm run dev -- --config test-email
```

Clear cache:

```bash
rm -rf data/cache/*
```

## License

ISC