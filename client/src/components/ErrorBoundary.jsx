import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('DialogueBox Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // Fail silently - don't break the game if dialogue fails
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
