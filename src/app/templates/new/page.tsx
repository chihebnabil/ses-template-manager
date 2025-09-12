import { Metadata } from 'next';
import EmailTemplateForm from '@/components/EmailTemplateForm';

export const metadata: Metadata = {
  title: 'Templates - New',
  description: 'Templates - New page - Access and manage your content',
};

export default function EmailTemplateFormPage() {
  return <EmailTemplateForm />;
}