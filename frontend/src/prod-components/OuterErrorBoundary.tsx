import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
  children: ReactNode;
}

export const OuterErrorBoundary = ({ children }: Props) => {
  return (
    <ErrorBoundary
      fallback={null}
      onError={(error) => {

      }}
    >
      {children}
    </ErrorBoundary>
  );
};

