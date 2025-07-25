import React, { useState, useEffect } from "react";
import { useUserGuardContext, stackClientApp } from "app/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, User, Github, Mail, Shield, ExternalLink, Loader2 } from "lucide-react";
import { MainLayout } from "components/MainLayout";
import brain from "brain";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useUserGuardContext();
  const [githubStatus, setGithubStatus] = useState({
    connected: false,
    username: null,
    avatar_url: null,
    loading: true,
    error: null
  });
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {

    checkGitHubStatus();
  }, []);

  const checkGitHubStatus = async () => {
    try {

      setGithubStatus(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await brain.get_github_connection_status();
      const data = await response.json();
      

      setGithubStatus({ ...data, loading: false, error: null });
    } catch (error) {

      setGithubStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      toast.error('Failed to check GitHub connection status');
    }
  };

  const handleConnectGitHub = async () => {
    try {

      setConnecting(true);


      await stackClientApp.signInWithOAuth('github');


    } catch (error) {

      toast.error(`Failed to connect to GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setConnecting(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    try {

      setDisconnecting(true);
      
      const response = await brain.disconnect_github();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      

      setGithubStatus({
        connected: false,
        username: null,
        avatar_url: null,
        loading: false,
        error: null
      });
      toast.success('GitHub account disconnected successfully');
    } catch (error) {

      toast.error(`Failed to disconnect GitHub: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDisconnecting(false);
    }
  };

  const getInitials = (email: string) => {
    try {
      return email.split('@')[0].slice(0, 2).toUpperCase();
    } catch {
      return 'U';
    }
  };


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const githubConnected = urlParams.get('github_connected');
    const githubError = urlParams.get('github_error');
    
    if (githubConnected === 'true') {

      toast.success('GitHub account connected successfully!');
      checkGitHubStatus(); // Refresh status

      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (githubError === 'true') {

      toast.error('Failed to connect GitHub account. Please try again.');

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <MainLayout>
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          {}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p style={{ color: "hsl(var(--crystal-text-secondary))" }}>
              Manage your account preferences and project settings.
            </p>
          </div>

          <div className="space-y-6">
            {}
            <Card className="crystal-glass border-crystal-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 crystal-electric" />
                  <span>Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {}
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={user.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-crystal-electric text-crystal-text-primary text-lg">
                      {user.primaryEmail ? getInitials(user.primaryEmail) : <User className="w-8 h-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">
                      {user.displayName || 'Anonymous User'}
                    </h3>
                    {user.primaryEmail && (
                      <p className="text-sm" style={{ color: "hsl(var(--crystal-text-secondary))" }}>
                        {user.primaryEmail}
                      </p>
                    )}
                    <Button variant="outline" size="sm" className="border-crystal-border hover:bg-crystal-surface">
                      Change Avatar
                    </Button>
                  </div>
                </div>

                <Separator className="bg-crystal-border" />

                {}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      placeholder="Enter your display name"
                      value={user.displayName || ''}
                      className="bg-crystal-surface border-crystal-border focus:ring-crystal-electric"
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user.primaryEmail || ''}
                      className="bg-crystal-surface border-crystal-border"
                      readOnly
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="crystal-btn-primary" disabled>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {}
            <Card className="crystal-glass border-crystal-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Github className="w-5 h-5 crystal-electric" />
                  <span>Connected Accounts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {}
                  <div className="flex items-center justify-between p-4 rounded-lg crystal-surface">
                    <div className="flex items-center space-x-3">
                      <Github className="w-5 h-5" />
                      <div>
                        <p className="font-medium">GitHub</p>
                        <p className="text-sm" style={{ color: "hsl(var(--crystal-text-secondary))" }}>
                          {githubStatus.loading ? (
                            "Checking connection..."
                          ) : githubStatus.error ? (
                            "Error checking connection"
                          ) : githubStatus.connected ? (
                            `Connected as ${githubStatus.username || 'Unknown'}`
                          ) : (
                            "GitHub connection managed by Stack Auth"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {githubStatus.loading ? (
                        <Badge variant="outline" className="border-crystal-border">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Checking...
                        </Badge>
                      ) : githubStatus.error ? (
                        <>
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-crystal-critical" />
                            <span className="text-sm text-crystal-critical">Error</span>
                          </div>
                          <Button 
                            onClick={checkGitHubStatus}
                            variant="outline" 
                            size="sm"
                            className="border-crystal-border"
                          >
                            Retry
                          </Button>
                        </>
                      ) : githubStatus.connected ? (
                        <>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-crystal-ok"></div>
                            <span className="text-sm text-crystal-ok">Connected via Stack Auth</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-crystal-text-secondary"></div>
                            <span className="text-sm text-crystal-text-secondary">Managed by Stack Auth</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {!githubStatus.connected && !githubStatus.loading && !githubStatus.error && (
                    <div className="flex items-start space-x-2 p-3 rounded-lg bg-crystal-electric/5 border border-crystal-electric/20">
                      <AlertCircle className="w-5 h-5 crystal-electric mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium crystal-electric">GitHub Access Required</p>
                        <p className="text-sm text-crystal-text-secondary mt-1">
                          Connect your GitHub account to import and analyze your Python repositories. 
                          We only access repository metadata and code for analysis.
                        </p>
                      </div>
                    </div>
                  )}

                  {githubStatus.error && (
                    <div className="flex items-start space-x-2 p-3 rounded-lg bg-crystal-critical/5 border border-crystal-critical/20">
                      <AlertCircle className="w-5 h-5 text-crystal-critical mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-crystal-critical">Connection Error</p>
                        <p className="text-sm text-crystal-text-secondary mt-1">
                          {githubStatus.error}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {}
            <Card className="crystal-glass border-crystal-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 crystal-electric" />
                  <span>Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm" style={{ color: "hsl(var(--crystal-text-secondary))" }}>
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline" className="border-crystal-border hover:bg-crystal-surface">
                    Enable 2FA
                  </Button>
                </div>
                
                <Separator className="bg-crystal-border" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Active Sessions</p>
                    <p className="text-sm" style={{ color: "hsl(var(--crystal-text-secondary))" }}>
                      Manage your active login sessions
                    </p>
                  </div>
                  <Button variant="outline" className="border-crystal-border hover:bg-crystal-surface">
                    View Sessions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {}
            <Card className="crystal-glass border-crystal-border">
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm" style={{ color: "hsl(var(--crystal-text-secondary))" }}>
                      Receive notifications about analysis results
                    </p>
                  </div>
                  <Button variant="outline" className="border-crystal-border hover:bg-crystal-surface">
                    Configure
                  </Button>
                </div>
                
                <Separator className="bg-crystal-border" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Theme</p>
                    <p className="text-sm" style={{ color: "hsl(var(--crystal-text-secondary))" }}>
                      Crystal in Darkness (Default)
                    </p>
                  </div>
                  <Button variant="outline" className="border-crystal-border hover:bg-crystal-surface" disabled>
                    Dark Mode
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}



