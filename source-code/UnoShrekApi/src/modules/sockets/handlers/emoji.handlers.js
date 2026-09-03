const emojiMap = new Map([
  [1, "angry"],
  [2, "king"],
  [3, "laughing"],
  [4, "kiss"],
  [5, "king_thinking"],
  [6, "sleeping"],
  [7, "crying"],
]);

export function getEmojiByKey(key) {
  const emoji = emojiMap.get(key);
  if (!emoji) {
    throw new Error(`Emoji with key ${key} not found.`);
  }
  return emoji;
}
