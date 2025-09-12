
import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteTemplate } from '@/lib/aws-ses';
import { useToast } from '@/components/ui/use-toast';

interface DeleteTemplateDialogProps {
  isOpen: boolean;
  templateId: string;
  templateName: string;
  onClose: () => void;
  onDeleted: () => void;
}

const DeleteTemplateDialog: React.FC<{
  children?: React.ReactNode;
}> = ({
  isOpen,
  templateId,
  templateName,
  onClose,
  onDeleted,
  children
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteTemplate(templateId);
      toast({
        title: "Success",
        description: `Template "${templateName}" has been deleted.`
      });
      onDeleted();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the template. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Delete Template
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the template <strong>"{templateName}"</strong>? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteTemplateDialog;
