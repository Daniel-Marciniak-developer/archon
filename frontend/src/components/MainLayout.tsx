import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useUserGuardContext } from "app/auth";
import { stackClientApp } from "app/auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Code, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  User 
} from "lucide-react";
import { cn } from "utils/cn";

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ icon: Icon, label, path, isActive, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
        isActive
          ? "crystal-electric bg-crystal-surface/50 crystal-glow"
          : "text-crystal-text-secondary hover:text-crystal-text-primary hover:bg-crystal-surface/30"
      )}
    >
      <Icon className={cn("w-5 h-5", isActive ? "crystal-electric" : "")} />
      <span className="font-medium">{label}</span>
    </button>
  );
}

function UserButton() {
  const { user } = useUserGuardContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {



      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('stack') || key.includes('auth') || key.includes('dtbn') || key.includes('token'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));


      document.cookie.split(";").forEach(function(c) {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
      });


      sessionStorage.clear();


      await stackClientApp.signOut();


      try {

        await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {});
      } catch (e) {

      }





      window.location.replace("/");
    } catch (error) {


      window.location.replace("/");
    }
  };

  const getInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-crystal-surface/30"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback className="bg-crystal-electric text-crystal-text-primary text-sm">
              {user.primaryEmail ? getInitials(user.primaryEmail) : <User className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium text-crystal-text-primary truncate">
              {user.displayName || user.primaryEmail?.split('@')[0] || 'User'}
            </div>
            {user.primaryEmail && (
              <div className="text-xs text-crystal-text-secondary truncate">
                {user.primaryEmail}
              </div>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 crystal-glass border-crystal-border" 
        align="end" 
        side="right"
      >
        <DropdownMenuItem className="hover:bg-crystal-surface/50">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="hover:bg-crystal-surface/50">
          <Settings className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-crystal-border" />
        <DropdownMenuItem 
          className="hover:bg-crystal-surface/50 text-crystal-critical focus:text-crystal-critical"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/dashboard"
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/settings"
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "hsl(var(--crystal-void))" }}>
      {}
      <aside className="w-64 flex-shrink-0 crystal-glass border-r border-crystal-border">
        <div className="flex flex-col h-full p-6">
          {}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 crystal-electric flex items-center justify-center rounded-lg crystal-glow">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold crystal-electric">Archon</h1>
              <p className="text-xs text-crystal-text-secondary">Code Analysis</p>
            </div>
          </div>

          {}
          <nav className="flex-1 space-y-2">
            {navigationItems.map((item) => (
              <NavItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isActive={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
              />
            ))}
          </nav>

          {}
          <div className="border-t border-crystal-border pt-4">
            <UserButton />
          </div>
        </div>
      </aside>

      {}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

