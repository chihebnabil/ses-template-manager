import { Metadata } from 'next';
import BulkEmailPageSimple from '@/components/BulkEmailPageSimple';

export const metadata: Metadata = {
  title: 'Bulk Email',
  description: 'Send bulk emails to your user base using SES templates',
};

export default function BulkEmail() {
  return <BulkEmailPageSimple />;
}
