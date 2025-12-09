import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState | null {
    if (
      error.message?.includes('Failed to fetch dynamically imported module')
    ) {
      return { hasError: true };
    }
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught in ErrorBoundary:', error, info);
  }

  componentDidUpdate(_: never, prevState: ErrorBoundaryState) {
    if (!prevState.hasError && this.state.hasError) {
      console.warn('Reloading app due to module fetch error...');
      window.location.reload();
    }
  }

  render() {
    return this.props.children;
  }
}
