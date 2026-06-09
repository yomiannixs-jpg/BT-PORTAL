import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StudentProvider } from "@/lib/student-context";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/layout";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import Assignments from "@/pages/assignments";
import Grades from "@/pages/grades";
import Announcements from "@/pages/announcements";
import Profile from "@/pages/profile";
import Admin from "@/pages/admin";
import Login from "@/pages/login";
import Transcript from "@/pages/transcript";
import Messages from "@/pages/messages";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="text-6xl font-bold text-muted-foreground/30">404</div>
      <p className="text-foreground font-semibold">Page not found</p>
      <button
        onClick={() => { window.location.href = `${BASE}/dashboard`; }}
        className="text-sm text-accent hover:underline"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Use window.location to avoid any Wouter redirect quirks
    window.location.href = `${BASE}/login`;
    return null;
  }

  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    window.location.href = `${BASE}/dashboard`;
    return null;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Switch>
      {/* Public routes — no auth required */}
      <Route path="/login" component={Login} />
      <Route path="/onboarding" component={Onboarding} />

      {/* Root → dashboard */}
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>

      {/* Protected routes */}
      <Route path="/dashboard">
        <AuthGuard><Layout><Dashboard /></Layout></AuthGuard>
      </Route>
      <Route path="/courses/:id">
        <AuthGuard><Layout><CourseDetail /></Layout></AuthGuard>
      </Route>
      <Route path="/courses">
        <AuthGuard><Layout><Courses /></Layout></AuthGuard>
      </Route>
      <Route path="/assignments">
        <AuthGuard><Layout><Assignments /></Layout></AuthGuard>
      </Route>
      <Route path="/grades">
        <AuthGuard><Layout><Grades /></Layout></AuthGuard>
      </Route>
      <Route path="/transcript">
        <AuthGuard><Layout><Transcript /></Layout></AuthGuard>
      </Route>
      <Route path="/messages">
        <AuthGuard><Layout><Messages /></Layout></AuthGuard>
      </Route>
      <Route path="/announcements">
        <AuthGuard><Layout><Announcements /></Layout></AuthGuard>
      </Route>
      <Route path="/profile">
        <AuthGuard><Layout><Profile /></Layout></AuthGuard>
      </Route>
      <Route path="/admin">
        <AuthGuard>
          <AdminGuard>
            <Layout><Admin /></Layout>
          </AdminGuard>
        </AuthGuard>
      </Route>

      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <StudentProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRoutes />
            </WouterRouter>
          </StudentProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
