import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SIGNED_URL_TTL = 60 * 60 * 24 * 7;
const KNOWN_MEDIA_BUCKETS = ["media", "event-banners", "story-images", "avatars"];

function extractStorageRef(value: string, fallbackBucket: string) {
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return { bucket: fallbackBucket, path: value.replace(/^\/+/, "") };

  try {
    const url = new URL(value);
    for (const bucket of KNOWN_MEDIA_BUCKETS) {
      const markers = [
        `/storage/v1/object/public/${bucket}/`,
        `/storage/v1/object/sign/${bucket}/`,
        `/storage/v1/object/authenticated/${bucket}/`,
        `/storage/v1/render/image/public/${bucket}/`,
        `/storage/v1/render/image/sign/${bucket}/`,
      ];
      const marker = markers.find((m) => url.pathname.includes(m));
      if (!marker) continue;
      const path = decodeURIComponent(url.pathname.split(marker)[1] ?? "").replace(/^\/+/, "");
      return path ? { bucket, path } : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function resolveStoragePath(value: string | null | undefined, bucket = "media") {
  if (!value) return null;
  return extractStorageRef(value, bucket)?.path ?? null;
}

export function useMediaUrl(value: string | null | undefined, bucket = "media") {
  const storageRef = value ? extractStorageRef(value, bucket) : null;

  return useQuery({
    queryKey: ["media-url", bucket, value],
    enabled: !!value,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: false,
    queryFn: async () => {
      if (!value) return null;
      if (!storageRef) return value;
      const { data, error } = await supabase.storage.from(storageRef.bucket).createSignedUrl(storageRef.path, SIGNED_URL_TTL);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
  }).data ?? null;
}
