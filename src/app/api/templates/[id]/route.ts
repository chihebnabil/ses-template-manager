import { NextRequest, NextResponse } from 'next/server';
import { SESClient, GetTemplateCommand, UpdateTemplateCommand, DeleteTemplateCommand } from '@aws-sdk/client-ses';
import { AuthMiddleware, getClientIp } from '@/lib/auth-middleware';
import { fixTemplateEmojis } from '@/lib/emoji-utils';

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

// GET a single template by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Authenticate the request
        const authResult = await AuthMiddleware.authenticate(request, {
            requireApiKey: false,
            requireSession: true,
            validateOrigin: false,
            validateAwsCredentials: true
        });

        if (!authResult.success) {
            console.warn('Unauthorized template access attempt:', authResult.error);
            return authResult.response!;
        }

        const templateId = decodeURIComponent(params.id);
        const sesClient = getSESClient();

        const command = new GetTemplateCommand({
            TemplateName: templateId
        });

        const response = await sesClient.send(command);
        
        if (!response.Template) {
            return NextResponse.json(
                { error: 'Template not found' },
                { status: 404 }
            );
        }

        const template = {
            id: response.Template.TemplateName || '',
            TemplateName: response.Template.TemplateName || '',
            SubjectPart: response.Template.SubjectPart || '',
            HtmlPart: response.Template.HtmlPart || '',
            TextPart: response.Template.TextPart || '',
            CreatedTimestamp: new Date().toISOString()
        };

        return NextResponse.json(fixTemplateEmojis(template));

    } catch (error) {
        console.error('Error fetching template:', error);
        return NextResponse.json(
            { 
                error: 'Failed to fetch template',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// PUT to update a template
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Authenticate the request
        const authResult = await AuthMiddleware.authenticate(request, {
            requireApiKey: false,
            requireSession: true,
            validateOrigin: true,
            validateAwsCredentials: true
        });

        if (!authResult.success) {
            console.warn('Unauthorized template update attempt:', authResult.error);
            return authResult.response!;
        }

        const templateId = decodeURIComponent(params.id);
        const body = await request.json();
        const { TemplateName, SubjectPart, HtmlPart, TextPart } = body;

        if (!TemplateName || !SubjectPart) {
            return NextResponse.json(
                { error: 'Template name and subject are required' },
                { status: 400 }
            );
        }

        const sesClient = getSESClient();

        // If the template name is changing, we need to create new and delete old
        if (TemplateName !== templateId) {
            // TODO: Handle template rename (create new, delete old)
            return NextResponse.json(
                { error: 'Template renaming not supported yet' },
                { status: 400 }
            );
        }

        const command = new UpdateTemplateCommand({
            Template: {
                TemplateName: templateId,
                SubjectPart,
                HtmlPart: HtmlPart || '',
                TextPart: TextPart || ''
            }
        });

        await sesClient.send(command);

        const updatedTemplate = {
            id: templateId,
            TemplateName: templateId,
            SubjectPart,
            HtmlPart: HtmlPart || '',
            TextPart: TextPart || '',
            CreatedTimestamp: new Date().toISOString()
        };

        return NextResponse.json(fixTemplateEmojis(updatedTemplate));

    } catch (error) {
        console.error('Error updating template:', error);
        return NextResponse.json(
            { 
                error: 'Failed to update template',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// DELETE a template
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Authenticate the request
        const authResult = await AuthMiddleware.authenticate(request, {
            requireApiKey: false,
            requireSession: true,
            validateOrigin: true,
            validateAwsCredentials: true
        });

        if (!authResult.success) {
            console.warn('Unauthorized template deletion attempt:', authResult.error);
            return authResult.response!;
        }

        const templateId = decodeURIComponent(params.id);
        const sesClient = getSESClient();

        const command = new DeleteTemplateCommand({
            TemplateName: templateId
        });

        await sesClient.send(command);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting template:', error);
        return NextResponse.json(
            { 
                error: 'Failed to delete template',
                message: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
