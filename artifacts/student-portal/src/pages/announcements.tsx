import {
  useListAnnouncements,
  getListAnnouncementsQueryKey,
} from "@workspace/api-client-react";
import { Bell, Calendar, AlertTriangle, Info, AlertCircle } from "lucide-react";

const priorityConfig = {
  urgent: {
    label: "Urgent",
    icon: AlertTriangle,
    className: "bg-destructive/5 border-destructive/30 text-destructive",
    badge: "bg-destructive text-white",
  },
  important: {
    label: "Important",
    icon: AlertCircle,
    className: "bg-accent/5 border-accent/30 text-accent",
    badge: "bg-accent text-accent-foreground",
  },
  normal: {
    label: "Announcement",
    icon: Info,
    className: "bg-card border-card-border",
    badge: "bg-primary/10 text-primary",
  },
};

export default function Announcements() {
  const { data: announcements, isLoading } = useListAnnouncements({
    query: { queryKey: getListAnnouncementsQueryKey() },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {announcements?.length ?? 0} announcement{announcements?.length !== 1 ? "s" : ""}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-card-border p-6 animate-pulse h-28" />
          ))}
        </div>
      ) : !announcements || announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Bell className="w-10 h-10 opacity-30" />
          <p>No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {announcements.map(a => {
            const cfg = priorityConfig[a.priority as keyof typeof priorityConfig] ?? priorityConfig.normal;
            const Icon = cfg.icon;
            return (
              <div key={a.id} className={`rounded-xl border shadow-sm p-6 ${cfg.className}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.badge} opacity-90`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h3 className="font-bold text-foreground leading-tight">{a.title}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{a.content}</p>
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(a.createdAt).toLocaleDateString("en-US", {
                        weekday: "long", year: "numeric", month: "long", day: "numeric"
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
