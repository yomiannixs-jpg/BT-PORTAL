import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, BookOpen, ClipboardList, Award, Bell,
  Settings, Users, GraduationCap, Menu, X, ChevronRight,
  MessageSquare, FileText, LogOut, Shield,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const studentNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/grades", label: "Grades", icon: Award },
  { href: "/transcript", label: "Transcript", icon: FileText },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/announcements", label: "Announcements", icon: Bell },
  { href: "/profile", label: "Profile", icon: Settings },
];

const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin", label: "Admin Panel", icon: Shield },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/announcements", label: "Announcements", icon: Bell },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNavItems : studentNavItems;

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

        {/* User badge */}
        {user && (
          <div className="mx-4 mt-4 px-3 py-2.5 bg-sidebar-accent rounded-lg border border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                isAdmin ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
              )}>
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-sidebar-foreground truncate">{user.name}</div>
                <div className={cn("text-xs font-medium", isAdmin ? "text-accent" : "text-sidebar-foreground/50")}>
                  {isAdmin ? "Administrator" : `Student #${user.studentId}`}
                </div>
              </div>
            </div>
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

        {/* Logout */}
        <div className="px-3 py-3 border-t border-sidebar-border">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-sidebar-border">
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
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Welcome, <span className="font-semibold text-foreground">{user.name.split(" ")[0]}</span>
              </span>
              {isAdmin && (
                <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full font-semibold">Admin</span>
              )}
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
