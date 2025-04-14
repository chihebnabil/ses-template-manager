
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TextEditorProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({ value, onChange, error }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="TextPart">
        Text Content
      </Label>
      <Textarea
        id="TextPart"
        name="TextPart"
        value={value}
        onChange={onChange}
        className={`min-h-[300px] font-mono ${error ? "border-destructive" : ""}`}
        placeholder="Your plain text content here"
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
};

export default TextEditor;
