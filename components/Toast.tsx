import React from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, type, visible }) => {
  const baseClasses = "fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white transition-transform duration-300 ease-in-out transform";
  const typeClasses = type === 'success' ? 'bg-green-600' : 'bg-red-600';
  const visibilityClasses = visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0';

  return (
    <div className={`${baseClasses} ${typeClasses} ${visibilityClasses}`} role="alert">
      {message}
    </div>
  );
};

export default Toast;
