
import { EmailTemplate, CreateEmailTemplateInput, UpdateEmailTemplateInput } from '@/types';
import { apiClient } from './api-client';

// List all templates with optional filtering
export const listTemplates = async (searchTerm?: string): Promise<EmailTemplate[]> => {
  try {
    const url = searchTerm 
      ? `/api/templates?search=${encodeURIComponent(searchTerm)}`
      : '/api/templates';
      
    const response = await apiClient.get<EmailTemplate[]>(url);
    return response;
  } catch (error) {
    console.error('Error listing templates:', error);
    throw error;
  }
};

// Get a single template by ID (TemplateName)
export const getTemplateById = async (id: string): Promise<EmailTemplate | undefined> => {
  try {
    const response = await apiClient.get<EmailTemplate>(`/api/templates/${encodeURIComponent(id)}`);
    return response;
  } catch (error) {
    console.error(`Error getting template ${id}:`, error);
    throw error;
  }
};

// Create a new template
export const createTemplate = async (data: CreateEmailTemplateInput): Promise<EmailTemplate> => {
  try {
    const response = await apiClient.post<EmailTemplate>('/api/templates', data);
    return response;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

// Update an existing template
export const updateTemplate = async (id: string, data: UpdateEmailTemplateInput): Promise<EmailTemplate> => {
  try {
    const response = await apiClient.put<EmailTemplate>(`/api/templates/${encodeURIComponent(id)}`, data);
    return response;
  } catch (error) {
    console.error(`Error updating template ${id}:`, error);
    throw error;
  }
};

// Delete a template
export const deleteTemplate = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/api/templates/${encodeURIComponent(id)}`);
  } catch (error) {
    console.error(`Error deleting template ${id}:`, error);
    throw error;
  }
};

// Send an email using a template
export const sendTemplatedEmail = async (
  templateName: string,
  source: string,
  to: string[],
  templateData: Record<string, any> = {}
): Promise<string> => {
  try {
    const response = await apiClient.post<{ messageId: string }>('/api/templates/send', {
      templateName,
      source,
      to,
      templateData
    });
    return response.messageId;
  } catch (error) {
    console.error('Error sending templated email:', error);
    throw error;
  }
};
