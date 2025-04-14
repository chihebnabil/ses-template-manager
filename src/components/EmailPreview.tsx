
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, FileText, RefreshCw } from 'lucide-react';
import { EmailTemplate } from '@/types';

interface EmailPreviewProps {
  template: Partial<EmailTemplate>;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
  template,
  isVisible,
  onToggleVisibility
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (!isVisible) {
    return (
      <div className="flex items-center justify-center py-8">
        <Button 
          variant="outline" 
          className="flex items-center gap-2" 
          onClick={onToggleVisibility}
        >
          <Eye className="h-4 w-4" />
          <span>Show Email Preview</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Email Preview</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={onToggleVisibility}
          >
            <EyeOff className="h-3.5 w-3.5" />
            <span className="sr-only">Hide</span>
          </Button>
        </div>
      </div>

      <Card className="border bg-card overflow-hidden">
        <div className="bg-muted px-4 py-2 border-b text-sm font-medium">
          <div>Subject: {template.SubjectPart || 'No subject'}</div>
        </div>
        <CardContent className="p-0">
          <div className="bg-white border-b border-muted h-[400px] overflow-auto">
            {template.HtmlPart ? (
              <iframe
                srcDoc={template.HtmlPart}
                title="Email Preview"
                className="w-full h-full"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No HTML content to preview</p>
              </div>
            )}
          </div>
          {template.TextPart && (
            <div className="p-4 text-sm font-mono whitespace-pre-wrap text-muted-foreground border-t">
              <div className="text-xs uppercase font-medium mb-2">Text Version:</div>
              {template.TextPart}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailPreview;
