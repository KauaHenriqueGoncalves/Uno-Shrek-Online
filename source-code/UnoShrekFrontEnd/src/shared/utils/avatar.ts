import shrekAvatar from "../../../assets/avatar-shrek.png";
import fionaAvatar from "../../../assets/avatar-fiona.png";
import donkeyAvatar from "../../../assets/avatar-donkey.png";
import pussAvatar from "../../../assets/avatar-puss.png";

export const AVATAR_MAP = {
  shrek: shrekAvatar,
  fiona: fionaAvatar,
  donkey: donkeyAvatar,
  puss: pussAvatar,
} as const;

export type AvatarKey = keyof typeof AVATAR_MAP;

export function resolveAvatar(
  picture?: string | null,
  avatarKey?: string | null,
): string | undefined {
  if (picture) {
    return picture;
  }
  if (avatarKey && avatarKey in AVATAR_MAP) {
    return AVATAR_MAP[avatarKey as AvatarKey];
  }
  return undefined;
}
