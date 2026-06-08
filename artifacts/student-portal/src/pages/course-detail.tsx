import { useRoute, Link } from "wouter";
import {
  useGetCourse,
  useListAssignments,
  useGetStudentEnrollments,
  useEnrollInCourse,
  getGetCourseQueryKey,
  getListAssignmentsQueryKey,
  getGetStudentEnrollmentsQueryKey,
  getListCoursesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useStudent } from "@/lib/student-context";
import { ArrowLeft, Users, Clock, ClipboardList, CheckCircle2, Calendar } from "lucide-react";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:id");
  const id = Number(params?.id ?? 0);
  const { studentId } = useStudent();
  const qc = useQueryClient();

  const { data: course, isLoading } = useGetCourse(id, { query: { enabled: !!id, queryKey: getGetCourseQueryKey(id) } });
  const { data: assignments } = useListAssignments(id, { query: { enabled: !!id, queryKey: getListAssignmentsQueryKey(id) } });
  const { data: enrollments } = useGetStudentEnrollments(studentId ?? 1, {
    query: { enabled: !!studentId, queryKey: getGetStudentEnrollmentsQueryKey(studentId ?? 1) },
  });
  const enrollMutation = useEnrollInCourse();

  const enrolled = enrollments?.some(e => e.courseId === id);

  const handleEnroll = () => {
    if (!studentId || !id) return;
    enrollMutation.mutate({ id, data: { studentId } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetStudentEnrollmentsQueryKey(studentId) });
        qc.invalidateQueries({ queryKey: getListCoursesQueryKey() });
        qc.invalidateQueries({ queryKey: getGetCourseQueryKey(id) });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Course not found.</p>
        <Link href="/courses" className="text-accent hover:underline text-sm">Back to courses</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Link href="/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Courses
      </Link>

      <div className="bg-card rounded-xl border border-card-border shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded">{course.code}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                course.status === "active" ? "bg-green-50 text-green-700 border-green-200" :
                course.status === "upcoming" ? "bg-blue-50 text-blue-700 border-blue-200" :
                "bg-muted text-muted-foreground border-border"
              }`}>{course.status}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
            <p className="text-muted-foreground mt-1">{course.instructorName}</p>
          </div>
          {enrolled ? (
            <span className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Enrolled
            </span>
          ) : (
            <button
              onClick={handleEnroll}
              disabled={enrollMutation.isPending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {enrollMutation.isPending ? "Enrolling..." : "Enroll in Course"}
            </button>
          )}
        </div>

        {course.description && (
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{course.description}</p>
        )}

        <div className="flex items-center gap-6 mt-5 pt-5 border-t border-card-border text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Users className="w-4 h-4 text-accent" />{course.enrollmentCount ?? 0} students enrolled</span>
          <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-accent" />{course.credits} credit hours</span>
          {course.programName && <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-accent" />{course.programName}</span>}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-card-border shadow-sm">
        <div className="px-6 py-4 border-b border-card-border">
          <h2 className="font-bold text-foreground">Assignments</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{assignments?.length ?? 0} assignments in this course</p>
        </div>
        <div className="divide-y divide-border">
          {(!assignments || assignments.length === 0) ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">No assignments yet</div>
          ) : (
            assignments.map(a => (
              <div key={a.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{a.title}</p>
                  {a.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-foreground">{a.maxScore} pts</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(a.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
