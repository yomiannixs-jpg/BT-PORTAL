import { Link, useLocation } from "wouter";
import { LayoutDashboard, BookOpen, ClipboardList, Award, Bell, Settings, Users, GraduationCap, Menu, X, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useStudent } from "@/lib/student-context";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/grades", label: "Grades", icon: Award },
  { href: "/announcements", label: "Announcements", icon: Bell },
  { href: "/profile", label: "Profile", icon: Settings },
  { href: "/admin", label: "Admin Panel", icon: Users },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { studentId } = useStudent();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <div className="font-bold text-sm text-sidebar-foreground leading-tight">BAUM TenPers</div>
            <div className="text-xs text-sidebar-foreground/50 leading-tight">Academic Portal</div>
          </div>
          <button
            className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Student badge */}
        {studentId && (
          <div className="mx-4 mt-4 px-3 py-2 bg-sidebar-accent rounded-lg border border-sidebar-border">
            <div className="text-xs text-sidebar-foreground/50 mb-0.5">Logged in as</div>
            <div className="text-sm font-semibold text-accent">Student #{studentId}</div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== "/" && location.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground")} />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/40">Powered by</div>
          <div className="text-xs font-semibold text-sidebar-foreground/60 mt-0.5">Premiere Research Academy</div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border px-4 lg:px-8 h-14 flex items-center gap-4">
          <button
            className="lg:hidden text-foreground/60 hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <Link
            href="/onboarding"
            className="text-xs text-muted-foreground hover:text-accent transition-colors"
          >
            Switch student
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
