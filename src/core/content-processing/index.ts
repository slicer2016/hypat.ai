/**
 * Content Processing Module
 * Main entry point for the content processing module
 */

import { ContentProcessorImpl } from './content-processor-impl.js';
import { HtmlContentExtractorImpl } from './extractors/html-content-extractor.js';
import { LinkExtractorImpl } from './extractors/link-extractor.js';
import { TopicExtractorImpl } from './extractors/topic-extractor.js';
import { NewsletterStructureParserImpl } from './parsers/newsletter-structure-parser.js';
import { InMemoryContentRepository } from './utils/content-repository.js';

/**
 * Create a configured instance of the ContentProcessor
 */
export function createContentProcessor() {
  const htmlExtractor = new HtmlContentExtractorImpl();
  const linkExtractor = new LinkExtractorImpl();
  const topicExtractor = new TopicExtractorImpl();
  const structureParser = new NewsletterStructureParserImpl();
  const repository = new InMemoryContentRepository();
  
  return new ContentProcessorImpl(
    htmlExtractor,
    linkExtractor,
    topicExtractor,
    structureParser,
    repository
  );
}

// Export all implementation classes for use in tests and DI
export { ContentProcessorImpl } from './content-processor-impl.js';
export { HtmlContentExtractorImpl } from './extractors/html-content-extractor.js';
export { LinkExtractorImpl } from './extractors/link-extractor.js';
export { TopicExtractorImpl } from './extractors/topic-extractor.js';
export { NewsletterStructureParserImpl } from './parsers/newsletter-structure-parser.js';
export { InMemoryContentRepository } from './utils/content-repository.js';