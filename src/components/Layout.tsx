'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Mail, LogIn, LogOut, User, Send, FileText, Menu, X, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import LoginModal from '@/components/LoginModal';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is logged in
    const credentials = localStorage.getItem('awsCredentials');
    setIsLoggedIn(!!credentials);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('awsCredentials');
    setIsLoggedIn(false);
    toast.success('Successfully logged out');
    router.push('/');
  };

  const navigation = [
    {
      name: 'Bulk Email',
      href: '/bulk-email',
      icon: Send,
      current: pathname === '/bulk-email'
    }
  ];

  const isOnTemplatesPage = pathname === '/' || pathname.startsWith('/templates');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Mail className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">SES Template Manager</span>
          </Link>
          
          {isLoggedIn && (
            <div className="flex items-center gap-4">
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        item.current 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isOnTemplatesPage && (
                  <Link href="/templates/new">
                    <Button size="sm" variant='ghost'>
                      <Plus className="h-4 w-4 mr-2" />
                      New Template
                    </Button>
                  </Link>
                )}
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Navigation */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                            item.current 
                              ? 'bg-primary text-primary-foreground' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      );
                    })}
                    {isOnTemplatesPage && (
                      <Link 
                        href="/templates/new"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="mx-4"
                      >
                        <Button size="sm" className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          New Template
                        </Button>
                      </Link>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
          
          {!isLoggedIn && (
            <Button 
              size="sm" 
              onClick={() => setIsLoginModalOpen(true)}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Button>
          )}
        </div>
      </header>
      
      {/* Simple breadcrumb for non-home pages */}
      {isLoggedIn && pathname !== '/' && (
        <div className="border-b bg-muted/30">
          <div className="container py-2">
            <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Templates
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">
                {pathname === '/templates/new' ? 'New Template' : 
                 pathname.startsWith('/templates/') ? 'Edit Template' :
                 pathname === '/bulk-email' ? 'Bulk Email' : 'Page'}
              </span>
            </nav>
          </div>
        </div>
      )}
      
      <main className="flex-1 container py-6">{children}</main>
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onOpenChange={setIsLoginModalOpen} 
      />
      <footer className="py-6 border-t bg-muted/20">
        <div className="container text-center text-sm text-muted-foreground">
          <p>SES Template Manager &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
