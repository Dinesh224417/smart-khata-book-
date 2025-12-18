import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-slate-700 mb-1 ml-1">
        {label}
      </label>
      <input
        className={`w-full px-4 py-2.5 rounded-xl border transition-all duration-200 ${
          error 
            ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200 focus:border-red-400' 
            : 'border-slate-200 bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400'
        } focus:outline-none ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1 font-medium ml-1">{error}</p>}
    </div>
  );
};