
export interface EmailTemplate {
  id: string;
  TemplateName: string;
  SubjectPart: string;
  HtmlPart: string;
  TextPart: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateEmailTemplateInput = Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateEmailTemplateInput = Partial<CreateEmailTemplateInput>;
