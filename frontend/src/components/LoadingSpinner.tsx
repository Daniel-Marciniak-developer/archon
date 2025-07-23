import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('flex items-center justify-center space-x-2', className)}>
      <div className={cn('crystal-spinner', sizeClasses[size])} />
      {text && (
        <span className="crystal-text-secondary text-sm">{text}</span>
      )}
    </div>
  );
}

interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingState({ title = 'Loading...', description, className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-8 space-y-4', className)}>
      <LoadingSpinner size="lg" />
      <div className="text-center">
        <h3 className="text-lg font-semibold crystal-text-primary">{title}</h3>
        {description && (
          <p className="crystal-text-secondary mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  label?: string;
}

export function ProgressBar({ progress, className, showPercentage = true, label }: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn('space-y-2', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium crystal-text-primary">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm crystal-text-secondary">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}
      <div className="crystal-progress h-2">
        <div 
          className="crystal-progress-bar transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

interface PulsingDotsProps {
  className?: string;
}

export function PulsingDots({ className }: PulsingDotsProps) {
  return (
    <div className={cn('flex space-x-1', className)}>
      <div className="w-2 h-2 crystal-bg-electric rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 crystal-bg-electric rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 crystal-bg-electric rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
    </div>
  );
}
