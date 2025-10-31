import { Metadata } from 'next';
import Index from '@/components/Index';

export const metadata: Metadata = {
  title: 'Templates - SES Template Manager',
  description: 'Manage your AWS SES email templates',
};

export default function IndexPage() {
  return <Index />;
}