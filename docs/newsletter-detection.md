# Newsletter Detection Module

## Overview

The Newsletter Detection Module is responsible for identifying newsletter emails among regular emails in a user's inbox. It employs multiple detection techniques with weighted confidence scoring to accurately classify emails as newsletters or regular communications.

## Architecture

The module is built with a modular, extensible architecture that follows these design principles:

1. **Multiple Detection Methods**: Uses a combination of techniques for higher accuracy
2. **Weighted Confidence Scoring**: Weighs different detection methods based on reliability
3. **Verification Workflow**: Identifies ambiguous cases for user verification
4. **Feedback Integration**: Incorporates user feedback to improve detection
5. **Extensibility**: Makes it easy to add new detection methods

## Components

### 1. Core Interfaces

All components follow well-defined interfaces:

- `DetectionMethod`: Base interface for all detection methods
- `DetectionScore`: Represents the score from a specific detection method
- `DetectionResult`: Combines scores from all methods into a final result
- `NewsletterDetector`: Main interface for the detection system

### 2. Detection Methods

#### HeaderAnalyzer

Analyzes email headers for newsletter indicators:
- Checks for List-Unsubscribe headers, which are strong newsletter indicators
- Identifies newsletter-specific X-headers from ESPs (Email Service Providers)
- Analyzes sender patterns (e.g., newsletter@, no-reply@, etc.)

**Weight: 40%**

#### ContentStructureAnalyzer

Examines email content for newsletter patterns:
- Identifies common newsletter layouts and templates
- Detects recurring structural elements (mastheads, footers)
- Recognizes templated content sections
- Analyzes HTML structure common in newsletters

**Weight: 30%**

#### SenderReputationTracker

Maintains a database of newsletter senders:
- Tracks known newsletter senders and domains
- Builds a reputation score for each sender
- Identifies common newsletter sending domains
- Adapts based on user's subscription patterns

**Weight: 20%**

#### UserFeedbackIntegrator

Incorporates user feedback to improve detection:
- Records user confirmations/rejections
- Builds a personalized newsletter identification model
- Applies direct feedback to override other methods
- Tracks feedback history for improvement

**Weight: 10%**

### 3. Detection Confidence Calculator

Calculates overall confidence scores:
- Weighs each detection method based on reliability
- Adjusts weights based on each method's confidence
- Calculates combined scores
- Applies thresholds for verification determination

### 4. Main Implementation

`NewsletterDetectorImpl` orchestrates the detection process:
- Coordinates all detection methods
- Combines individual scores into a final result
- Determines if verification is needed
- Provides an interface for the rest of the system

## Detection Process

1. An email is passed to the `detectNewsletter` method
2. Each detection method analyzes the email independently
3. Each method returns a score with confidence level
4. The confidence calculator combines scores, weighing them appropriately
5. If the combined score is in the ambiguous range, verification is requested
6. Results are returned with detailed explanations

## Verification Workflow

Emails with an ambiguous score (typically between 0.35 and 0.65) are flagged for verification:

1. These emails are presented to the user for confirmation
2. User feedback is recorded
3. Feedback is applied to improve future detection
4. Sender and domain reputation is updated

## Usage Example

```typescript
import { createNewsletterDetector } from './core/detection';

// Create a detector instance
const detector = createNewsletterDetector();

// Detect if an email is a newsletter
const result = await detector.detectNewsletter(email);

if (result.isNewsletter) {
  console.log('This is a newsletter with confidence:', result.combinedScore);
} else {
  console.log('This is not a newsletter with confidence:', 1 - result.combinedScore);
}

if (result.needsVerification) {
  // Ask user for verification
  const userConfirmed = askUserForVerification(email);
  
  // Record feedback
  await detector.recordFeedback(email.id, userConfirmed);
}
```

## Extending the System

To add a new detection method:

1. Implement the `DetectionMethod` interface
2. Register the method with the detector
3. Update the confidence calculator to include the new method
4. Add appropriate tests

## Performance Considerations

- Methods should be lightweight and fast
- Heavy content analysis should be performed only when necessary
- Caching mechanisms are used to avoid repeated analysis
- The system is designed to work with large volumes of emails