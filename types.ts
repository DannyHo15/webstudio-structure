export interface DocSection {
  id: string;
  title: string;
  pages: DocPage[];
}

export interface DocPage {
  id: string;
  title: string;
  content: DocContentBlock[];
}

export type ContentType = 'text' | 'code' | 'mermaid' | 'list' | 'header';

export interface DocContentBlock {
  type: ContentType;
  value: string | string[];
  language?: string; // For code blocks
}

export interface SearchResult {
  pageId: string;
  sectionId: string;
  title: string;
  snippet: string;
}
