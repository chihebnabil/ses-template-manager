import { Metadata } from 'next';
import BulkEmailPageSimple from '@/components/BulkEmailPageSimple';
import Layout from '@/components/Layout';

export const metadata: Metadata = {
  title: 'Bulk Email - SES Template Manager',
  description: 'Send bulk emails to your user base using SES templates',
};

export default function BulkEmail() {
  return (
    <Layout>
      <BulkEmailPageSimple />
    </Layout>
  );
}
