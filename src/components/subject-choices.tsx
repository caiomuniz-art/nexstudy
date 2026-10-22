import { FIXED_SUBJECTS } from "@/lib/subjects/fixed";

export function SubjectChoices({ blank }: { blank?: string }) {
  return (
    <>
      {blank !== undefined ? <option value="">{blank}</option> : null}
      {FIXED_SUBJECTS.map((subject) => (
        <option key={subject.id} value={subject.id}>{subject.name}</option>
      ))}
    </>
  );
}
