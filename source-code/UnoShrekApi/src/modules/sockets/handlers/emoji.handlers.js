const emojiMap = new Map([
  [1, "shrekS"],
  [2, "shrekPls"],
  [3, "ShrekBabyDancing"],
  [4, "RIZZ"],
  [5, "please"],
  [6, "Donkey"],
]);

export function getEmojiByKey(key) {
  const emoji = emojiMap.get(key);
  if (!emoji) {
    throw new Error(`Emoji with key ${key} not found.`);
  }
  return emoji;
}
