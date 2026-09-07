import {
  createDeck,
  deal,
  shuffle,
  isValidPlay,
  cardEffect,
} from "./util/deck.js";

/**
 * Clona um objeto de estado de forma profunda (sem manter referências).
 *
 * Cria uma cópia completa do estado utilizando serialização JSON.
 * Isso evita alterações diretas no objeto original durante as ações
 * realizadas ao longo da partida.
 */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Compara dois identificadores de jogadores.
 *
 * A conversão para String garante que a comparação funcione mesmo
 * quando os identificadores possuem tipos diferentes, como ObjectId
 * e string.
 */
function samePlayer(first, second) {
  return String(first) === String(second);
}

/**
 * Monta o estado inicial de uma partida: cria o baralho, distribui as mãos,
 * vira a primeira carta do descarte e define o primeiro jogador.
 *
 * @param {Array} playerIds - Lista com os identificadores dos jogadores.
 * @param {number} handSize - Quantidade inicial de cartas por jogador.
 * @param {Array} deck - Baralho utilizado na partida.
 * @returns {Object} Estado inicial completo da partida.
 */
export function startGameState(playerIds, handSize = 7, deck = createDeck()) {
  // Cria o estado inicial de cada jogador com uma mão vazia.
  const players = playerIds.map((id) => ({
    player: id,
    saidUno: false,
    hand: { cards: [] },
  }));

  // Distribui a quantidade inicial de cartas para cada jogador.
  players.forEach((p) => {
    p.hand.cards = deal(deck, handSize);
  });

  // Remove a primeira carta do baralho para iniciar a pilha de descarte.
  const top = deck.shift();
  const discard = top ? [top] : [];

  // Define o primeiro jogador como responsável pelo primeiro turno.
  const currentPlayer = players.length > 0 ? players[0].player : null;

  // Define a direção inicial da partida.
  const direction = 1;

  // Inicialmente não existe uma cor ativa definida.
  const activeColor = null;

  // Inicialmente não existe nenhum desafio de UNO pendente.
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
 * Se o monte de compra estiver vazio, reembaralha o descarte
 * menos a carta do topo e o transforma no novo monte.
 */
export function refillDeckIfNeeded(state) {
  // Trabalha em uma cópia para não alterar diretamente o estado original.
  const s = clone(state);

  // O descarte só é reutilizado quando o monte de compra está vazio.
  if (!s.deck || s.deck.length === 0) {
    // Mantém a última carta jogada no topo do descarte.
    const top =
      s.discard && s.discard.length > 0
        ? s.discard[s.discard.length - 1]
        : null;

    // Separa todas as cartas anteriores para formar o novo monte.
    const rest =
      s.discard && s.discard.length > 1
        ? s.discard.slice(0, s.discard.length - 1)
        : [];

    // Embaralha as cartas disponíveis.
    s.deck = shuffle(rest);

    // Mantém apenas a carta do topo no descarte.
    s.discard = top ? [top] : [];
  }

  return s;
}

/**
 * Compra `count` cartas do monte para o jogador informado,
 * reabastecendo o monte se necessário.
 */
export function drawFromDeck(state, playerIndex, count = 1) {
  // Garante que exista um monte disponível antes da compra.
  let s = refillDeckIfNeeded(state);

  // Cria uma nova cópia para evitar alterações por referência.
  s = clone(s);

  // Armazena as cartas compradas.
  const drawn = [];

  for (let i = 0; i < count; i++) {
    // Caso o monte termine durante a compra, tenta reabastecê-lo.
    if (s.deck.length === 0) {
      s = refillDeckIfNeeded(s);
    }

    // Remove a primeira carta disponível do monte.
    const c = s.deck.shift();

    // Adiciona a carta à lista de cartas compradas.
    if (c) drawn.push(c);
  }

  // Garante que o jogador possua uma estrutura de mão válida.
  s.players[playerIndex].hand =
    s.players[playerIndex].hand || { cards: [] };

  // Adiciona todas as cartas compradas à mão do jogador.
  s.players[playerIndex].hand.cards.push(...drawn);

  return { state: s, drawn };
}

/**
 * Verifica se uma carta pode ser jogada considerando a carta
 * do topo e a cor ativa da partida.
 */
export function validatePlay(card, topCard, activeColor) {
  return isValidPlay(card, topCard, activeColor);
}

/**
 * Aplica a jogada de uma carta, removendo-a da mão,
 * colocando-a no descarte e processando seus efeitos.
 */
export function applyPlay(state, playerIndex, cardToPlay, colorChoice = null) {
  // Cria uma cópia do estado para preservar o objeto original.
  let s = clone(state);

  // Obtém a mão do jogador que está realizando a jogada.
  const hand = s.players[playerIndex].hand || { cards: [] };

  // Procura a carta na mão utilizando seu ID ou suas propriedades.
  const idx = hand.cards.findIndex(
    (c) =>
      c.id === cardToPlay.id ||
      (c.color === cardToPlay.color &&
        c.type === cardToPlay.type &&
        c.value === cardToPlay.value),
  );

  // Impede que um jogador utilize uma carta que não possui.
  if (idx === -1) {
    throw new Error("Card not found in hand");
  }

  // Remove a carta da mão do jogador.
  const card = hand.cards.splice(idx, 1)[0];

  // Garante que a pilha de descarte exista.
  s.discard = s.discard || [];

  // Adiciona a carta jogada ao descarte.
  s.discard.push(card);

  // Cartas coringa exigem que o jogador escolha uma nova cor.
  if (card.color === "wild") {
    if (!colorChoice) throw new Error("colorChoice required for wild");

    s.activeColor = colorChoice;
  } else {
    // Cartas normais definem sua própria cor como ativa.
    s.activeColor = card.color;
  }

  // Garante que exista uma direção válida.
  if (typeof s.direction !== "number") s.direction = 1;

  // Obtém o efeito da carta jogada.
  const effect = cardEffect(card, s.direction, s.players.length);

  // Atualiza a direção caso a carta tenha invertido o jogo.
  s.direction = effect.direction;

  // Define o sentido utilizado para localizar o próximo jogador.
  const dir = s.direction === 1 ? 1 : -1;

  // Calcula o jogador imediatamente seguinte.
  const next =
    (playerIndex + dir + s.players.length) % s.players.length;

  // Armazena as cartas compradas devido a efeitos especiais.
  let drawnCards = [];

  // Caso a carta obrigue o próximo jogador a comprar cartas.
  if (effect.drawCount && effect.drawCount > 0) {
    const result = drawFromDeck(s, next, effect.drawCount);

    s = result.state;
    drawnCards = result.drawn;
  }

  // Cartas de bloqueio fazem o próximo jogador perder o turno.
  const steps = effect.skipNext ? 2 : 1;

  // Inicia o cálculo do próximo jogador.
  let newIndex = playerIndex;

  // Avança a quantidade necessária de jogadores.
  for (let sstep = 0; sstep < steps; sstep++) {
    newIndex =
      (newIndex + dir + s.players.length) % s.players.length;
  }

  // Define o jogador responsável pelo próximo turno.
  s.currentPlayer = s.players[newIndex].player;

  // Após jogar, o jogador ainda não declarou UNO.
  s.players[playerIndex].saidUno = false;

  // Se o jogador terminou com uma carta, cria um desafio de UNO.
  s.unoChallenge =
    s.players[playerIndex].hand.cards.length === 1
      ? { player: s.players[playerIndex].player }
      : null;

  return { state: s, drawnCards, effect };
}

/**
 * Registra a declaração UNO do jogador que ficou com uma carta.
 */
export function sayUno(state, playerIndex) {
  // Cria uma cópia do estado atual.
  const s = clone(state);

  // Obtém o desafio de UNO pendente.
  const challenge = s.unoChallenge;

  // Apenas o jogador que ficou com uma carta pode declarar UNO.
  if (
    !challenge ||
    !samePlayer(challenge.player, s.players[playerIndex].player)
  ) {
    throw new Error("Player cannot say UNO");
  }

  // Registra que o jogador declarou UNO.
  s.players[playerIndex].saidUno = true;

  // Remove a possibilidade de desafio.
  s.unoChallenge = null;

  return s;
}

/**
 * Resolve um desafio de UNO realizado contra um jogador
 * que ficou com uma carta sem declarar UNO.
 */
export function challengeUno(state, challengerIndex) {
  // Cria uma cópia do estado atual.
  const s = clone(state);

  // Obtém o desafio pendente.
  const challenge = s.unoChallenge;

  // Não permite desafio sem jogador pendente ou contra si mesmo.
  if (
    !challenge ||
    samePlayer(challenge.player, s.players[challengerIndex].player)
  ) {
    throw new Error("Player cannot challenge UNO");
  }

  // Localiza o jogador que deveria ter declarado UNO.
  const targetIndex = s.players.findIndex(
    (player) => samePlayer(player.player, challenge.player),
  );

  // Garante que o jogador associado ao desafio exista.
  if (targetIndex === -1) {
    throw new Error("UNO challenge target not found");
  }

  // Aplica a penalidade de uma carta ao jogador desafiado.
  const result = drawFromDeck(s, targetIndex, 1);

  // Remove o desafio após a penalidade.
  result.state.unoChallenge = null;

  return result;
}

/**
 * Remove manualmente qualquer desafio de UNO pendente.
 */
export function clearUnoChallenge(state) {
  // Cria uma cópia do estado para preservar o original.
  const s = clone(state);

  // Remove a referência ao jogador pendente.
  s.unoChallenge = null;

  return s;
}

/**
 * Verifica se algum jogador ficou sem cartas.
 *
 * Retorna o ID do jogador vencedor ou null caso o jogo continue.
 */
export function checkWinner(state) {
  // Procura o primeiro jogador que não possui cartas na mão.
  const winner = state.players.find(
    (p) => p.hand.cards.length === 0
  );

  // Retorna o identificador do vencedor ou null.
  return winner ? winner.player : null;
}

/**
 * Exporta todas as funções principais responsáveis
 * pelo gerenciamento do estado da partida.
 */
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