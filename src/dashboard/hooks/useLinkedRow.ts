import { useEffect, useRef, useState } from 'react';

// A link can open a page at one row (`?expand=` on Gifts, `?id=` on Creators, `?order=` on Posts).
// Rows only exist once the data has loaded, so the scroll happens when the linked row is first
// attached to the page, not on a timer. The row is then highlighted for two seconds.
export function useLinkedRow(linkedId: string | null | undefined) {
  const scrolledTo = useRef<string | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    if (!highlighted) return;
    const timer = setTimeout(() => setHighlighted(null), 2000);
    return () => clearTimeout(timer);
  }, [highlighted]);

  return {
    rowRef: (id: string) => (element: HTMLElement | null) => {
      if (!element || id !== linkedId || scrolledTo.current === id) return;
      scrolledTo.current = id;
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      setHighlighted(id);
    },
    isHighlighted: (id: string) => highlighted === id,
  };
}
