# Content Processing Module

## Overview

The Content Processing Module is responsible for extracting and analyzing content from newsletter emails. It provides capabilities to parse HTML newsletters, extract meaningful content, identify sections and structure, extract links and resources, and identify key topics and themes.

## Key Components

### Content Processor

The `ContentProcessor` is the main interface for the module, providing methods for extracting and processing newsletter content.

```typescript
interface ContentProcessor {
  extractContent(emailId: string, options?: ExtractionOptions): Promise<ExtractedContent>;
  parseStructure(content: string): Promise<NewsletterStructure>;
  extractLinks(content: string): Promise<Link[]>;
  extractTopics(content: string): Promise<Topic[]>;
  storeContent(extractedContent: ExtractedContent): Promise<void>;
  getContent(newsletterId: string): Promise<ExtractedContent | null>;
}
```

### HTML Content Extractor

The `HtmlContentExtractor` is responsible for cleaning HTML and extracting the main content from newsletter emails.

```typescript
interface HtmlContentExtractor {
  extractMainContent(html: string): Promise<string>;
  convertToPlainText(html: string): string;
  cleanHtml(html: string): string;
}
```

### Newsletter Structure Parser

The `NewsletterStructureParser` analyzes HTML content to identify the structure of newsletters, including sections, headings, and metadata.

```typescript
interface NewsletterStructureParser {
  parseStructure(html: string): Promise<NewsletterStructure>;
  identifySections(html: string): NewsletterSection[];
  extractMetadata(html: string): Record<string, string>;
}
```

### Link Extractor

The `LinkExtractor` extracts links from newsletter content, categorizes them, and identifies sponsored content.

```typescript
interface LinkExtractor {
  extractLinks(html: string): Promise<Link[]>;
  categorizeLinks(links: Link[]): Promise<Link[]>;
  identifySponsoredLinks(links: Link[]): Promise<Link[]>;
}
```

### Topic Extractor

The `TopicExtractor` analyzes newsletter content to identify key topics and themes.

```typescript
interface TopicExtractor {
  extractTopics(text: string): Promise<Topic[]>;
  extractKeywords(text: string): Promise<string[]>;
  calculateConfidence(topics: Topic[], text: string): Promise<Topic[]>;
}
```

### Content Repository

The `ContentRepository` stores and retrieves processed content, enabling caching and persistence.

```typescript
interface ContentRepository {
  storeContent(content: ExtractedContent): Promise<void>;
  getContent(newsletterId: string): Promise<ExtractedContent | null>;
  listContentIds(criteria?: Record<string, any>): Promise<string[]>;
  deleteContent(newsletterId: string): Promise<boolean>;
}
```

## Data Model

### ExtractedContent

```typescript
interface ExtractedContent {
  newsletterId: string;
  rawContent: string;
  plainText: string;
  structure: NewsletterStructure;
  links: Link[];
  topics: Topic[];
  extractedAt: Date;
}
```

### NewsletterStructure

```typescript
interface NewsletterStructure {
  title: string;
  sections: NewsletterSection[];
  metadata: Record<string, string>;
}
```

### NewsletterSection

```typescript
interface NewsletterSection {
  id: string;
  title?: string;
  content: string;
  type: SectionType;
  links: Link[];
  images?: string[];
  level: number;
}
```

### Link

```typescript
interface Link {
  url: string;
  text: string;
  category?: string;
  context?: string;
  isSponsored?: boolean;
}
```

### Topic

```typescript
interface Topic {
  name: string;
  confidence: number;
  keywords: string[];
  context?: string;
}
```

## MCP Tools

The Content Processing Module exposes the following MCP tools:

### Extract Newsletter Content

Extracts and processes content from a newsletter email.

```typescript
// Input
{
  "emailId": "string",
  "includeImages": boolean,
  "extractTopics": boolean
}

// Output
{
  "newsletterId": "string",
  "title": "string",
  "plainText": "string",
  "sections": [...],
  "links": [...],
  "topics": [...],
  "metadata": {...}
}
```

### Get Newsletter Topics

Retrieves topics from a newsletter with confidence scores.

```typescript
// Input
{
  "emailId": "string",
  "minConfidence": number
}

// Output
{
  "newsletterId": "string",
  "topics": [...]
}
```

### Get Newsletter Links

Retrieves links from a newsletter with optional filtering.

```typescript
// Input
{
  "emailId": "string",
  "categories": ["string"],
  "includeSponsoredOnly": boolean
}

// Output
{
  "newsletterId": "string",
  "links": [...]
}
```

## Content Extraction Process

1. **HTML Cleaning**
   - Remove unnecessary elements (scripts, styles, etc.)
   - Normalize formatting

2. **Main Content Extraction**
   - Identify the primary content container
   - Extract the main body of the newsletter

3. **Structure Parsing**
   - Identify sections based on headings and HTML structure
   - Extract newsletter title, author, and other metadata

4. **Link Extraction**
   - Extract all links from the content
   - Categorize links (article, video, social, product, etc.)
   - Identify sponsored links

5. **Topic Extraction**
   - Extract keywords from the plain text content
   - Group related keywords into topics
   - Calculate confidence scores for topics

6. **Content Storage**
   - Store processed content for future retrieval
   - Enable querying by newsletter ID

## Integration with Other Modules

- **Newsletter Detection Module**: Identifies newsletters that should be processed
- **Categorization Module**: Uses processed content for categorization
- **Digest Generation Module**: Uses processed content to generate digests

## Future Enhancements

- **Advanced HTML Parsing**: Improve content extraction with more sophisticated HTML parsing
- **Image Analysis**: Extract and analyze images from newsletters
- **Semantic Understanding**: Enhance topic extraction with semantic analysis
- **Persistent Storage**: Replace in-memory storage with database-backed repository