"use client"
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Search, FileText, PlusCircle, LogIn } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmailTemplate } from '@/types';
import { listTemplates } from '@/lib/aws-ses';
import EmailTemplateCard from './EmailTemplateCard';
import { toast } from 'sonner';

const EmailTemplateList: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const credentials = localStorage.getItem('awsCredentials');
    setIsLoggedIn(!!credentials);
  }, []);

  const loadTemplates = async () => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const data = await listTemplates(searchTerm);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates from AWS SES');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [searchTerm, isLoggedIn]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const onTemplateDeleted = () => {
    loadTemplates();
  };

  // If not logged in, show login prompt
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Login Required</h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          You need to log in with your AWS credentials to view and manage SES email templates.
        </p>
        <Button onClick={() => router.push('/login')}>
          <LogIn className="mr-2 h-4 w-4" />
          Login with AWS Credentials
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1>Email Templates</h1>
        <Link href="/templates/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </Link>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          className="pl-10"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="border rounded-lg p-6 h-[200px] animate-pulse bg-muted"
            />
          ))}
        </div>
      ) : templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <EmailTemplateCard 
              key={template.id} 
              template={template} 
              onDeleted={onTemplateDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "No templates match your search criteria" : "Create your first email template to get started"}
          </p>
          <Link href="/templates/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateList;
