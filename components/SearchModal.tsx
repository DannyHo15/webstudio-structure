import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronRight } from 'lucide-react';
import { DOCS_DATA } from '../data/docs';
import { SearchResult } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string, pageId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const hits: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    DOCS_DATA.forEach(section => {
      section.pages.forEach(page => {
        let match = false;
        let snippet = '';

        if (page.title.toLowerCase().includes(lowerQuery)) {
          match = true;
          snippet = 'Page Title Match';
        } else {
          // Simple content search
          for (const block of page.content) {
            if (typeof block.value === 'string' && block.value.toLowerCase().includes(lowerQuery)) {
              match = true;
              snippet = block.value.substring(0, 80) + '...';
              break;
            }
          }
        }

        if (match) {
          hits.push({
            pageId: page.id,
            sectionId: section.id,
            title: `${section.title} > ${page.title}`,
            snippet
          });
        }
      });
    });

    setResults(hits);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center p-4 border-b border-gray-100">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 text-lg outline-none placeholder:text-gray-400 text-gray-800"
            placeholder="Search documentation..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {results.length === 0 && query && (
             <div className="text-center p-8 text-gray-500">No results found for "{query}"</div>
          )}
          {results.map((result, idx) => (
            <button
              key={`${result.pageId}-${idx}`}
              className="w-full text-left p-3 hover:bg-blue-50 rounded-lg group transition-colors"
              onClick={() => {
                onNavigate(result.sectionId, result.pageId);
                onClose();
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-slate-800 group-hover:text-blue-700">{result.title}</span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400" />
              </div>
              <p className="text-sm text-gray-500 truncate">{result.snippet}</p>
            </button>
          ))}
          {!query && (
            <div className="p-8 text-center text-sm text-gray-400">
              Type to search across architecture, modules, and workflows.
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
            <span>WebStudio Docs v1.0</span>
            <span>Use <kbd className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-sans">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
};
