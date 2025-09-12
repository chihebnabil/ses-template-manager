'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Users, Send, CheckCircle, AlertCircle, Search } from 'lucide-react';
import { FirebaseAuthUser } from '@/app/api/users/route';
import { fetchAllUsers } from '@/lib/firebase-users-simple';
import { EmailTemplate } from '@/types';

interface EmailJob {
    id: string;
    templateId: string;
    userIds: string[];
    subject: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    totalEmails: number;
    sentEmails: number;
    failedEmails: number;
    createdAt: Date;
    completedAt?: Date;
    errors: string[];
}

interface BulkEmailRequest {
    templateId: string;
    userIds: string[];
    subject: string;
}

export default function BulkEmailPageSimple() {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState<FirebaseAuthUser[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [customSubject, setCustomSubject] = useState('');
    const [emailJobs, setEmailJobs] = useState<EmailJob[]>([]);
    const [currentJob, setCurrentJob] = useState<EmailJob | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load users on component mount
    useEffect(() => {
        loadUsers();
        loadTemplates();
    }, []);

    const loadUsers = async () => {
        setIsLoadingUsers(true);
        setError(null);
        try {
            const allUsers = await fetchAllUsers();
            setUsers(allUsers);
        } catch (err) {
            setError('Failed to load users from Firebase Auth');
            console.error('Error loading users:', err);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const loadTemplates = async () => {
        setIsLoadingTemplates(true);
        try {
            const data = await apiClient.get('/api/templates');
            setTemplates(data.templates || []);
        } catch (err) {
            console.error('Error loading templates:', err);
            setError('Failed to load email templates. Please check your authentication and try again.');
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    // Filter users based on search query
    const filteredUsers = users.filter(user => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            user.email?.toLowerCase().includes(query) ||
            user.displayName?.toLowerCase().includes(query)
        );
    });

    const handleUserSelection = (userId: string, checked: boolean) => {
        const newSelection = new Set(selectedUserIds);
        if (checked) {
            newSelection.add(userId);
        } else {
            newSelection.delete(userId);
        }
        setSelectedUserIds(newSelection);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUserIds(new Set(filteredUsers.map(user => user.uid)));
        } else {
            setSelectedUserIds(new Set());
        }
    };

    const selectedUsers = users.filter(user => selectedUserIds.has(user.uid));

    const sendBulkEmail = async () => {
        if (!selectedTemplateId || selectedUserIds.size === 0) {
            setError('Please select a template and at least one user');
            return;
        }

        setError(null);
        const newJob: EmailJob = {
            id: Date.now().toString(),
            templateId: selectedTemplateId,
            userIds: Array.from(selectedUserIds),
            subject: customSubject,
            status: 'pending',
            progress: 0,
            totalEmails: selectedUserIds.size,
            sentEmails: 0,
            failedEmails: 0,
            createdAt: new Date(),
            errors: []
        };

        setCurrentJob(newJob);
        setEmailJobs(prev => [newJob, ...prev]);
        setActiveTab('results');

        try {
            const request: BulkEmailRequest = {
                templateId: selectedTemplateId,
                userIds: Array.from(selectedUserIds),
                subject: customSubject
            };

            const response = await apiClient.fetch('/api/bulk-email', {
                method: 'POST',
                body: JSON.stringify(request)
            });

            if (!response.ok) {
                throw new Error('Failed to send bulk email');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response stream');

            // Read the streaming response
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            
                            setCurrentJob(prev => {
                                if (!prev) return null;
                                const updated = {
                                    ...prev,
                                    status: data.status,
                                    progress: data.progress,
                                    sentEmails: data.sent,
                                    failedEmails: data.failed,
                                    errors: data.errors || []
                                };
                                
                                if (data.status === 'completed' || data.status === 'failed') {
                                    updated.completedAt = new Date();
                                }
                                
                                return updated;
                            });

                            setEmailJobs(prev => prev.map(job => 
                                job.id === newJob.id 
                                    ? { ...job, ...data, completedAt: data.status === 'completed' || data.status === 'failed' ? new Date() : undefined }
                                    : job
                            ));

                        } catch (e) {
                            console.error('Error parsing stream data:', e);
                        }
                    }
                }
            }

        } catch (err) {
            console.error('Error sending bulk email:', err);
            setError('Failed to send bulk email');
            
            setCurrentJob(prev => prev ? { ...prev, status: 'failed' } : null);
            setEmailJobs(prev => prev.map(job => 
                job.id === newJob.id ? { ...job, status: 'failed' } : job
            ));
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center space-x-2">
                <Mail className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Bulk Email Sender</h1>
                <Badge variant="secondary">Firebase Auth Users</Badge>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="users" className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Select Users</span>
                        {selectedUserIds.size > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {selectedUserIds.size}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="setup" className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>Email Setup</span>
                    </TabsTrigger>
                    <TabsTrigger value="results" className="flex items-center space-x-2">
                        <Send className="h-4 w-4" />
                        <span>Send & Results</span>
                    </TabsTrigger>
                </TabsList>

                {/* Users Selection Tab */}
                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Firebase Auth Users</span>
                                <Button 
                                    onClick={loadUsers} 
                                    disabled={isLoadingUsers}
                                    variant="outline"
                                    size="sm"
                                >
                                    {isLoadingUsers ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : null}
                                    Refresh Users
                                </Button>
                            </CardTitle>
                            <CardDescription>
                                Select Firebase Auth users to send emails to. Only active users with emails are shown.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Search and Select All */}
                            <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search users by email or name..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="select-all"
                                        checked={filteredUsers.length > 0 && filteredUsers.every(user => selectedUserIds.has(user.uid))}
                                        onCheckedChange={handleSelectAll}
                                    />
                                    <Label htmlFor="select-all">Select All ({filteredUsers.length})</Label>
                                </div>
                            </div>

                            {isLoadingUsers ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                    <span>Loading users from Firebase Auth...</span>
                                </div>
                            ) : error ? (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto border rounded-md p-4">
                                    {filteredUsers.length === 0 ? (
                                        <div className="text-center text-gray-500 p-4">
                                            {searchQuery.trim() ? 'No users found matching your search.' : 'No users found in Firebase Auth.'}
                                        </div>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <div
                                                key={user.uid}
                                                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded"
                                            >
                                                <Checkbox
                                                    checked={selectedUserIds.has(user.uid)}
                                                    onCheckedChange={(checked) => 
                                                        handleUserSelection(user.uid, checked as boolean)
                                                    }
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium">{user.email}</div>
                                                    {user.displayName && (
                                                        <div className="text-sm text-gray-500">{user.displayName}</div>
                                                    )}
                                                    <div className="text-xs text-gray-400">
                                                        Created: {new Date(user.createdAt).toLocaleDateString()}
                                                        {user.emailVerified && (
                                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                                Verified
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {selectedUserIds.size > 0 && (
                                <div className="p-3 bg-blue-50 rounded-md">
                                    <div className="text-sm font-medium text-blue-800">
                                        {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''} selected
                                    </div>
                                    <Button
                                        onClick={() => setActiveTab('setup')}
                                        className="mt-2"
                                        size="sm"
                                    >
                                        Continue to Email Setup
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Email Setup Tab */}
                <TabsContent value="setup" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Configuration</CardTitle>
                            <CardDescription>
                                Choose your email template and configure the sending parameters.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="template">Email Template</Label>
                                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} disabled={isLoadingTemplates}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={isLoadingTemplates ? "Loading templates..." : "Select a template"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map((template) => (
                                            <SelectItem key={template.TemplateName} value={template.TemplateName}>
                                                {template.TemplateName}
                                            </SelectItem>
                                        ))}
                                        {templates.length === 0 && !isLoadingTemplates && (
                                            <SelectItem value="" disabled>
                                                No templates found
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                {isLoadingTemplates && (
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Loading SES templates...
                                    </div>
                                )}
                                {templates.length === 0 && !isLoadingTemplates && (
                                    <div className="text-sm text-red-600">
                                        No email templates found. Please create SES templates first or check your AWS configuration.
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subject">Custom Subject (Optional)</Label>
                                <Input
                                    id="subject"
                                    placeholder="Leave empty to use template subject"
                                    value={customSubject}
                                    onChange={(e) => setCustomSubject(e.target.value)}
                                />
                            </div>

                            {selectedUserIds.size > 0 && (
                                <div className="space-y-4">
                                    <Separator />
                                    <div>
                                        <h3 className="font-medium mb-2">Selected Recipients ({selectedUserIds.size})</h3>
                                        <div className="max-h-32 overflow-y-auto p-2 border rounded">
                                            {selectedUsers.map((user) => (
                                                <div key={user.uid} className="text-sm py-1">
                                                    {user.email} {user.displayName && `(${user.displayName})`}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={sendBulkEmail}
                                        disabled={!selectedTemplateId}
                                        className="w-full"
                                        size="lg"
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        Send Email to {selectedUserIds.size} Recipients
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Results Tab */}
                <TabsContent value="results" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Campaign Results</CardTitle>
                            <CardDescription>
                                Track the progress and status of your bulk email campaigns.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {currentJob && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium">Current Campaign</h3>
                                        <Badge 
                                            variant={
                                                currentJob.status === 'completed' ? 'default' : 
                                                currentJob.status === 'failed' ? 'destructive' : 
                                                'secondary'
                                            }
                                        >
                                            {currentJob.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Progress</span>
                                            <span>{currentJob.sentEmails}/{currentJob.totalEmails} sent</span>
                                        </div>
                                        <Progress value={currentJob.progress} className="w-full" />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <div className="text-2xl font-bold text-green-600">{currentJob.sentEmails}</div>
                                            <div className="text-xs text-gray-500">Sent</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-red-600">{currentJob.failedEmails}</div>
                                            <div className="text-xs text-gray-500">Failed</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-blue-600">{currentJob.totalEmails}</div>
                                            <div className="text-xs text-gray-500">Total</div>
                                        </div>
                                    </div>

                                    {currentJob.errors.length > 0 && (
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-red-600">Errors</h4>
                                            <div className="max-h-32 overflow-y-auto p-2 border border-red-200 rounded bg-red-50">
                                                {currentJob.errors.map((error, index) => (
                                                    <div key={index} className="text-sm text-red-700">
                                                        {error}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {emailJobs.length === 0 && !currentJob && (
                                <div className="text-center text-gray-500 p-8">
                                    No email campaigns yet. Configure your email and recipients to get started.
                                </div>
                            )}

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* Campaign History */}
                    {emailJobs.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Campaign History</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {emailJobs.map((job) => (
                                        <div key={job.id} className="flex items-center justify-between p-3 border rounded">
                                            <div>
                                                <div className="font-medium">Template: {job.templateId}</div>
                                                <div className="text-sm text-gray-500">
                                                    {job.createdAt.toLocaleString()} • {job.totalEmails} recipients
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge 
                                                    variant={
                                                        job.status === 'completed' ? 'default' : 
                                                        job.status === 'failed' ? 'destructive' : 
                                                        'secondary'
                                                    }
                                                >
                                                    {job.status}
                                                </Badge>
                                                {job.status === 'completed' && (
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        {job.sentEmails} sent, {job.failedEmails} failed
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
