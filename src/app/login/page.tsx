import { Metadata } from 'next';
import Login from '@/components/Login';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login page - Access and manage your content',
};

export default function LoginPage() {
  return <Login />;
}