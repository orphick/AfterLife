import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "danger";
  small?: boolean;
  children: ReactNode;
}

export function Button({
  icon: Icon,
  variant = "primary",
  small = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const variantClass = variant === "primary" ? "" : variant;
  return (
    <button
      className={`button ${variantClass} ${small ? "small-button" : ""} ${className}`}
      type="button"
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
}

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  privateTone?: boolean;
  children: ReactNode;
}

export function Chip({ active = false, privateTone = false, className = "", children, ...props }: ChipProps) {
  return (
    <button
      className={`chip ${active ? "is-active" : ""} ${privateTone ? "private-chip" : ""} ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  compact?: boolean;
}

export function Field({ label, compact = false, className = "", ...props }: FieldProps) {
  return (
    <label className={`field ${compact ? "compact" : ""} ${className}`}>
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}

export function Progress({ value }: { value: number }) {
  const amount = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="progress" aria-label={`Progress ${amount}%`}>
      <span style={{ width: `${amount}%` }} />
    </div>
  );
}

export function Avatars() {
  return (
    <div className="avatar-stack" aria-label="Mo and Aysel">
      <span>A</span>
      <span>M</span>
    </div>
  );
}

export function ViewHeader({
  eyebrow,
  title,
  right
}: {
  eyebrow: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <header className="view-header">
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      {right}
    </header>
  );
}

export function IconBox({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="icon-box">
      <Icon aria-hidden="true" />
    </span>
  );
}
