
import React from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DeleteTemplateDialog from './DeleteTemplateDialog';
import EmailPreview from './EmailPreview';
import TemplateDetailsForm from './email-template/TemplateDetailsForm';
import TemplateFormSkeleton from './email-template/TemplateFormSkeleton';
import { useTemplateForm } from '@/hooks/useTemplateForm';

const EmailTemplateForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
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
    navigate
  } = useTemplateForm({ id });
  
  if (!isLoggedIn) {
    return null;
  }
  
  if (isLoading) {
    return <TemplateFormSkeleton onBack={() => navigate('/')} />;
  }
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1>{isEditing ? 'Edit Template' : 'Create Template'}</h1>
        </div>
        
        {isEditing && (
          <Button 
            variant="outline" 
            className="text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
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
              onClick={() => navigate('/')}
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
        <DeleteTemplateDialog
          isOpen={showDeleteDialog}
          templateId={id!}
          templateName={formData.TemplateName || ''}
          onClose={() => setShowDeleteDialog(false)}
          onDeleted={handleDelete}
        />
      )}
    </div>
  );
};

export default EmailTemplateForm;
