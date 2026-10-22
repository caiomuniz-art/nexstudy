import type { AssessmentRow, StudySessionRow, TaskRow } from "@/types/domain";

export function summarizeSubject(
  subjectId: string,
  tasks: TaskRow[],
  assessments: AssessmentRow[],
  sessions: StudySessionRow[],
) {
  const relatedTasks = tasks.filter((task) => task.subject_id === subjectId);
  const relatedAssessments = assessments.filter((assessment) => assessment.subject_id === subjectId);
  const relatedSessions = sessions.filter((session) => session.subject_id === subjectId);
  const studiedMinutes = relatedSessions
    .filter((session) => session.status === "concluida")
    .reduce((sum, session) => sum + (session.actual_duration_minutes ?? session.duration_minutes), 0);

  return {
    tasks: relatedTasks.length,
    pendingTasks: relatedTasks.filter((task) => task.status !== "concluida").length,
    assessments: relatedAssessments.length,
    sessions: relatedSessions.length,
    studiedMinutes,
  };
}
