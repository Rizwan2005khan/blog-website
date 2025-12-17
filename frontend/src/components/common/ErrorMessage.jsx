// src/components/common/ErrorMessage.jsx
import React from 'react';
import { 
  AlertTriangle,
  RotateCw,
  Home,
  ArrowLeft
} from 'lucide-react';

const ErrorMessage = ({ 
  message = "Something went wrong", 
  onRetry,
  onGoHome,
  onGoBack,
  className = "",
  size = "medium",
  variant = "default",
  details,
  showActions = true
}) => {
  const sizeClasses = {
    small: "p-4",
    medium: "p-6",
    large: "p-8"
  };

  const variantClasses = {
    default: "bg-red-50 border border-red-200",
    subtle: "bg-gray-50 border border-gray-200",
    warning: "bg-yellow-50 border border-yellow-200"
  };

  const iconSizes = {
    small: "h-8 w-8",
    medium: "h-12 w-12",
    large: "h-16 w-16"
  };

  return (
    <div className={`rounded-lg ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle 
            className={`${iconSizes[size]} text-red-400`} 
            aria-hidden="true" 
          />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            Error
          </h3>
          <div className="text-sm text-red-700">
            {message}
          </div>
          {details && (
            <div className="mt-2 text-xs text-red-600 bg-red-100 rounded p-2">
              {details}
            </div>
          )}
          
          {showActions && (
            <div className="mt-4 flex flex-wrap gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <RotateCw className="h-4 w-4 mr-1.5" />
                  Try Again
                </button>
              )}
              
              {onGoBack && (
                <button
                  onClick={onGoBack}
                  className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Go Back
                </button>
              )}
              
              {onGoHome && (
                <button
                  onClick={onGoHome}
                  className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <Home className="h-4 w-4 mr-1.5" />
                  Go Home
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Variants for different error scenarios
export const NetworkError = ({ onRetry, className }) => (
  <ErrorMessage
    message="Network connection error"
    details="Please check your internet connection and try again."
    onRetry={onRetry}
    className={className}
    variant="warning"
  />
);

export const NotFoundError = ({ resource = "Resource", onGoHome, className }) => (
  <ErrorMessage
    message={`${resource} not found`}
    details="The requested resource could not be found or may have been removed."
    onGoHome={onGoHome}
    className={className}
    showActions={true}
  />
);

export const ServerError = ({ onRetry, className }) => (
  <ErrorMessage
    message="Server error occurred"
    details="Our servers are experiencing issues. Please try again in a few moments."
    onRetry={onRetry}
    className={className}
    variant="default"
  />
);

export const PermissionError = ({ onGoHome, className }) => (
  <ErrorMessage
    message="Access denied"
    details="You don't have permission to access this resource."
    onGoHome={onGoHome}
    className={className}
    variant="warning"
  />
);

export const ValidationError = ({ errors, className }) => (
  <ErrorMessage
    message="Validation error"
    details={Array.isArray(errors) ? errors.join(', ') : errors}
    className={className}
    variant="warning"
  />
);

export default ErrorMessage;