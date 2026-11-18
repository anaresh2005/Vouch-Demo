import { Fragment, type ReactNode } from 'react';

// Renders the small Markdown subset used by Vouch's legal documents: "######" headings,
// "- " bullet lists, **bold** runs and paragraphs whose line breaks matter (addresses).
// Built from React elements, so document text is never injected as HTML.
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>);
}

export function LegalDocument({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n\s*\n/).map(block => block.trim()).filter(Boolean);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground">
      {blocks.map((block, i) => {
        if (block.startsWith('###### ')) {
          return <h3 key={i} className="pt-2 font-display font-medium">{block.slice(7)}</h3>;
        }
        const lines = block.split('\n');
        if (lines.every(line => line.startsWith('- '))) {
          return <ul key={i} className="list-disc space-y-1 pl-5">{lines.map((line, j) => <li key={j}>{inline(line.slice(2))}</li>)}</ul>;
        }
        return (
          <p key={i}>
            {lines.map((line, j) => <Fragment key={j}>{j > 0 && <br />}{inline(line)}</Fragment>)}
          </p>
        );
      })}
    </div>
  );
}
