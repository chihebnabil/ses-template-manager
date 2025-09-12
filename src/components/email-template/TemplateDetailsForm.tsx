'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import HtmlEditor from './HtmlEditor';
import TextEditor from './TextEditor';
import { EmailTemplate } from '@/types';

interface TemplateDetailsFormProps {
  formData: Partial<EmailTemplate>;
  errors: { [key: string]: string };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleHtmlChange: (code: string) => void;
}

const TemplateDetailsForm: React.FC<{
  children?: React.ReactNode;
}> = ({
  formData,
  errors,
  handleChange,
  handleHtmlChange,
  children
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="TemplateName">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="TemplateName"
                name="TemplateName"
                value={formData.TemplateName}
                onChange={handleChange}
                className={errors.TemplateName ? "border-destructive" : ""}
              />
              {errors.TemplateName && (
                <p className="text-sm text-destructive">{errors.TemplateName}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="SubjectPart">
                Subject <span className="text-destructive">*</span>
              </Label>
              <Input
                id="SubjectPart"
                name="SubjectPart"
                value={formData.SubjectPart}
                onChange={handleChange}
                className={errors.SubjectPart ? "border-destructive" : ""}
              />
              {errors.SubjectPart && (
                <p className="text-sm text-destructive">{errors.SubjectPart}</p>
              )}
            </div>
          </div>
          
          <Tabs defaultValue="html" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="html">HTML Content</TabsTrigger>
              <TabsTrigger value="text">Text Content</TabsTrigger>
            </TabsList>
            <TabsContent value="html">
              <HtmlEditor 
                value={formData.HtmlPart || ''} 
                onChange={handleHtmlChange} 
                error={errors.HtmlPart}
              />
            </TabsContent>
            <TabsContent value="text">
              <TextEditor 
                value={formData.TextPart || ''} 
                onChange={handleChange} 
                error={errors.TextPart}
              />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default TemplateDetailsForm;
