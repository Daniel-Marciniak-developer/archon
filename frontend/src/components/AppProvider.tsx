import type { ReactNode } from "react";
import { Toaster } from "sonner";

interface Props {
  children: ReactNode;
}

/**
 * A provider wrapping the whole app.
 *
 * You can add multiple providers here by nesting them,
 * and they will all be applied to the app.
 *
 * Note: ThemeProvider is already included in AppWrapper.tsx and does not need to be added here.
 */
export const AppProvider = ({ children }: Props) => {
  return (
    <>
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--crystal-surface))',
            border: '1px solid hsl(var(--crystal-border))',
            color: 'hsl(var(--crystal-text-primary))',
          },
        }}
      />
    </>
  );
};
