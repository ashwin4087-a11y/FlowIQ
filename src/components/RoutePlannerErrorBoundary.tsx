import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class RoutePlannerErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route Planner error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-white bg-[#1E293B] border border-[#334155] rounded-lg m-4">
          <h2 className="text-lg font-semibold mb-2">Route Planner error</h2>
          <p className="text-sm text-[#94A3B8] mb-2">
            The Route Planner failed to load. Overview and the 3D digital twin should still work via
            the OVERVIEW tab.
          </p>
          <pre className="text-xs text-[#F59E0B] whitespace-pre-wrap">{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
