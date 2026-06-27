import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve a stored avatar reference into a viewable URL.
 * - Full URLs (Google, etc.) pass through unchanged
 * - Storage paths get a long-lived signed URL (bucket is private)
 */
export function useAvatarUrl(pathOrUrl: string | null | undefined) {
  return useQuery({
    queryKey: ["avatar-url", pathOrUrl],
    enabled: !!pathOrUrl,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: false,
    queryFn: async () => {
      if (!pathOrUrl) return null;
      if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
      const { data } = await supabase.storage.from("avatars").createSignedUrl(pathOrUrl, 60 * 60 * 24 * 7);
      return data?.signedUrl ?? null;
    },
  }).data ?? null;
}
