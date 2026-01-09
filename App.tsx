import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ContentRenderer } from './components/ContentRenderer';
import { SearchModal } from './components/SearchModal';
import { DOCS_DATA } from './data/docs';
import { Menu, Search as SearchIcon } from 'lucide-react';

// Wrapper to handle routing logic and state
const DocApp = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Parse current route
  // Format: /:sectionId/:pageId
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentSectionId = pathParts[0] || DOCS_DATA[0].id;
  const currentPageId = pathParts[1] || DOCS_DATA[0].pages[0].id;

  // Find data
  const section = DOCS_DATA.find(s => s.id === currentSectionId) || DOCS_DATA[0];
  const page = section.pages.find(p => p.id === currentPageId) || section.pages[0];

  const handleNavigate = (sectionId: string, pageId: string) => {
    navigate(`/${sectionId}/${pageId}`);
    window.scrollTo(0, 0);
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar 
        data={DOCS_DATA}
        currentSectionId={currentSectionId}
        currentPageId={currentPageId}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Mobile/Tablet Header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between z-20 flex-shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-slate-800">WebStudio</span>
          <button 
            onClick={() => setSearchOpen(true)}
            className="p-2 -mr-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <SearchIcon className="w-6 h-6" />
          </button>
        </header>

        {/* Desktop Search Header */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex text-sm breadcrumbs text-gray-500">
                <span>{section.title}</span>
                <span className="mx-2">/</span>
                <span className="font-medium text-gray-900">{page.title}</span>
            </div>
            <button 
                onClick={() => setSearchOpen(true)}
                className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 px-4 py-2 rounded-lg transition-all w-64 text-sm"
            >
                <SearchIcon className="w-4 h-4" />
                <span>Search...</span>
                <span className="ml-auto text-xs border border-gray-300 rounded px-1.5 py-0.5">⌘K</span>
            </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-white scroll-smooth relative">
           <ContentRenderer page={page} />
        </main>
      </div>

      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setSearchOpen(false)} 
        onNavigate={handleNavigate}
      />
    </div>
  );
};

// Main App Wrapper with Router
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/*" element={<DocApp />} />
      </Routes>
    </HashRouter>
  );
}
