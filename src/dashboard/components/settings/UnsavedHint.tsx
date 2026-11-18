/** Shown beside a settings card's Save button while its form has edits that haven't been saved. */
export function UnsavedHint({ show }: { show: boolean }) {
  if (!show) return null;
  return <span role="status" className="text-sm text-muted-foreground">Unsaved changes</span>;
}
