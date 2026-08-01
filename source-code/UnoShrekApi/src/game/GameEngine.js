import { createDeck, deal, shuffle, isValidPlay, cardEffect } from "./deck.js";

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Initialize a new game state from a list of player ids.
 * Returns an object: { deck, discard, players: [{player, hand:{cards:[]}}], currentPlayer, direction, activeColor }
 */
export function startGameState(playerIds, handSize = 7) {
  const deck = createDeck();
  const players = playerIds.map((id) => ({ player: id, hand: { cards: [] } }));
  players.forEach((p) => {
    p.hand.cards = deal(deck, handSize);
  });
  const top = deck.shift();
  const discard = top ? [top] : [];
  const currentPlayer = players.length > 0 ? players[0].player : null;
  const direction = 1;
  const activeColor = null;
  return { deck, discard, players, currentPlayer, direction, activeColor };
}

/**
 * Ensure deck has cards by refilling from discard (keeping top).
 * Returns new state object (immutable).
 */
export function refillDeckIfNeeded(state) {
  const s = clone(state);
  if (!s.deck || s.deck.length === 0) {
    const top = s.discard && s.discard.length > 0 ? s.discard[s.discard.length - 1] : null;
    const rest = s.discard && s.discard.length > 1 ? s.discard.slice(0, s.discard.length - 1) : [];
    s.deck = shuffle(rest);
    s.discard = top ? [top] : [];
  }
  return s;
}

/**
 * Draw `count` cards for player at index `playerIndex`.
 * Returns new state and drawn cards.
 */
export function drawFromDeck(state, playerIndex, count = 1) {
  let s = refillDeckIfNeeded(state);
  s = clone(s);
  const drawn = [];
  for (let i = 0; i < count; i++) {
    if (s.deck.length === 0) {
      s = refillDeckIfNeeded(s);
    }
    const c = s.deck.shift();
    if (c) drawn.push(c);
  }
  s.players[playerIndex].hand = s.players[playerIndex].hand || { cards: [] };
  s.players[playerIndex].hand.cards.push(...drawn);
  return { state: s, drawn };
}

/**
 * Validate whether a play is legal.
 */
export function validatePlay(card, topCard, activeColor) {
  return isValidPlay(card, topCard, activeColor);
}

/**
 * Apply a play: remove a card from player's hand, push to discard, set activeColor and direction,
 * apply draw/skip/reverse effects and advance currentPlayer.
 * Returns new state and an object with effect info { drawnTo: playerIndex, drawnCards }
 */
export function applyPlay(state, playerIndex, cardToPlay, colorChoice = null) {
  let s = clone(state);
  const hand = s.players[playerIndex].hand || { cards: [] };
  const idx = hand.cards.findIndex((c) => c.id === cardToPlay.id || (c.color === cardToPlay.color && c.type === cardToPlay.type && c.value === cardToPlay.value));
  if (idx === -1) {
    throw new Error("Card not found in hand");
  }
  const card = hand.cards.splice(idx, 1)[0];
  s.discard = s.discard || [];
  s.discard.push(card);

  if (card.color === "wild") {
    if (!colorChoice) throw new Error("colorChoice required for wild");
    s.activeColor = colorChoice;
  } else {
    s.activeColor = card.color;
  }

  if (typeof s.direction !== "number") s.direction = 1;
  const effect = cardEffect(card, s.direction, s.players.length);
  s.direction = effect.direction;

  // compute next index base on direction
  const dir = s.direction === 1 ? 1 : -1;
  const next = (playerIndex + dir + s.players.length) % s.players.length;

  // apply draw to next player
  let drawnCards = [];
  if (effect.drawCount && effect.drawCount > 0) {
    const result = drawFromDeck(s, next, effect.drawCount);
    s = result.state;
    drawnCards = result.drawn;
  }

  const steps = effect.skipNext ? 2 : 1;
  let newIndex = playerIndex;
  for (let sstep = 0; sstep < steps; sstep++) {
    newIndex = (newIndex + dir + s.players.length) % s.players.length;
  }
  s.currentPlayer = s.players[newIndex].player;

  return { state: s, drawnCards, effect };
}

export default {
  startGameState,
  refillDeckIfNeeded,
  drawFromDeck,
  validatePlay,
  applyPlay,
};

