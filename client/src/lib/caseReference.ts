/**
 * A short, speakable reference for a case ID in UI copy. Real case IDs are
 * opaque cuids (e.g. "cmu6m3z1t0004pbyowps9sa75") — fine as a lookup key,
 * unreadable as on-screen text. Seeded demo cases use short ids already
 * ("case-011") and pass through unchanged aside from casing.
 */
export function caseReference(caseId: string): string {
  const tail = caseId.length > 10 ? caseId.slice(-6) : caseId;
  return `#${tail.toUpperCase()}`;
}
