import { NextRequest, NextResponse } from 'next/server';
import { SESClient, ListTemplatesCommand, GetTemplateCommand } from '@aws-sdk/client-ses';
import { EmailTemplate } from '@/types';
import { fixTemplateEmojis } from '@/lib/emoji-utils';
import { AuthMiddleware, getClientIp } from '@/lib/auth-middleware';

// Initialize SES client with server-side environment variables
const getSESClient = (): SESClient => {
    return new SESClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    });
};

export async function GET(request: NextRequest) {
    try {
        // Authenticate the request
        const authResult = await AuthMiddleware.authenticate(request, {
            requireApiKey: true,
            requireFirebaseAuth: true,
            requireAdmin: false,
            validateOrigin: true,
            validateAwsCredentials: true
        });

        if (!authResult.success) {
            console.warn('Unauthorized templates access attempt:', authResult.error);
            return authResult.response!;
        }

        const { context } = authResult;
        
        // Log template access for audit
        console.log('Templates API accessed:', {
            userId: context?.userId,
            userEmail: context?.userEmail,
            timestamp: new Date().toISOString(),
            clientIp: getClientIp(request)
        });

        const { searchParams } = new URL(request.url);
        const searchTerm = searchParams.get('search') || undefined;

        const sesClient = getSESClient();

        // List all templates
        const listCommand = new ListTemplatesCommand({
            MaxItems: 100
        });
        
        const listResult = await sesClient.send(listCommand);
        const templateNames = listResult.TemplatesMetadata || [];

        // Get detailed information for each template
        const templates: EmailTemplate[] = [];
        
        for (const templateMeta of templateNames) {
            if (!templateMeta.Name) continue;
            
            // Filter by search term if provided
            if (searchTerm && !templateMeta.Name.toLowerCase().includes(searchTerm.toLowerCase())) {
                continue;
            }

            try {
                const getCommand = new GetTemplateCommand({
                    TemplateName: templateMeta.Name
                });
                
                const templateResult = await sesClient.send(getCommand);
                const template = templateResult.Template;
                
                if (template) {
                    const templateData = {
                        id: template.TemplateName || '',
                        TemplateName: template.TemplateName || '',
                        SubjectPart: template.SubjectPart || '',
                        HtmlPart: template.HtmlPart || '',
                        TextPart: template.TextPart || '',
                        createdAt: templateMeta.CreatedTimestamp || new Date(),
                        updatedAt: templateMeta.CreatedTimestamp || new Date()
                    };
                    
                    // Fix emoji encoding issues
                    templates.push(fixTemplateEmojis(templateData));
                }
            } catch (error) {
                console.error(`Error fetching template ${templateMeta.Name}:`, error);
                // Continue with other templates
            }
        }

        return NextResponse.json({
            templates,
            count: templates.length
        });

    } catch (error) {
        console.error('Error fetching SES templates:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch SES templates',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
