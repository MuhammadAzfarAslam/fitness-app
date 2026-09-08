import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Forma could not render this view', error, info.componentStack);
  }
  render() {
    if (this.state.failed)
      return (
        <div className="loading-state">
          <h1>Let’s get you back on track.</h1>
          <p>This screen could not load. Your saved data has not been deleted.</p>
          <button className="primary" onClick={() => window.location.reload()}>
            Reload Forma
          </button>
        </div>
      );
    return this.props.children;
  }
}
