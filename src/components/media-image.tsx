import { useEffect, useState, type ReactNode } from "react";
import { useMediaUrl } from "@/lib/media";

type MediaImageProps = {
  value: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  bucket?: string;
  loading?: "eager" | "lazy";
  placeholder?: ReactNode;
};

export function MediaImage({ value, alt, className, fallbackClassName, bucket = "media", loading = "lazy", placeholder }: MediaImageProps) {
  const url = useMediaUrl(value, bucket);
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
    <img
      src={url}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
