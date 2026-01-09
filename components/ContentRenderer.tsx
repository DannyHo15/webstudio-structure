import React from 'react';
import { DocPage, DocContentBlock } from '../types';
import { MermaidDiagram } from './MermaidDiagram';
import { FileText, Link as LinkIcon, AlertTriangle } from 'lucide-react';

interface ContentRendererProps {
  page: DocPage;
}

const CodeBlock: React.FC<{ language?: string; code: string }> = ({ language, code }) => (
  <div className="my-6 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
    <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
      <span className="text-xs font-mono text-gray-500 uppercase">{language || 'TEXT'}</span>
      <button 
        className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
        onClick={() => navigator.clipboard.writeText(code)}
      >
        Copy
      </button>
    </div>
    <div className="p-4 overflow-x-auto">
      <pre className="text-sm font-mono text-gray-800 leading-relaxed">
        {code}
      </pre>
    </div>
  </div>
);

const BlockRenderer: React.FC<{ block: DocContentBlock }> = ({ block }) => {
  switch (block.type) {
    case 'header':
      return (
        <h2 className="text-2xl font-bold text-slate-900 mt-10 mb-6 pb-2 border-b border-gray-100 flex items-center group">
          {block.value}
          <a href={`#${String(block.value).toLowerCase().replace(/\s+/g, '-')}`} className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-500 transition-opacity">
            <LinkIcon className="w-4 h-4" />
          </a>
        </h2>
      );
    case 'text':
      return <p className="text-gray-700 leading-7 mb-4 text-lg">{block.value}</p>;
    case 'code':
      return <CodeBlock language={block.language} code={block.value as string} />;
    case 'mermaid':
      return <MermaidDiagram chart={block.value as string} />;
    case 'list':
      return (
        <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-700">
          {(block.value as string[]).map((item, i) => (
            <li key={i} className="pl-1">{item}</li>
          ))}
        </ul>
      );
    default:
      return null;
  }
};

export const ContentRenderer: React.FC<ContentRendererProps> = ({ page }) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10 lg:px-12 lg:py-12">
      <div className="mb-10">
        <div className="flex items-center space-x-2 text-sm text-blue-600 font-medium mb-2">
           <FileText className="w-4 h-4" />
           <span>Documentation</span>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">{page.title}</h1>
        <div className="h-1 w-20 bg-blue-600 rounded-full"></div>
      </div>
      
      <div className="prose prose-slate max-w-none">
        {page.content.map((block, idx) => (
          <BlockRenderer key={idx} block={block} />
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
        <p>Last updated: Today</p>
        <a href="#" className="hover:text-blue-600 flex items-center">
            <span className="mr-1">Edit on GitHub</span>
        </a>
      </div>
    </div>
  );
};