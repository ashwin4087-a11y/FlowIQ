import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('FlowIQ render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#0B1220] text-white p-6">
          <h1 className="text-lg font-semibold mb-2">FlowIQ failed to start</h1>
          <p className="text-sm text-[#94A3B8] mb-4">
            An uncaught error stopped the UI. Details below (check the browser console for the full
            stack).
          </p>
          <pre className="text-xs bg-[#1E293B] border border-[#334155] rounded p-3 overflow-auto">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
