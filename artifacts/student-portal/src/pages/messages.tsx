import { useState, useEffect } from "react";
import { useStudent } from "@/lib/student-context";
import { useAuth } from "@/lib/auth-context";
import { MessageSquare, Send, Reply, CheckCheck, Circle, Plus } from "lucide-react";
import { apiPath } from "@/lib/api";


interface Message {
  id: number;
  studentId: number;
  subject: string;
  body: string;
  fromAdmin: boolean;
  parentId: number | null;
  isRead: boolean;
  createdAt: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export default function Messages() {
  const { studentId } = useStudent();
  const { token, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedThread, setSelectedThread] = useState<number | null>(null);

  const isAdmin = user?.role === "admin";

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const url = isAdmin
        ? apiPath("/api/messages")
        : apiPath(`/api/students/${studentId}/messages`);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMessages();
  }, [token, studentId]);

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      const targetStudentId = isAdmin && replyTo ? replyTo.studentId : studentId;
      const res = await fetch(apiPath(`/api/students/${targetStudentId}/messages`), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subject: replyTo ? `Re: ${replyTo.subject}` : subject || "New Message",
          body,
          parentId: replyTo?.id ?? null,
        }),
      });
      if (res.ok) {
        setBody("");
        setSubject("");
        setReplyTo(null);
        setShowCompose(false);
        await fetchMessages();
      }
    } finally {
      setSending(false);
    }
  };

  const markRead = async (id: number) => {
    await fetch(apiPath(`/api/messages/${id}/read`), {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
  };

  // Group messages into threads
  const threads = messages.filter(m => !m.parentId);
  const getReplies = (id: number) => messages.filter(m => m.parentId === id);
  const unreadCount = messages.filter(m => !m.isRead && !m.fromAdmin).length;

  const threadMessages = selectedThread !== null
    ? [messages.find(m => m.id === selectedThread)!, ...getReplies(selectedThread)].filter(Boolean)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Messages
            {unreadCount > 0 && (
              <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? "All student messages" : "Communicate with the academic team"}
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => { setShowCompose(true); setReplyTo(null); setSelectedThread(null); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> New Message
          </button>
        )}
      </div>

      {/* Compose form */}
      {(showCompose || replyTo) && (
        <div className="bg-card rounded-xl border border-accent/30 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            {replyTo ? `Reply to: ${replyTo.subject}` : "New Message"}
          </h3>
          {!replyTo && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Subject</label>
              <input
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="What is your message about?"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Message</label>
            <textarea
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={4}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your message..."
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowCompose(false); setReplyTo(null); setBody(""); setSubject(""); }}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={send}
              disabled={sending || !body.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Thread list */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-card-border">
            <p className="text-sm font-bold text-foreground">{threads.length} conversations</p>
          </div>
          {loading ? (
            <div className="p-6 text-center">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground px-4 text-center gap-2">
              <MessageSquare className="w-8 h-8 opacity-30" />
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {threads.map(m => {
                const replies = getReplies(m.id);
                const isSelected = selectedThread === m.id;
                const isUnread = !m.isRead && m.fromAdmin;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedThread(m.id); markRead(m.id); }}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      isSelected ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isUnread ? (
                            <Circle className="w-2 h-2 text-accent fill-accent flex-shrink-0" />
                          ) : (
                            <div className="w-2 h-2 flex-shrink-0" />
                          )}
                          <p className={`text-sm truncate ${isUnread ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                            {m.subject}
                          </p>
                        </div>
                        {isAdmin && (
                          <p className="text-xs text-muted-foreground ml-4 mt-0.5">
                            {m.firstName} {m.lastName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground ml-4 mt-0.5 truncate">{m.body}</p>
                        <div className="flex items-center gap-2 ml-4 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                            m.fromAdmin ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                          }`}>
                            {m.fromAdmin ? "Admin" : "You"}
                          </span>
                          {replies.length > 0 && (
                            <span className="text-xs text-muted-foreground">{replies.length} replies</span>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Thread detail */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-card-border shadow-sm overflow-hidden">
          {selectedThread === null ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
              <MessageSquare className="w-10 h-10 opacity-30" />
              <p className="text-sm">Select a conversation to view</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="px-5 py-4 border-b border-card-border flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">{threadMessages[0]?.subject}</p>
                  {isAdmin && threadMessages[0] && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      From: {threadMessages[0].firstName} {threadMessages[0].lastName} ({threadMessages[0].email})
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setReplyTo(threadMessages[0])}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                >
                  <Reply className="w-3 h-3" /> Reply
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {threadMessages.map(m => (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${m.fromAdmin ? "flex-row-reverse" : ""}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      m.fromAdmin ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
                    }`}>
                      {m.fromAdmin ? "A" : "S"}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${m.fromAdmin ? "items-end" : "items-start"} flex flex-col`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm ${
                        m.fromAdmin
                          ? "bg-accent/10 border border-accent/20 text-foreground rounded-tr-sm"
                          : "bg-muted border border-border text-foreground rounded-tl-sm"
                      }`}>
                        {m.body}
                      </div>
                      <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${m.fromAdmin ? "flex-row-reverse" : ""}`}>
                        <span>{m.fromAdmin ? "Academic Team" : "You"}</span>
                        <span>·</span>
                        <span>{new Date(m.createdAt).toLocaleString()}</span>
                        {m.isRead && !m.fromAdmin && <CheckCheck className="w-3 h-3 text-accent" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
