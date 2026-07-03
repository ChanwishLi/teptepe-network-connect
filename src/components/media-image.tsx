import { useEffect, useState, type ReactNode } from "react";
import { driveImageUrl } from "@/lib/drive";

type MediaImageProps = {
  value: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  loading?: "eager" | "lazy";
  placeholder?: ReactNode;
};

export function MediaImage({ value, alt, className, fallbackClassName, loading = "lazy", placeholder }: MediaImageProps) {
  const url = driveImageUrl(value);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);

  if (!url || failed) {
    return (
      <div className={fallbackClassName ?? className} aria-hidden="true">
        {placeholder}
      </div>
    );
  }
  return (
    <img src={url} alt={alt} loading={loading} decoding="async" className={className} onError={() => setFailed(true)} />
  );
}
