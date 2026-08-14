export const COLORS = ["red", "blue", "green", "yellow"];
export const WILD_TYPES = ["wild", "wild_draw_four"];
export const SPECIAL_TYPES = ["skip", "reverse", "draw_two"];

export function createDeck() {
  const deck = [];
  for (const color of COLORS) {
    deck.push(makeCard(color, "number", 0));
    for (let number = 1; number <= 9; number++) {
      deck.push(makeCard(color, "number", number));
      deck.push(makeCard(color, "number", number));
    }
    for (const type of SPECIAL_TYPES) {
      deck.push(makeCard(color, type));
      deck.push(makeCard(color, type));
    }
  }
  for (const type of WILD_TYPES) {
    for (let i = 0; i < 4; i++) {
      deck.push(makeCard("wild", type, null));
    }
  }
  return shuffle(deck);
}

function makeCard(color, type, value) {
  return { color, type, value };
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function deal(deck, count) {
  return deck.splice(0, count);
}

export function isValidPlay(card, topCard, activeColor) {
  if (WILD_TYPES.includes(card.type)) {
    return true;
  }
  const matchColor = card.color === (activeColor ?? topCard.color);
  const matchType =
    card.type !== "number"
      ? card.type === topCard.type
      : card.value === topCard.value && topCard.type === "number";
  return matchColor || matchType;
}

export function cardEffect(card, currentDirection, playerCount) {
  let direction = currentDirection;
  let skipNext = false;
  let drawCount = 0;
  switch (card.type) {
    case "reverse":
      direction = currentDirection * -1;
      if (playerCount === 2) {
        skipNext = true;
      }
      break;
    case "skip":
      skipNext = true;
      break;
    case "draw_two":
      drawCount = 2;
      skipNext = true;
      break;
    case "wild_draw_four":
      drawCount = 4;
      skipNext = true;
      break;
    default:
      break;
  }
  return { direction, skipNext, drawCount };
}
