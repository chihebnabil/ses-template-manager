'use client';

import { useParams } from 'next/navigation';
import React from 'react';
import { ArrowLeft, Save, Trash2, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DeleteTemplateDialog from './DeleteTemplateDialog';
import SendTestEmailDialog from './SendTestEmailDialog';
import EmailPreview from './EmailPreview';
import TemplateDetailsForm from './email-template/TemplateDetailsForm';
import TemplateFormSkeleton from './email-template/TemplateFormSkeleton';
import { useTemplateForm } from '@/hooks/useTemplateForm';

const EmailTemplateForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [showSendEmailDialog, setShowSendEmailDialog] = React.useState(false);
  
  const { 
    isEditing,
    isLoading,
    isSaving,
    isLoggedIn,
    formData,
    errors,
    showDeleteDialog,
    setShowDeleteDialog,
    showPreview,
    togglePreview,
    handleChange,
    handleHtmlChange,
    handleSubmit,
    handleDelete,
    router
  } = useTemplateForm({ id });
  
  if (!isLoggedIn) {
    return null;
  }
  
  if (isLoading) {
    return <TemplateFormSkeleton onBack={() => router.push('/')} />;
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1>{isEditing ? 'Edit Template' : 'Create Template'}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Button 
                variant="secondary" 
                onClick={() => setShowSendEmailDialog(true)}
                disabled={isSaving}
              >
                <SendHorizontal className="h-4 w-4 mr-2" />
                Send Test Email
              </Button>
              
              <Button 
                variant="outline" 
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <TemplateDetailsForm
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            handleHtmlChange={handleHtmlChange}
          />
          
          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              className="mr-2" 
              onClick={() => router.push('/')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </form>
        
        <div className="space-y-6">
          <EmailPreview 
            template={formData} 
            isVisible={showPreview} 
            onToggleVisibility={togglePreview} 
          />
        </div>
      </div>
      {isEditing && (
        <>
          <DeleteTemplateDialog
            isOpen={showDeleteDialog}
            templateId={id!}
            templateName={formData.TemplateName || ''}
            onClose={() => setShowDeleteDialog(false)}
            onDeleted={handleDelete}
          />
          
          <SendTestEmailDialog
            isOpen={showSendEmailDialog}
            onClose={() => setShowSendEmailDialog(false)}
            templateName={id!}
          />
        </>
      )}
    </div>
  );
};

export default EmailTemplateForm;
