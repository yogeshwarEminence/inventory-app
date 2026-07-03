import React from "react";
import { IconAlert } from "./Icons.jsx";

// Real-world apps shouldn't show a blank white screen when a component
// throws. This catches render errors anywhere below it in the tree and
// shows a recoverable screen instead.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("Unhandled UI error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = "#/dashboard";
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fatal-error-screen">
          <div className="fatal-error-card">
            <div className="fatal-error-icon">
              <IconAlert width={26} height={26} />
            </div>
            <h1>Something went wrong</h1>
            <p className="muted">
              An unexpected error occurred while rendering this page. Your data is safe — try
              reloading.
            </p>
            {this.state.error && (
              <pre className="fatal-error-detail">{String(this.state.error.message || this.state.error)}</pre>
            )}
            <button className="btn btn-primary" onClick={this.handleReload}>
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
