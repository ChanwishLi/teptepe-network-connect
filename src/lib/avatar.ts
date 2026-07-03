import { driveImageUrl } from "@/lib/drive";

export function useAvatarUrl(pathOrUrl: string | null | undefined) {
  return driveImageUrl(pathOrUrl);
}
