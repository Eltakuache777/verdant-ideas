import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from "react";

const fieldClasses =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-500/60 outline-none transition-shadow focus:border-brand-600 focus:ring-4 focus:ring-brand-600/10 disabled:bg-black/[0.03] disabled:text-ink-500";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return <input ref={ref} className={`${fieldClasses} ${className}`} {...props} />;
  }
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...props }, ref) {
  return <textarea ref={ref} className={`${fieldClasses} resize-none ${className}`} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = "", children, ...props }, ref) {
    return (
      <select ref={ref} className={`${fieldClasses} appearance-none ${className}`} {...props}>
        {children}
      </select>
    );
  }
);

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-sm font-medium text-ink-800">{children}</label>
  );
}
