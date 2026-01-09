import React, { useEffect, useState, useRef } from 'react';

interface MermaidDiagramProps {
  chart: string;
}

declare global {
  interface Window {
    mermaid: any;
  }
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`).current;

  useEffect(() => {
    if (!window.mermaid) {
      setError("Mermaid library not found");
      return;
    }

    try {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'loose',
        fontFamily: 'Inter, sans-serif',
        logLevel: 'error',
      });
    } catch (e) {
      // Ignore initialization errors if already initialized
    }

    const renderDiagram = async () => {
      try {
        // mermaid.render returns { svg: string }
        // We pass a unique ID for the container it temporarily uses
        const { svg } = await window.mermaid.render(id, chart);
        setSvg(svg);
        setError(null);
      } catch (e: any) {
        console.error("Mermaid render error", e);
        // Clean up the error message if it's an object
        const message = e instanceof Error ? e.message : "Syntax error in diagram definition";
        setError(message);
      }
    };

    renderDiagram();
  }, [chart, id]);

  if (error) {
    return (
      <div className="my-6 p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700 font-mono">
        <p className="font-bold mb-2">Diagram Rendering Error</p>
        <p className="mb-4">{error}</p>
        <div className="bg-white p-2 border border-red-100 rounded opacity-75 overflow-x-auto">
           <pre>{chart}</pre>
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
        <div className="my-8 h-32 bg-gray-50 animate-pulse rounded-lg flex items-center justify-center text-gray-400 text-sm font-medium border border-gray-100">
            Rendering Diagram...
        </div>
    );
  }

  return (
    <div 
      className="my-8 flex justify-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
};
