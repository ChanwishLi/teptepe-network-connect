import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SIGNED_URL_TTL = 60 * 60 * 24 * 7;

function extractStoragePath(value: string, bucket: string) {
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) return value.replace(/^\/+/, "");

  try {
    const url = new URL(value);
    const markers = [
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/sign/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
      `/storage/v1/render/image/public/${bucket}/`,
      `/storage/v1/render/image/sign/${bucket}/`,
    ];
    const marker = markers.find((m) => url.pathname.includes(m));
    if (!marker) return null;
    return decodeURIComponent(url.pathname.split(marker)[1] ?? "").replace(/^\/+/, "") || null;
  } catch {
    return null;
  }
}

export function resolveStoragePath(value: string | null | undefined, bucket = "media") {
  if (!value) return null;
  return extractStoragePath(value, bucket);
}

export function useMediaUrl(value: string | null | undefined, bucket = "media") {
  const storagePath = resolveStoragePath(value, bucket);

  return useQuery({
    queryKey: ["media-url", bucket, value],
    enabled: !!value,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: false,
    queryFn: async () => {
      if (!value) return null;
      if (!storagePath) return value;
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, SIGNED_URL_TTL);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
  }).data ?? null;
}
