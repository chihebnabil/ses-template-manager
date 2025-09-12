
import React, { useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { sendTemplatedEmail } from '@/lib/aws-ses';

interface SendTestEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  templateName: string;
}

const SendTestEmailDialog: React.FC<{
  children?: React.ReactNode;
}> = ({
  isOpen,
  onClose,
  templateName,
  children
}) => {
  const [fromEmail, setFromEmail] = useState<string>('');
  const [toEmails, setToEmails] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!fromEmail.trim()) {
      toast.error("Please enter a sender email address");
      return;
    }
    
    if (!toEmails.trim()) {
      toast.error("Please enter at least one recipient email address");
      return;
    }
    
    // Check if email format is valid (simple validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromEmail)) {
      toast.error("Please enter a valid sender email address");
      return;
    }
    
    const recipients = toEmails.split(',').map(email => email.trim());
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email format: ${invalidEmails.join(', ')}`);
      return;
    }

    setIsSending(true);
    
    try {
      const messageId = await sendTemplatedEmail(
        templateName,
        fromEmail,
        recipients
      );
      
      toast.success(`Email sent successfully! Message ID: ${messageId}`);
      onClose();
    } catch (error: any) {
      console.error('Failed to send email:', error);
      
      // Handle specific AWS SES errors
      if (error.name === 'MessageRejected') {
        toast.error("Email rejected: Your account may be in sandbox mode. Verify your sending limits and that recipient emails are verified.");
      } else {
        toast.error(`Failed to send email: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Test Email</DialogTitle>
          <DialogDescription>
            Send a test email using the template "{templateName}".
            {' '}
            <span className="text-amber-500">
              Note: In SES sandbox mode, both sender and recipient emails must be verified.
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="fromEmail">From (Sender Email)</Label>
            <Input
              id="fromEmail"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="sender@example.com"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="toEmails">
              To (Recipient Emails, comma separated)
            </Label>
            <Input
              id="toEmails"
              value={toEmails}
              onChange={(e) => setToEmails(e.target.value)}
              placeholder="recipient1@example.com, recipient2@example.com"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
              "Sending..."
            ) : (
              <>
                <SendHorizontal className="w-4 h-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendTestEmailDialog;
