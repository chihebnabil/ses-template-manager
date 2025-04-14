
import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Edit, MoreVertical, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { EmailTemplate } from '@/types';
import DeleteTemplateDialog from './DeleteTemplateDialog';

interface EmailTemplateCardProps {
  template: EmailTemplate;
  onDeleted: () => void;
}

const EmailTemplateCard: React.FC<EmailTemplateCardProps> = ({ template, onDeleted }) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  return (
    <>
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg truncate" title={template.TemplateName}>
              {template.TemplateName}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/templates/${template.id}`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <Link to={`/templates/${template.id}`}>
          <CardContent className="pb-2">
            <p className="text-sm text-muted-foreground mb-2 truncate" title={template.SubjectPart}>
              Subject: {template.SubjectPart}
            </p>
            <div className="text-sm h-16 overflow-hidden relative">
              <div dangerouslySetInnerHTML={{ __html: template.HtmlPart.substring(0, 100) }} />
              {template.HtmlPart.length > 100 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
              )}
            </div>
          </CardContent>
        </Link>
        <CardFooter className="pt-2 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Updated {formatDate(template.updatedAt)}</span>
          </div>
        </CardFooter>
      </Card>

      <DeleteTemplateDialog
        isOpen={showDeleteDialog}
        templateId={template.id}
        templateName={template.TemplateName}
        onClose={() => setShowDeleteDialog(false)}
        onDeleted={onDeleted}
      />
    </>
  );
};

export default EmailTemplateCard;
