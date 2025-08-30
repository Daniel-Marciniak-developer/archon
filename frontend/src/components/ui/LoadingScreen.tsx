import React from 'react';

interface LoadingScreenProps {
  message?: string;
  isVisible: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading...", 
  isVisible 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-crystal-void/90 backdrop-blur-sm flex items-center justify-center min-h-screen">
      <div className="text-center space-y-8 flex flex-col items-center justify-center">
        {/* Cosmic Loading Animation */}
        <div className="relative flex items-center justify-center">
          {/* Outer ring */}
          <div className="w-32 h-32 border-4 border-crystal-electric/20 border-t-crystal-electric rounded-full animate-spin"></div>
          
          {/* Inner ring */}
          <div className="absolute inset-4 w-24 h-24 border-4 border-transparent border-r-crystal-electric/60 rounded-full animate-spin" 
               style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}>
          </div>
          
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-crystal-electric rounded-full animate-pulse"></div>
          </div>
          
          {/* Floating particles */}
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-crystal-electric rounded-full animate-bounce"></div>
          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-crystal-electric/60 rounded-full animate-bounce" 
               style={{ animationDelay: '0.2s' }}>
          </div>
          <div className="absolute top-8 -left-4 w-1.5 h-1.5 bg-crystal-electric/40 rounded-full animate-bounce" 
               style={{ animationDelay: '0.4s' }}>
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-crystal-electric">
            {message}
          </h3>
          
          {/* Animated dots */}
          <div className="flex items-center justify-center space-x-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div 
                key={i}
                className="w-2 h-2 bg-crystal-electric rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
          
          {/* Status message */}
          <p className="text-crystal-text/70 text-sm">
            Please wait while we prepare everything for you
          </p>
        </div>

        {/* Progress indicator */}
        <div className="w-64 h-1 bg-crystal-void/50 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-crystal-electric/50 to-crystal-electric animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
