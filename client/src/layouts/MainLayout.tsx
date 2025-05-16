import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { PlantsIcon, MapPinIcon, Loader2, SearchIcon, MessageSquareIcon, UserIcon } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: <PlantsIcon className="w-5 h-5" /> },
    { path: '/map', label: 'Map', icon: <MapPinIcon className="w-5 h-5" /> },
    { path: '/species', label: 'Species', icon: <SearchIcon className="w-5 h-5" /> },
    ...(isAuthenticated ? [
      { path: '/observations', label: 'My Observations', icon: <PlantsIcon className="w-5 h-5" /> },
      { path: '/identify', label: 'Identify', icon: <SearchIcon className="w-5 h-5" /> },
      { path: '/ask', label: 'Ask BioScout', icon: <MessageSquareIcon className="w-5 h-5" /> },
      { path: '/profile', label: 'Profile', icon: <UserIcon className="w-5 h-5" /> },
    ] : [])
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center space-x-2">
              <PlantsIcon className="w-8 h-8" />
              <span className="text-xl font-bold">BioScout Islamabad</span>
            </a>
          </Link>
          
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isAuthenticated ? (
              <>
                <span className="hidden md:inline-block">
                  Welcome, {user?.username} | Points: {user?.points}
                </span>
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/logout">Log Out</a>
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-background border-b">
        <div className="container mx-auto px-4 py-2">
          <ul className="flex items-center space-x-6 overflow-x-auto pb-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link href={item.path}>
                  <a className={`flex items-center space-x-1 px-2 py-1 text-sm font-medium transition-colors hover:text-primary ${
                    location === item.path ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
                  }`}>
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-semibold">BioScout Islamabad</h3>
              <p className="text-sm">Discover and track local biodiversity with our community</p>
            </div>
            <div>
              <p className="text-sm">© 2025 BioScout Islamabad. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}