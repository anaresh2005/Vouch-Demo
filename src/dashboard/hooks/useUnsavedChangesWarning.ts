import { useEffect } from 'react';

/**
 * Asks the browser to warn before a reload, tab close or address-bar navigation while a form has
 * unsaved edits. Browsers show their own generic message. Moving to another dashboard page inside
 * the app is not covered: that needs react-router's `useBlocker`, which only works with a data
 * router, and the app uses `<BrowserRouter>`.
 */
export function useUnsavedChangesWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Older browsers need returnValue set to show the prompt.
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
}
