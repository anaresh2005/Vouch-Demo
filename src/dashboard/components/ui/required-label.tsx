import type { ComponentProps } from 'react';
import { Label } from '@dashboard/components/ui/label';

// A label with an asterisk for required fields. The asterisk is decorative; the input's
// `required` attribute is what tells assistive technology.
export function RequiredLabel({ children, ...props }: ComponentProps<typeof Label>) {
  return (
    <Label {...props}>
      {children}
      <span aria-hidden="true" className="text-destructive"> *</span>
    </Label>
  );
}
