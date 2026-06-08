import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StudentProvider } from "@/lib/student-context";
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

function AppRoutes() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard">
        <Layout><Dashboard /></Layout>
      </Route>
      <Route path="/courses/:id">
        <Layout><CourseDetail /></Layout>
      </Route>
      <Route path="/courses">
        <Layout><Courses /></Layout>
      </Route>
      <Route path="/assignments">
        <Layout><Assignments /></Layout>
      </Route>
      <Route path="/grades">
        <Layout><Grades /></Layout>
      </Route>
      <Route path="/announcements">
        <Layout><Announcements /></Layout>
      </Route>
      <Route path="/profile">
        <Layout><Profile /></Layout>
      </Route>
      <Route path="/admin">
        <Layout><Admin /></Layout>
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
        <StudentProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
        </StudentProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
