import { Component, type ReactNode } from 'react';
import { CloudOff } from 'lucide-react';
import { Button } from '@dashboard/components/ui/button';
import { EmptyState } from './EmptyState';

type Props = { children: ReactNode; title?: string; className?: string };

/**
 * Keeps one broken page or card from blanking the dashboard: it shows the same retryable
 * "could not load" state as DataStatus in its place, and the rest of the page keeps working.
 */
export class SectionBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Dashboard section failed to render', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <EmptyState
        role="alert"
        icon={CloudOff}
        title={this.props.title ?? 'Could not load this section'}
        description="Check your connection and try again."
        action={<Button variant="outline" onClick={() => this.setState({ failed: false })}>Try again</Button>}
        className={this.props.className}
      />
    );
  }
}
