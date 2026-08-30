import {
  createDeck,
  deal,
  shuffle,
  isValidPlay,
  cardEffect,
} from "./util/deck.js";

/**
 * Clona um objeto de estado de forma profunda (sem manter referências).
 */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function samePlayer(first, second) {
  return String(first) === String(second);
}

/**
 * Monta o estado inicial de uma partida: cria o baralho, distribui as mãos, vira a primeira carta do descarte e define o primeiro jogador.
 */
export function startGameState(playerIds, handSize = 7, deck = createDeck()) {
  const players = playerIds.map((id) => ({
    player: id,
    saidUno: false,
    hand: { cards: [] },
  }));
  players.forEach((p) => {
    p.hand.cards = deal(deck, handSize);
  });
  const top = deck.shift();
  const discard = top ? [top] : [];
  const currentPlayer = players.length > 0 ? players[0].player : null;
  const direction = 1;
  const activeColor = null;
  const unoChallenge = null;
  return {
    deck,
    discard,
    players,
    currentPlayer,
    direction,
    activeColor,
    unoChallenge,
  };
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
  s.players[playerIndex].saidUno = false;
  s.unoChallenge =
    s.players[playerIndex].hand.cards.length === 1
      ? { player: s.players[playerIndex].player }
      : null;

  return { state: s, drawnCards, effect };
}

/** Registra a declaração UNO do jogador que ficou com uma carta. */
export function sayUno(state, playerIndex) {
  const s = clone(state);
  const challenge = s.unoChallenge;

  if (!challenge || !samePlayer(challenge.player, s.players[playerIndex].player)) {
    throw new Error("Player cannot say UNO");
  }

  s.players[playerIndex].saidUno = true;
  s.unoChallenge = null;
  return s;
}

/** Resolve um desafio correto e compra uma carta para o jogador sem declaração. */
export function challengeUno(state, challengerIndex) {
  const s = clone(state);
  const challenge = s.unoChallenge;

  if (
    !challenge ||
    samePlayer(challenge.player, s.players[challengerIndex].player)
  ) {
    throw new Error("Player cannot challenge UNO");
  }

  const targetIndex = s.players.findIndex(
    (player) => samePlayer(player.player, challenge.player),
  );

  if (targetIndex === -1) {
    throw new Error("UNO challenge target not found");
  }

  const result = drawFromDeck(s, targetIndex, 1);
  result.state.unoChallenge = null;
  return result;
}

export function clearUnoChallenge(state) {
  const s = clone(state);
  s.unoChallenge = null;
  return s;
}

/**
 * Verifica se algum jogador ficou sem cartas.
 * Retorna o player id do vencedor ou null se o jogo continua.
 */
export function checkWinner(state) {
  const winner = state.players.find(
    (p) => p.hand.cards.length === 0
  );
  return winner ? winner.player : null;
}

export default {
  startGameState,
  refillDeckIfNeeded,
  drawFromDeck,
  validatePlay,
  applyPlay,
  sayUno,
  challengeUno,
  clearUnoChallenge,
  checkWinner,
};
