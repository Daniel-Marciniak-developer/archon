import type { ReactNode } from "react";
import { Toaster } from "sonner";

interface Props {
  children: ReactNode;
}


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

