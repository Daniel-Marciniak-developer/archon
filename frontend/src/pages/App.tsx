import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Code, Github, Shield, Zap, ArrowRight } from "lucide-react";
import { useUser } from "@stackframe/react";
import { stackClientApp } from "app/auth";
import { useNavigate } from "react-router-dom";

export default function App() {
const user = useUser();
  const navigate = useNavigate();

  // Debug logging
  console.log('🏠 App: Current user state:', user ? 'LOGGED IN' : 'LOGGED OUT');
  console.log('🏠 App: User details:', user);

  const handleGetStarted = async () => {
    if (user) {
      // User is already logged in, go to dashboard
      navigate("/dashboard");
    } else {
      // User is not logged in, redirect to Stack Auth sign-in page with prompt=login
      // This will force showing the login screen even if there's a session
      const signInUrl = new URL(stackClientApp.urls.signIn, window.location.origin);
      signInUrl.searchParams.set('prompt', 'login');
      window.location.href = signInUrl.toString();
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(var(--crystal-void))" }}>
      {/* Navigation */}
      <nav className="w-full p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 crystal-electric flex items-center justify-center">
              <Code className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold crystal-electric">Archon</span>
          </div>
          {user && (
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard")}
              className="border-crystal-border hover:bg-crystal-surface"
            >
              Dashboard
            </Button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              AI-Powered Code Analysis for
              <span className="crystal-electric"> Python Projects</span>
            </h1>
            <p className="text-xl" style={{ color: "hsl(var(--crystal-text-secondary))" }}>
              Connect your GitHub repository and get comprehensive insights into your code quality,
              security, architecture, and dependencies. All in one beautiful dashboard.
            </p>
          </div>

          {/* CTA Button */}
          <div className="mb-16">
            <Button
              onClick={handleGetStarted}
              className="crystal-btn-primary px-8 py-6 text-lg font-semibold rounded-lg crystal-glow group"
              size="lg"
            >
              {user ? "Go to Dashboard" : "Analyze Your First Project"}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="mt-4 text-sm" style={{ color: "hsl(var(--crystal-text-secondary))" }}>
              {user ? "Welcome back!" : "Free GitHub authentication • No credit card required"}
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="crystal-glass p-6 rounded-lg border-crystal-border">
              <div className="flex items-center justify-center w-12 h-12 crystal-electric mb-4 mx-auto">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Security Analysis</h3>
              <p style={{ color: "hsl(var(--crystal-text-secondary))" }}>
                Detect vulnerabilities, insecure patterns, and potential security risks in your codebase.
              </p>
            </Card>

            <Card className="crystal-glass p-6 rounded-lg border-crystal-border">
              <div className="flex items-center justify-center w-12 h-12 crystal-electric mb-4 mx-auto">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Code Quality</h3>
              <p style={{ color: "hsl(var(--crystal-text-secondary))" }}>
                Analyze readability, maintainability, and adherence to Python best practices.
              </p>
            </Card>

            <Card className="crystal-glass p-6 rounded-lg border-crystal-border">
              <div className="flex items-center justify-center w-12 h-12 crystal-electric mb-4 mx-auto">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-3">Architecture Insights</h3>
              <p style={{ color: "hsl(var(--crystal-text-secondary))" }}>
                Get recommendations for improving your project structure and dependencies.
              </p>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20">
        <div className="text-center" style={{ color: "hsl(var(--crystal-text-secondary))" }}>
          <p>&copy; 2024 Archon. Elevate your Python code quality.</p>
        </div>
      </footer>
    </div>
  );
}


