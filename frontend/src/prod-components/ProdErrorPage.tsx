import type { ReactNode } from "react";

interface Props {
  text: ReactNode;
  canRefresh: boolean;
}

export const ProdErrorPage = ({ text, canRefresh }: Props) => {
  return (
    <div className="min-h-screen bg-crystal-void flex items-center justify-center">
      <div className="max-w-7xl mx-auto p-8">
        <div className="text-center space-y-6">
          <div className="text-2xl font-bold text-crystal-text">
            {text}
          </div>

          {canRefresh && (
            <button
              className="crystal-button-violet px-6 py-3 rounded-lg font-semibold"
              type="button"
              onClick={() => {
                window.location.reload();
              }}
            >
              Reload page
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

