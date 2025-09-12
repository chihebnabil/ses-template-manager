'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertTriangle, 
  Users, 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Eye,
  Settings,
  LogIn
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { listTemplates } from '@/lib/aws-ses';
import { 
  sendBulkTemplatedEmails, 
  estimateBulkEmail, 
  BulkEmailRequest, 
  BulkEmailProgress 
} from '@/lib/bulk-email';
import { FirebaseUser, UserFilters } from '@/lib/firebase-users';
import { EmailTemplate } from '@/types';

const BulkEmailPage = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [fromEmail, setFromEmail] = useState<string>('');
  const [templateData, setTemplateData] = useState<string>('{}');
  const [userFilters, setUserFilters] = useState<UserFilters>({});
  const [maxUsers, setMaxUsers] = useState<number>(1000);
  const [batchSize, setBatchSize] = useState<number>(10);
  const [delayBetweenBatches, setDelayBetweenBatches] = useState<number>(1000);
  
  // Estimation states
  const [estimatedUsers, setEstimatedUsers] = useState<number>(0);
  const [sampleUsers, setSampleUsers] = useState<FirebaseUser[]>([]);
  const [isEstimating, setIsEstimating] = useState<boolean>(false);
  
  // Sending states
  const [isSending, setIsSending] = useState<boolean>(false);
  const [progress, setProgress] = useState<BulkEmailProgress | null>(null);
  const [sendComplete, setSendComplete] = useState<boolean>(false);
  
  // Form states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('setup');
  const router = useRouter();

  // Check login status
  useEffect(() => {
    const credentials = localStorage.getItem('awsCredentials');
    setIsLoggedIn(!!credentials);
  }, []);

  // Load templates on component mount
  useEffect(() => {
    const loadTemplates = async () => {
      if (!isLoggedIn) {
        setIsLoading(false);
        return;
      }

      try {
        const templateList = await listTemplates();
        setTemplates(templateList);
      } catch (error) {
        toast.error('Failed to load email templates');
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, [isLoggedIn]);

  // Handle template data JSON validation
  const validateTemplateData = (value: string) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  };

  // Handle estimation
  const handleEstimate = async () => {
    setIsEstimating(true);
    try {
      const result = await estimateBulkEmail(userFilters, maxUsers);
      setEstimatedUsers(result.estimatedUsers);
      setSampleUsers(result.sampleUsers);
      
      if (result.estimatedUsers === 0) {
        toast.warning('No users found matching the specified criteria');
      } else {
        toast.success(`Found ${result.estimatedUsers} users matching your criteria`);
        setActiveTab('preview');
      }
    } catch (error) {
      toast.error('Failed to estimate user count');
    } finally {
      setIsEstimating(false);
    }
  };

  // Handle bulk email send
  const handleSendBulkEmail = async () => {
    if (!selectedTemplate || !fromEmail) {
      toast.error('Please select a template and enter from email');
      return;
    }

    if (!validateTemplateData(templateData)) {
      toast.error('Invalid JSON in template data');
      return;
    }

    setIsSending(true);
    setSendComplete(false);
    setProgress(null);

    try {
      const request: BulkEmailRequest = {
        templateName: selectedTemplate,
        fromEmail,
        templateData: JSON.parse(templateData),
        userFilters,
        maxUsers,
        batchSize,
        delayBetweenBatches
      };

      await sendBulkTemplatedEmails(request, (progressData) => {
        setProgress(progressData);
        if (progressData.isComplete) {
          setSendComplete(true);
          setActiveTab('results');
        }
      });
    } catch (error) {
      toast.error('Failed to send bulk emails');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  // If not logged in, show login prompt
  if (!isLoggedIn) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Mail className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Login Required</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            You need to log in with your AWS credentials to access the bulk email feature.
          </p>
          <Button onClick={() => router.push('/login')}>
            <LogIn className="mr-2 h-4 w-4" />
            Login with AWS Credentials
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Mail className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Bulk Email Campaign</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="filters">User Filters</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Email Configuration</span>
              </CardTitle>
              <CardDescription>
                Configure your bulk email campaign settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template">Email Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.TemplateName}>
                          {template.TemplateName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromEmail">From Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    placeholder="noreply@example.com"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="templateData">Template Data (JSON)</Label>
                <Textarea
                  id="templateData"
                  placeholder='{"company_name": "Your Company", "campaign_name": "Winter Sale"}'
                  value={templateData}
                  onChange={(e) => setTemplateData(e.target.value)}
                  rows={4}
                />
                {!validateTemplateData(templateData) && templateData.trim() && (
                  <p className="text-sm text-red-600">Invalid JSON format</p>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUsers">Max Users</Label>
                  <Input
                    id="maxUsers"
                    type="number"
                    min="1"
                    max="10000"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(parseInt(e.target.value) || 1000)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batchSize">Batch Size</Label>
                  <Input
                    id="batchSize"
                    type="number"
                    min="1"
                    max="50"
                    value={batchSize}
                    onChange={(e) => setBatchSize(parseInt(e.target.value) || 10)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delay">Delay (ms)</Label>
                  <Input
                    id="delay"
                    type="number"
                    min="0"
                    max="10000"
                    value={delayBetweenBatches}
                    onChange={(e) => setDelayBetweenBatches(parseInt(e.target.value) || 1000)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>User Filters</span>
              </CardTitle>
              <CardDescription>
                Filter which users will receive the bulk email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="searchQuery">Search Users</Label>
                  <Input
                    id="searchQuery"
                    placeholder="Search by email or name"
                    value={userFilters.searchQuery || ''}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailDomain">Email Domain</Label>
                  <Input
                    id="emailDomain"
                    placeholder="gmail.com"
                    value={userFilters.emailDomain || ''}
                    onChange={(e) => setUserFilters(prev => ({ ...prev, emailDomain: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emailVerified"
                    checked={userFilters.emailVerified ?? true}
                    onCheckedChange={(checked) => 
                      setUserFilters(prev => ({ ...prev, emailVerified: checked as boolean }))
                    }
                  />
                  <Label htmlFor="emailVerified">Email verified users only</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="activeUsers"
                    checked={userFilters.disabled === false}
                    onCheckedChange={(checked) => 
                      setUserFilters(prev => ({ ...prev, disabled: !checked as boolean }))
                    }
                  />
                  <Label htmlFor="activeUsers">Active users only (not disabled)</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="provider">Authentication Provider</Label>
                <Select 
                  value={userFilters.provider || 'all'} 
                  onValueChange={(value) => 
                    setUserFilters(prev => ({ ...prev, provider: value === 'all' ? undefined : value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All providers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All providers</SelectItem>
                    <SelectItem value="password">Email/Password</SelectItem>
                    <SelectItem value="google.com">Google</SelectItem>
                    <SelectItem value="facebook.com">Facebook</SelectItem>
                    <SelectItem value="github.com">GitHub</SelectItem>
                    <SelectItem value="twitter.com">Twitter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="createdAfter">Created After</Label>
                  <Input
                    id="createdAfter"
                    type="date"
                    value={userFilters.createdAfter?.toISOString().split('T')[0] || ''}
                    onChange={(e) => 
                      setUserFilters(prev => ({ 
                        ...prev, 
                        createdAfter: e.target.value ? new Date(e.target.value) : undefined 
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="createdBefore">Created Before</Label>
                  <Input
                    id="createdBefore"
                    type="date"
                    value={userFilters.createdBefore?.toISOString().split('T')[0] || ''}
                    onChange={(e) => 
                      setUserFilters(prev => ({ 
                        ...prev, 
                        createdBefore: e.target.value ? new Date(e.target.value) : undefined 
                      }))
                    }
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleEstimate}
                  disabled={isEstimating}
                  className="w-full"
                >
                  {isEstimating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Estimating...
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview Recipients
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Campaign Preview</span>
              </CardTitle>
              <CardDescription>
                Review your campaign before sending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{estimatedUsers}</div>
                    <p className="text-xs text-muted-foreground">Recipients</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{selectedTemplate}</div>
                    <p className="text-xs text-muted-foreground">Template</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{Math.ceil(estimatedUsers / batchSize)}</div>
                    <p className="text-xs text-muted-foreground">Batches</p>
                  </CardContent>
                </Card>
              </div>

              {sampleUsers.length > 0 && (
                <div className="space-y-2">
                  <Label>Sample Recipients</Label>
                  <div className="border rounded-lg p-4 space-y-2">
                    {sampleUsers.map((user) => (
                      <div key={user.uid} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div>
                          <p className="font-medium">{user.email}</p>
                          {user.displayName && (
                            <p className="text-sm text-muted-foreground">{user.displayName}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={user.emailVerified ? "default" : "secondary"} className="text-xs">
                              {user.emailVerified ? "Verified" : "Unverified"}
                            </Badge>
                            <Badge variant={user.disabled ? "destructive" : "default"} className="text-xs">
                              {user.disabled ? "Disabled" : "Active"}
                            </Badge>
                            {user.providerData.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {user.providerData[0].providerId === 'password' ? 'Email' : 
                                 user.providerData[0].providerId.replace('.com', '')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {estimatedUsers > 0 && !isSending && !sendComplete && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You are about to send {estimatedUsers} emails. This action cannot be undone.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-4">
                <Button
                  onClick={handleSendBulkEmail}
                  disabled={isSending || estimatedUsers === 0 || !selectedTemplate || !fromEmail}
                  className="flex-1"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Bulk Email
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleEstimate} disabled={isSending}>
                  Refresh Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {sendComplete ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                <span>Campaign Results</span>
              </CardTitle>
              <CardDescription>
                Track the progress and results of your bulk email campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {progress && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress.processedUsers}/{progress.totalUsers}</span>
                    </div>
                    <Progress 
                      value={(progress.processedUsers / progress.totalUsers) * 100} 
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{progress.successCount}</div>
                        <p className="text-xs text-muted-foreground">Sent Successfully</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-600">{progress.failureCount}</div>
                        <p className="text-xs text-muted-foreground">Failed</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{progress.currentBatch}</div>
                        <p className="text-xs text-muted-foreground">Current Batch</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{progress.totalBatches}</div>
                        <p className="text-xs text-muted-foreground">Total Batches</p>
                      </CardContent>
                    </Card>
                  </div>

                  {progress.errors.length > 0 && (
                    <div className="space-y-2">
                      <Label>Errors</Label>
                      <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                        {progress.errors.map((error, index) => (
                          <div key={index} className="flex items-center space-x-2 py-2 border-b last:border-b-0">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="font-medium">{error.userEmail}</span>
                            <span className="text-sm text-muted-foreground">- {error.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {!progress && !isSending && (
                <div className="text-center py-8 text-muted-foreground">
                  No campaign results yet. Start a campaign to see results here.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  );
};

export default BulkEmailPage;
