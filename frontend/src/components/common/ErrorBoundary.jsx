import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>სამწუხაროდ, რაღაც არ ასრულდა / Something went wrong</h2>
            <p>
              გთხოვთ, განაახლეთ გვერდი ან სცადეთ მოგვიანებით. /
              Please refresh the page or try again later.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="error-boundary-button"
            >
              გვერდის განახლება / Refresh Page
            </button>
            
            {import.meta.env.DEV && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre>{this.state.error && this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
