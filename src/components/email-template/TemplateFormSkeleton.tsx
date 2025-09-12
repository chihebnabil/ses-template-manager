'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface TemplateFormSkeletonProps {
  onBack: () => void;
}

const TemplateFormSkeleton: React.FC<TemplateFormSkeletonProps> = ({
  onBack
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1>Loading template...</h1>
      </div>
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-40 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
};

export default TemplateFormSkeleton;
