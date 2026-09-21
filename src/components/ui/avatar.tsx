import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Avatar",
  fallback = "U",
  size = "md",
  className,
  ...props
}) => {
  const [hasError, setHasError] = React.useState(!src);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-14 w-14 text-lg",
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {!hasError && src ? (
        <img
          src={src}
          alt={alt}
          onError={() => setHasError(true)}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-medium text-slate-600 bg-slate-200">
          {fallback}
        </div>
      )}
    </div>
  );
};
