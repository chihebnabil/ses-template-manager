
import { 
  SESClient, 
  ListTemplatesCommand,
  GetTemplateCommand,
  CreateTemplateCommand,
  UpdateTemplateCommand,
  DeleteTemplateCommand,
  SendTemplatedEmailCommand,
  Template,
  CreateTemplateCommandInput,
  UpdateTemplateCommandInput,
  TemplateMetadata
} from '@aws-sdk/client-ses';
import { EmailTemplate, CreateEmailTemplateInput, UpdateEmailTemplateInput } from '@/types';
import { toast } from 'sonner';
import { fixTemplateEmojis, encodeForSES } from '@/lib/emoji-utils';

// Initialize SES client with credentials from localStorage
export const getSESClient = (): SESClient | null => {
  const storedCredentials = localStorage.getItem('awsCredentials');
  
  if (!storedCredentials) {
    toast.error('AWS credentials not found. Please login first.');
    return null;
  }

  try {
    const { region, accessKeyId, secretAccessKey } = JSON.parse(storedCredentials);
    
    return new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      }
    });
  } catch (error) {
    console.error('Error initializing SES client:', error);
    toast.error('Failed to initialize AWS client. Please login again.');
    return null;
  }
};

// Convert AWS SES template to our app's template format
const convertToAppTemplate = (template: Template, id: string): EmailTemplate => {
  const templateData = {
    id,
    TemplateName: template.TemplateName || '',
    SubjectPart: template.SubjectPart || '',
    HtmlPart: template.HtmlPart || '',
    TextPart: template.TextPart || '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Fix emoji encoding issues
  return fixTemplateEmojis(templateData);
};

// List all templates with optional filtering
export const listTemplates = async (searchTerm?: string): Promise<EmailTemplate[]> => {
  const client = getSESClient();
  if (!client) return [];
  
  try {
    const command = new ListTemplatesCommand({});
    const response = await client.send(command);
    
    const templateMetadata = response.TemplatesMetadata || [];
    
    // Filter templates if search term is provided
    const filteredTemplates = searchTerm 
      ? templateMetadata.filter(template => 
          template.Name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : templateMetadata;
    
    // For each template metadata, fetch the full template
    const templates = await Promise.all(
      filteredTemplates.map(async (metadata) => {
        const templateName = metadata.Name as string;
        const templateData = await getTemplateById(templateName);
        return templateData as EmailTemplate;
      })
    );
    
    return templates.filter(template => template !== undefined) as EmailTemplate[];
  } catch (error) {
    console.error('Error listing templates:', error);
    toast.error('Failed to list templates from AWS SES');
    throw error;
  }
};

// Get a single template by ID (TemplateName)
export const getTemplateById = async (id: string): Promise<EmailTemplate | undefined> => {
  const client = getSESClient();
  if (!client) return undefined;
  
  try {
    const command = new GetTemplateCommand({
      TemplateName: id
    });
    
    const response = await client.send(command);
    if (!response.Template) return undefined;
    
    return convertToAppTemplate(response.Template, id);
  } catch (error) {
    console.error(`Error getting template ${id}:`, error);
    toast.error(`Failed to get template "${id}" from AWS SES`);
    throw error;
  }
};

// Create a new template
export const createTemplate = async (data: CreateEmailTemplateInput): Promise<EmailTemplate> => {
  const client = getSESClient();
  if (!client) throw new Error("No SES client available");
  
  try {
    // Ensure emojis are properly encoded for SES
    const encodedData = {
      TemplateName: data.TemplateName,
      SubjectPart: encodeForSES(data.SubjectPart),
      HtmlPart: encodeForSES(data.HtmlPart),
      TextPart: encodeForSES(data.TextPart)
    };
    
    const command = new CreateTemplateCommand({
      Template: encodedData
    });
    
    await client.send(command);
    
    // Return the newly created template with proper emoji decoding
    const templateData = {
      id: data.TemplateName,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return fixTemplateEmojis(templateData);
  } catch (error) {
    console.error('Error creating template:', error);
    toast.error('Failed to create template in AWS SES');
    throw error;
  }
};

// Update an existing template
export const updateTemplate = async (id: string, data: UpdateEmailTemplateInput): Promise<EmailTemplate> => {
  const client = getSESClient();
  if (!client) throw new Error("No SES client available");
  
  try {
    // Get existing template to merge with updates
    const existingTemplate = await getTemplateById(id);
    if (!existingTemplate) {
      throw new Error("Template not found");
    }
    
    // If template name is changing, we need to create a new one and delete the old one
    if (data.TemplateName && data.TemplateName !== id) {
      // Create new template with new name
      await createTemplate({
        TemplateName: data.TemplateName,
        SubjectPart: data.SubjectPart || existingTemplate.SubjectPart,
        HtmlPart: data.HtmlPart || existingTemplate.HtmlPart,
        TextPart: data.TextPart || existingTemplate.TextPart
      });
      
      // Delete old template
      await deleteTemplate(id);
      
      // Return the updated template with proper emoji handling
      const templateData = {
        id: data.TemplateName,
        TemplateName: data.TemplateName,
        SubjectPart: data.SubjectPart || existingTemplate.SubjectPart,
        HtmlPart: data.HtmlPart || existingTemplate.HtmlPart,
        TextPart: data.TextPart || existingTemplate.TextPart,
        createdAt: existingTemplate.createdAt,
        updatedAt: new Date()
      };
      
      return fixTemplateEmojis(templateData);
    }
    
    // Otherwise, update the existing template with proper emoji encoding
    const command = new UpdateTemplateCommand({
      Template: {
        TemplateName: id,
        SubjectPart: encodeForSES(data.SubjectPart || existingTemplate.SubjectPart),
        HtmlPart: encodeForSES(data.HtmlPart || existingTemplate.HtmlPart),
        TextPart: encodeForSES(data.TextPart || existingTemplate.TextPart)
      }
    });
    
    await client.send(command);
    
    // Return the updated template with proper emoji handling
    const templateData = {
      ...existingTemplate,
      ...data,
      updatedAt: new Date()
    };
    
    return fixTemplateEmojis(templateData);
  } catch (error) {
    console.error(`Error updating template ${id}:`, error);
    toast.error(`Failed to update template "${id}" in AWS SES`);
    throw error;
  }
};

// Delete a template
export const deleteTemplate = async (id: string): Promise<void> => {
  const client = getSESClient();
  if (!client) throw new Error("No SES client available");
  
  try {
    const command = new DeleteTemplateCommand({
      TemplateName: id
    });
    
    await client.send(command);
  } catch (error) {
    console.error(`Error deleting template ${id}:`, error);
    toast.error(`Failed to delete template "${id}" from AWS SES`);
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
  const client = getSESClient();
  if (!client) throw new Error("No SES client available");
  
  try {
    const command = new SendTemplatedEmailCommand({
      Source: source,
      Destination: {
        ToAddresses: to
      },
      Template: templateName,
      TemplateData: JSON.stringify(templateData)
    });
    
    const response = await client.send(command);
    return response.MessageId || '';
  } catch (error) {
    console.error('Error sending templated email:', error);
    throw error;
  }
};
