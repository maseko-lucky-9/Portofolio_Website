import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[3D Scene] disabled — WebGL or R3F init failed:", error);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
