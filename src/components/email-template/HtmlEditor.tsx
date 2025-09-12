'use client';

import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import { Label } from '@/components/ui/label';

interface HtmlEditorProps {
  value: string;
  onChange: (code: string) => void;
  error?: string;
}

const HtmlEditor: React.FC<{
  children?: React.ReactNode;
}> = ({
  value,
  onChange,
  error,
  children
}) => {
  const detectLanguage = (code: string): string => {
    if (code.includes('<style') && code.includes('</style>')) {
      return 'css';
    }
    return 'markup';
  };

  const highlightWithLanguage = (code: string) => {
    const language = detectLanguage(code);
    return highlight(code, languages[language], language);
  };

  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div className="space-y-2 container__editor">
      <Label htmlFor="HtmlPart">
        HTML Content
      </Label>
      <div className={`border rounded-md overflow-hidden ${error ? "border-destructive" : "border-input"}`}>
        <Editor
          value={value || ''}
          onValueChange={onChange}
          highlight={highlightWithLanguage}
          padding={16}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
            fontVariantLigatures: 'common-ligatures',
            minHeight: '300px',
            backgroundColor: isDarkMode ? '#1d1f21' : '#fafafa', 
            color: isDarkMode ? '#cccccc' : 'inherit',
            borderRadius: '3px',
            outline: 0
          }}
          className="w-full"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default HtmlEditor;
