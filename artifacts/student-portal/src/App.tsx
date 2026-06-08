import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="text-6xl font-bold text-muted-foreground/30">404</div>
      <p className="text-foreground font-semibold">Page not found</p>
      <a href="/dashboard" className="text-sm text-accent hover:underline">Back to Dashboard</a>
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/onboarding">
        <AuthGuard>
          <Onboarding />
        </AuthGuard>
      </Route>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/dashboard">
        <AuthGuard>
          <Layout><Dashboard /></Layout>
        </AuthGuard>
      </Route>
      <Route path="/courses/:id">
        <AuthGuard>
          <Layout><CourseDetail /></Layout>
        </AuthGuard>
      </Route>
      <Route path="/courses">
        <AuthGuard>
          <Layout><Courses /></Layout>
        </AuthGuard>
      </Route>
      <Route path="/assignments">
        <AuthGuard>
          <Layout><Assignments /></Layout>
        </AuthGuard>
      </Route>
      <Route path="/grades">
        <AuthGuard>
          <Layout><Grades /></Layout>
        </AuthGuard>
      </Route>
      <Route path="/transcript">
        <AuthGuard>
          <Layout><Transcript /></Layout>
        </AuthGuard>
      </Route>
      <Route path="/messages">
        <AuthGuard>
          <Layout><Messages /></Layout>
        </AuthGuard>
      </Route>
      <Route path="/announcements">
        <AuthGuard>
          <Layout><Announcements /></Layout>
        </AuthGuard>
      </Route>
      <Route path="/profile">
        <AuthGuard>
          <Layout><Profile /></Layout>
        </AuthGuard>
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
