
import { EmailTemplate, CreateEmailTemplateInput, UpdateEmailTemplateInput } from '@/types';
import { toast } from '@/components/ui/use-toast';

// Mock data store
let templates: EmailTemplate[] = [];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// List all templates with optional filtering
export const listTemplates = async (searchTerm?: string): Promise<EmailTemplate[]> => {
  await delay(300);
  
  if (!searchTerm) return [...templates];
  
  const normalizedSearch = searchTerm.toLowerCase();
  return templates.filter(template => 
    template.TemplateName.toLowerCase().includes(normalizedSearch) ||
    template.SubjectPart.toLowerCase().includes(normalizedSearch)
  );
};

// Get a single template by ID
export const getTemplateById = async (id: string): Promise<EmailTemplate | undefined> => {
  await delay(200);
  return templates.find(template => template.id === id);
};

// Create a new template
export const createTemplate = async (data: CreateEmailTemplateInput): Promise<EmailTemplate> => {
  await delay(500);
  
  // Check if template with the same name already exists
  if (templates.some(t => t.TemplateName.toLowerCase() === data.TemplateName.toLowerCase())) {
    toast({
      title: "Error",
      description: "A template with this name already exists.",
      variant: "destructive"
    });
    throw new Error("A template with this name already exists");
  }
  
  const newTemplate: EmailTemplate = {
    id: Date.now().toString(),
    ...data,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  templates = [...templates, newTemplate];
  return newTemplate;
};

// Update an existing template
export const updateTemplate = async (id: string, data: UpdateEmailTemplateInput): Promise<EmailTemplate> => {
  await delay(500);
  
  // Check if template name is being changed and if it would conflict
  if (data.TemplateName) {
    const nameConflict = templates.some(
      t => t.id !== id && t.TemplateName.toLowerCase() === data.TemplateName?.toLowerCase()
    );
    
    if (nameConflict) {
      toast({
        title: "Error",
        description: "A template with this name already exists.",
        variant: "destructive"
      });
      throw new Error("A template with this name already exists");
    }
  }
  
  const templateIndex = templates.findIndex(template => template.id === id);
  
  if (templateIndex === -1) {
    toast({
      title: "Error",
      description: "Template not found.",
      variant: "destructive"
    });
    throw new Error("Template not found");
  }
  
  const updatedTemplate = {
    ...templates[templateIndex],
    ...data,
    updatedAt: new Date()
  };
  
  templates = [
    ...templates.slice(0, templateIndex),
    updatedTemplate,
    ...templates.slice(templateIndex + 1)
  ];
  
  return updatedTemplate;
};

// Delete a template
export const deleteTemplate = async (id: string): Promise<void> => {
  await delay(400);
  const templateIndex = templates.findIndex(template => template.id === id);
  
  if (templateIndex === -1) {
    toast({
      title: "Error",
      description: "Template not found.",
      variant: "destructive"
    });
    throw new Error("Template not found");
  }
  
  templates = [
    ...templates.slice(0, templateIndex),
    ...templates.slice(templateIndex + 1)
  ];
};
