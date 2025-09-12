import { Metadata } from 'next';
import Index from '@/components/Index';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Home page - Access and manage your content',
};

export default function IndexPage() {
  return <Index />;
}