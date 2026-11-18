import React from "react";
import { ErrorStateView } from "./ErrorStateView";

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Log sanitized client-side error without exposing raw stack trace to users
    console.error("COVERLY UI boundary caught error:", error?.message || "Unknown render error");
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F5] flex flex-col justify-center">
          <ErrorStateView
            variant="500"
            onRetry={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
