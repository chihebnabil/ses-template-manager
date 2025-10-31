import { Metadata } from 'next';
import EmailTemplateForm from '@/components/EmailTemplateForm';
import Layout from '@/components/Layout';

export const metadata: Metadata = {
  title: 'Edit Template - SES Template Manager',
  description: 'Edit email template for AWS SES',
};

export default function EmailTemplateFormPage() {
  return (
    <Layout>
      <EmailTemplateForm />
    </Layout>
  );
}