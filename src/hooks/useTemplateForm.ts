
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmailTemplate } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { 
  createTemplate, 
  getTemplateById, 
  updateTemplate 
} from '@/lib/aws-ses';

interface UseTemplateFormProps {
  id?: string;
}

export const useTemplateForm = ({ id }: UseTemplateFormProps) => {
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [formData, setFormData] = useState<Partial<EmailTemplate>>({
    TemplateName: '',
    SubjectPart: '',
    HtmlPart: '',
    TextPart: ''
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  useEffect(() => {
    const credentials = localStorage.getItem('awsCredentials');
    const loggedIn = !!credentials;
    setIsLoggedIn(loggedIn);
    
    if (!loggedIn) {
      toast({
        title: "Login Required",
        description: "You need to log in to manage templates",
        variant: "destructive"
      });
      navigate('/');
      return;
    }
    
    if (isEditing && id) {
      loadTemplate(id);
    }
  }, [id, isEditing, navigate]);
  
  const loadTemplate = async (templateId: string) => {
    try {
      setIsLoading(true);
      const template = await getTemplateById(templateId);
      
      if (!template) {
        toast({
          title: "Error",
          description: "Template not found",
          variant: "destructive"
        });
        navigate('/');
        return;
      }
      
      setFormData({
        TemplateName: template.TemplateName,
        SubjectPart: template.SubjectPart,
        HtmlPart: template.HtmlPart,
        TextPart: template.TextPart
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load template",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleHtmlChange = (code: string) => {
    setFormData(prev => ({ ...prev, HtmlPart: code }));
    
    if (errors.HtmlPart) {
      setErrors(prev => ({ ...prev, HtmlPart: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.TemplateName?.trim()) {
      newErrors.TemplateName = 'Template name is required';
    }
    
    if (!formData.SubjectPart?.trim()) {
      newErrors.SubjectPart = 'Subject is required';
    }
    
    if (!formData.HtmlPart?.trim() && !formData.TextPart?.trim()) {
      newErrors.HtmlPart = 'Either HTML or Text content is required';
      newErrors.TextPart = 'Either HTML or Text content is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      if (isEditing && id) {
        await updateTemplate(id, formData);
        toast({
          title: "Success",
          description: `Template "${formData.TemplateName}" has been updated`
        });
      } else {
        await createTemplate(formData as Required<Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>>);
        toast({
          title: "Success",
          description: `Template "${formData.TemplateName}" has been created`
        });
      }
      
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to save template",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = () => {
    navigate('/');
  };
  
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return {
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
  };
};
