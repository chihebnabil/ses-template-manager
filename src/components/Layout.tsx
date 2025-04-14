
import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Mail, LogIn, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoginModal from '@/components/LoginModal';
import { toast } from 'sonner';

const Layout: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const credentials = localStorage.getItem('awsCredentials');
    setIsLoggedIn(!!credentials);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('awsCredentials');
    setIsLoggedIn(false);
    toast.success('Successfully logged out');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">SES Template Manager</span>
          </Link>
          
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="gap-1" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              className="gap-1" 
              onClick={() => setIsLoginModalOpen(true)}
            >
              <LogIn className="h-4 w-4" />
              <span>Login</span>
            </Button>
          )}
        </div>
      </header>
      
      <main className="flex-1 container py-6">
        <Outlet />
      </main>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onOpenChange={setIsLoginModalOpen} 
      />
      
      <footer className="py-4 border-t">
        <div className="container text-center text-sm text-muted-foreground">
          SES Template Manager &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Layout;
