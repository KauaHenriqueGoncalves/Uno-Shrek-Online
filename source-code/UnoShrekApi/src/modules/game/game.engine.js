import { createDeck, deal, shuffle, isValidPlay, cardEffect } from "./deck.js";

/**
 * Clona um objeto de estado de forma profunda (sem manter referências).
 */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Monta o estado inicial de uma partida: cria o baralho, distribui as mãos, vira a primeira carta do descarte e define o primeiro jogador.
 */
export function startGameState(playerIds, handSize = 7, deck = createDeck()) {
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
 * Se o monte de compra estiver vazio, reembaralha o descarte (menos a carta do topo) e o transforma no novo monte.
 */
export function refillDeckIfNeeded(state) {
  const s = clone(state);
  if (!s.deck || s.deck.length === 0) {
    const top =
      s.discard && s.discard.length > 0
        ? s.discard[s.discard.length - 1]
        : null;
    const rest =
      s.discard && s.discard.length > 1
        ? s.discard.slice(0, s.discard.length - 1)
        : [];
    s.deck = shuffle(rest);
    s.discard = top ? [top] : [];
  }
  return s;
}

/**
 * Compra `count` cartas do monte para o jogador informado, reabastecendo o monte se necessário.
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
 * Verifica se uma carta pode ser jogada em cima da carta do topo, considerando a cor ativa.
 */
export function validatePlay(card, topCard, activeColor) {
  return isValidPlay(card, topCard, activeColor);
}

/**
 * Aplica a jogada de uma carta: remove da mão, coloca no descarte, resolve cor ativa/efeito (pular, inverter, comprar) e define o próximo jogador.
 */
export function applyPlay(state, playerIndex, cardToPlay, colorChoice = null) {
  let s = clone(state);
  const hand = s.players[playerIndex].hand || { cards: [] };
  const idx = hand.cards.findIndex(
    (c) =>
      c.id === cardToPlay.id ||
      (c.color === cardToPlay.color &&
        c.type === cardToPlay.type &&
        c.value === cardToPlay.value),
  );
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

  const dir = s.direction === 1 ? 1 : -1;
  const next = (playerIndex + dir + s.players.length) % s.players.length;

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
