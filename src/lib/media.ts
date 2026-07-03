import { driveImageUrl } from "@/lib/drive";

export function useMediaUrl(value: string | null | undefined) {
  return driveImageUrl(value);
}
