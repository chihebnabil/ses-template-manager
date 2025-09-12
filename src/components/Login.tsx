'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import LoginModal from '@/components/LoginModal';

const Login = () => {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if already logged in
    const credentials = localStorage.getItem('awsCredentials');
    if (credentials) {
      router.push('/');
    }
  }, [router]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      router.push('/');
    }
  };

  return <LoginModal isOpen={isOpen} onOpenChange={handleOpenChange} />;
};

export default Login;
