import React from 'react';
import { Route, Switch, Link, useLocation } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/layouts/MainLayout';

// Pages
import HomePage from '@/pages/Home';
import MapPage from '@/pages/Map';
import ObservationsPage from '@/pages/Observations';
import SpeciesPage from '@/pages/Species';
import IdentifyPage from '@/pages/Identify';
import AskPage from '@/pages/Ask';
import ProfilePage from '@/pages/Profile';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import NotFoundPage from '@/pages/not-found';

// Protected route component
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return isAuthenticated ? <Component {...rest} /> : null;
}

// Router component
function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/map" component={MapPage} />
      <Route path="/species" component={SpeciesPage} />
      <Route path="/observations">
        <ProtectedRoute component={ObservationsPage} />
      </Route>
      <Route path="/identify">
        <ProtectedRoute component={IdentifyPage} />
      </Route>
      <Route path="/ask">
        <ProtectedRoute component={AskPage} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={ProfilePage} />
      </Route>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Router />
      </MainLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;