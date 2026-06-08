import { useState } from "react";
import { Link } from "wouter";
import {
  useListCourses,
  useEnrollInCourse,
  useGetStudentEnrollments,
  getListCoursesQueryKey,
  getGetStudentEnrollmentsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useStudent } from "@/lib/student-context";
import { BookOpen, Users, Clock, ChevronRight, CheckCircle2, Search } from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-muted text-muted-foreground border-border",
};

export default function Courses() {
  const { studentId } = useStudent();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  const { data: courses, isLoading } = useListCourses({ query: { queryKey: getListCoursesQueryKey() } });
  const { data: enrollments } = useGetStudentEnrollments(studentId ?? 1, {
    query: { enabled: !!studentId, queryKey: getGetStudentEnrollmentsQueryKey(studentId ?? 1) },
  });
  const enrollMutation = useEnrollInCourse();

  const enrolledIds = new Set(enrollments?.map(e => e.courseId) ?? []);

  const filtered = courses?.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.instructorName.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleEnroll = (courseId: number) => {
    if (!studentId) return;
    setEnrollingId(courseId);
    enrollMutation.mutate({ id: courseId, data: { studentId } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetStudentEnrollmentsQueryKey(studentId) });
        qc.invalidateQueries({ queryKey: getListCoursesQueryKey() });
      },
      onSettled: () => setEnrollingId(null),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse and enroll in available courses</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="pl-9 pr-4 py-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring w-64"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl border border-card-border p-5 animate-pulse h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(course => {
            const enrolled = enrolledIds.has(course.id);
            return (
              <div key={course.id} className="bg-card rounded-xl border border-card-border shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">{course.code}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[course.status] ?? ""}`}>
                      {course.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground leading-tight mb-1">{course.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{course.instructorName}</p>
                  {course.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.enrollmentCount ?? 0} enrolled</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.credits} credits</span>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-3 border-t border-card-border flex gap-2">
                  <Link href={`/courses/${course.id}`} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors">
                    <BookOpen className="w-3 h-3" /> Details
                  </Link>
                  {enrolled ? (
                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-semibold ml-auto">
                      <CheckCircle2 className="w-3 h-3" /> Enrolled
                    </span>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollingId === course.id}
                      className="ml-auto px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {enrollingId === course.id ? "Enrolling..." : "Enroll"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BookOpen className="w-10 h-10 mb-3 opacity-30" />
              <p>No courses found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
