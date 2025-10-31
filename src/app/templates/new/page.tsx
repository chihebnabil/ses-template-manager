import { Metadata } from 'next';
import EmailTemplateForm from '@/components/EmailTemplateForm';
import Layout from '@/components/Layout';

export const metadata: Metadata = {
  title: 'New Template - SES Template Manager',
  description: 'Create a new email template for AWS SES',
};

export default function EmailTemplateFormPage() {
  return (
    <Layout>
      <EmailTemplateForm />
    </Layout>
  );
}