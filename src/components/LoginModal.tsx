
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { SESClient, ListTemplatesCommand } from '@aws-sdk/client-ses';

interface LoginModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onOpenChange }) => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async () => {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      toast.error('Please enter your AWS credentials');
      return;
    }

    setIsLoggingIn(true);
    
    try {
      // Verify credentials by making a test API call
      const client = new SESClient({
        region: credentials.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        }
      });
      
      // Try to list templates to verify credentials work
      await client.send(new ListTemplatesCommand({}));
      
      // Store in localStorage (not secure for real AWS credentials!)
      localStorage.setItem('awsCredentials', JSON.stringify(credentials));
      
      toast.success('Successfully logged in');
      onOpenChange(false);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login to SES Template Manager</DialogTitle>
          <DialogDescription>
            Enter your AWS credentials to manage SES templates.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="region">AWS Region</Label>
            <Input
              id="region"
              name="region"
              value={credentials.region}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="accessKeyId">Access Key ID</Label>
            <Input
              id="accessKeyId"
              name="accessKeyId"
              value={credentials.accessKeyId}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="secretAccessKey">Secret Access Key</Label>
            <Input
              id="secretAccessKey"
              name="secretAccessKey"
              type="password"
              value={credentials.secretAccessKey}
              onChange={handleInputChange}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleLogin} 
            disabled={isLoggingIn}
          >
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
