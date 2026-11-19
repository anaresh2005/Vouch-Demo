import { Button } from '@dashboard/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@dashboard/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@dashboard/components/ui/dialog';
import { LegalDocument } from '@dashboard/components/legal/LegalDocument';
import { useTermsAcceptance } from '@dashboard/hooks/useBrandData';
import { MERCHANT_TERMS } from '@dashboard/lib/legalDocuments';

const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

// The brand's record of accepting the Merchant Terms (Merchant ToS 5.3 promises these records),
// with the current documents to reread. Read-only: acceptance happens during setup.
export function TermsCard() {
  const acceptance = useTermsAcceptance();
  const record = acceptance.data;

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Terms and privacy</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        {acceptance.isLoading ? (
          <p role="status" className="text-muted-foreground">Loading your acceptance record…</p>
        ) : acceptance.error ? (
          <p role="alert" className="text-destructive">Could not load your acceptance record.</p>
        ) : record ? (
          <p>
            The Merchant Terms of Service (version {record.version}) were accepted for your brand
            {record.user_email ? ` by ${record.user_email}` : ''} on {formatDate(record.accepted_at)}, together with the Privacy Policy.
          </p>
        ) : (
          <p className="text-muted-foreground">No acceptance of the Merchant Terms is recorded for your brand yet.</p>
        )}
        {record && record.version !== MERCHANT_TERMS.version && (
          <p className="text-muted-foreground">An updated version ({MERCHANT_TERMS.version}) has been published. It applies to your brand as set out in section 17 of the Merchant Terms (Changes to These Terms): for a material change, we email you 30 days before it takes effect, and continuing to use Vouch after that counts as acceptance.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Dialog>
            <DialogTrigger asChild><Button type="button" variant="outline" size="sm">Read the Merchant Terms</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Merchant Terms of Service</DialogTitle></DialogHeader>
              <LegalDocument text={MERCHANT_TERMS.text} />
            </DialogContent>
          </Dialog>
          <Button asChild variant="outline" size="sm">
            <a href="/privacy" target="_blank" rel="noopener noreferrer">Read the Privacy Policy</a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">For a copy of your acceptance record, contact support@vouch.so.</p>
      </CardContent>
    </Card>
  );
}
