
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginModal from '@/components/LoginModal';

const Login = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in
    const credentials = localStorage.getItem('awsCredentials');
    if (credentials) {
      navigate('/');
    }
  }, [navigate]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      navigate('/');
    }
  };

  return <LoginModal isOpen={isOpen} onOpenChange={handleOpenChange} />;
};

export default Login;
