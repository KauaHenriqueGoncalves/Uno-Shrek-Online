import {
  createDeck,
  deal,
  shuffle,
  isValidPlay,
  cardEffect,
} from "./util/deck.js";

/**
 * Cria uma cópia profunda do estado do jogo.
 *
 * Isso evita que as funções alterem diretamente o objeto original,
 * permitindo trabalhar com uma nova versão do estado a cada ação.
 */
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Compara dois identificadores de jogadores.
 *
 * A conversão para String garante que a comparação funcione mesmo
 * quando os IDs possuem tipos diferentes, como ObjectId e string.
 */
function samePlayer(first, second) {
  return String(first) === String(second);
}

/**
 * Cria o estado inicial de uma nova partida.
 *
 * Para cada jogador, cria uma estrutura contendo sua mão e o estado
 * da declaração de UNO. Em seguida, distribui as cartas iniciais,
 * define a primeira carta do descarte e configura o primeiro turno.
 *
 * @param {Array} playerIds - Lista com os identificadores dos jogadores.
 * @param {number} handSize - Quantidade inicial de cartas por jogador.
 * @param {Array} deck - Baralho que será utilizado na partida.
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

  // Remove a primeira carta do baralho e a utiliza para iniciar a pilha de descarte.
  const top = deck.shift();
  const discard = top ? [top] : [];

  // Define o primeiro jogador da lista como responsável pelo primeiro turno da partida. 
  const currentPlayer = players.length > 0 ? players[0].player : null;

  // A direção 1 representa o sentido normal da partida.
  // O valor -1 será utilizado quando o sentido for invertido.
  const direction = 1;

  // A cor ativa é utilizada principalmente quando for uma carta coringa, permitindo que o jogador escolha uma nova cor. 
  const activeColor = null;

   // Armazena temporariamente o jogador que precisa declarar UNO.
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
 * Reabastecimento do monte de compra quando não existem mais cartas disponíveis.
 *
 * A carta do topo do descarte permanece na mesa, enquanto as demais
 * cartas são embaralhadas e passam a formar o novo monte de compra.
 *
 * @param {Object} state - Estado atual da partida.
 * @returns {Object} Novo estado com o baralho reabastecido, se necessário.
 */
export function refillDeckIfNeeded(state) {
  // Trabalha em uma cópia para não alterar diretamente o estado recebido.
  const s = clone(state);

  // O descarte só é reutilizado quando o monte de compra está vazio.
  if (!s.deck || s.deck.length === 0) {

    // Mantém a última carta jogada como carta atual da mesa.
    const top =
      s.discard && s.discard.length > 0
        ? s.discard[s.discard.length - 1]
        : null;

    // Separa todas as cartas anteriores para transformá-las
    // em um novo monte de compra.    
    const rest =
      s.discard && s.discard.length > 1
        ? s.discard.slice(0, s.discard.length - 1)
        : [];

    // Embaralha as cartas disponíveis e mantém apenas a carta do topo
    // na pilha de descarte.    
    s.deck = shuffle(rest);
    s.discard = top ? [top] : [];
  }
  return s;
}

/**
 * Compra uma ou mais cartas para um jogador.
 *
 * Antes de comprar, verifica se o monte possui cartas suficientes.
 * Caso o monte esteja vazio, tenta reutilizar as cartas do descarte.
 *
 * @param {Object} state - Estado atual da partida.
 * @param {number} playerIndex - Índice do jogador que irá comprar.
 * @param {number} count - Quantidade de cartas a serem compradas.
 * @returns {Object} Estado atualizado e as cartas que foram compradas.
 */
export function drawFromDeck(state, playerIndex, count = 1) {

  // Garante que exista um monte disponível antes da compra.
  let s = refillDeckIfNeeded(state);

   // Cria uma nova cópia para continuar trabalhando sem modificar as referências do estado original. 
  s = clone(s);

  // Armazena as cartas compradas durante esta ação.
  const drawn = [];

  for (let i = 0; i < count; i++) {

    // Caso o monte termine durante uma compra múltipla,
    // tenta reabastecê-lo novamente.
    if (s.deck.length === 0) {
      s = refillDeckIfNeeded(s);
    }
    // Remove a primeira carta disponível do monte.
    const c = s.deck.shift();

    if (c) drawn.push(c);
  }

  // Garante que o jogador possua uma estrutura de mão válida.
  s.players[playerIndex].hand = s.players[playerIndex].hand || { cards: [] };

    // Adiciona todas as cartas compradas à mão do jogador.
  s.players[playerIndex].hand.cards.push(...drawn);

  return { state: s, drawn };
}

/**
 * Verifica se uma carta pode ser jogada no estado atual da mesa.
 *
 * A validação considera a carta do topo e a cor ativa,
 * delegando as regras específicas para a função isValidPlay.
 *
 * @param {Object} card - Carta que o jogador deseja utilizar.
 * @param {Object} topCard - Carta atualmente no topo do descarte.
 * @param {string|null} activeColor - Cor ativa da partida.
 * @returns {boolean} Indica se a jogada é válida.
 */
export function validatePlay(card, topCard, activeColor) {
  return isValidPlay(card, topCard, activeColor);
}

/**
 * Processa uma jogada realizada por um jogador.
 *
 * A função remove a carta da mão, adiciona ao descarte, atualiza
 * a cor ativa, aplica os efeitos especiais da carta e define
 * qual será o próximo jogador.
 *
 * @param {Object} state - Estado atual da partida.
 * @param {number} playerIndex - Índice do jogador que realizou a jogada.
 * @param {Object} cardToPlay - Carta selecionada pelo jogador.
 * @param {string|null} colorChoice - Cor escolhida ao utilizar um coringa.
 * @returns {Object} Estado atualizado, cartas compradas e efeito aplicado.
 */
export function applyPlay(state, playerIndex, cardToPlay, colorChoice = null) {

  // Cria uma cópia do estado para preservar o objeto original.
  let s = clone(state);

  const hand = s.players[playerIndex].hand || { cards: [] };

  // Procura a carta na mão utilizando primeiro seu ID.
  // Caso não exista um ID correspondente, compara suas propriedades.
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

   // Remove a carta da mão e a coloca no topo do descarte.
  const card = hand.cards.splice(idx, 1)[0];


  s.discard = s.discard || [];
  s.discard.push(card);

   // Cartas coringa exigem que o jogador escolha a nova cor ativa.
  if (card.color === "wild") {
    if (!colorChoice) throw new Error("colorChoice required for wild");

    s.activeColor = colorChoice;
  } else {
    // Para cartas normais, a própria cor da carta passa a ser a cor ativa.
    s.activeColor = card.color;
  }

   // Garante que a partida possua uma direção válida antes de calcular o efeito da carta.
  if (typeof s.direction !== "number") s.direction = 1;

  // Obtém o efeito da carta, como inverter direção, pular o próximo jogador ou forçar compras.
  const effect = cardEffect(card, s.direction, s.players.length);

  // Atualiza a direção caso a carta tenha causado uma inversão.
  s.direction = effect.direction;

  // Define o sentido utilizado para localizar o próximo jogador.
  const dir = s.direction === 1 ? 1 : -1;

  // Calcula o jogador imediatamente seguinte considerando o sentido atual da partida. 
  const next = (playerIndex + dir + s.players.length) % s.players.length;

  let drawnCards = [];

  // Caso a carta obrigue o próximo jogador a comprar cartas, executa a compra antes de continuar o fluxo do turno.
  if (effect.drawCount && effect.drawCount > 0) {
    const result = drawFromDeck(s, next, effect.drawCount);

    s = result.state;
    drawnCards = result.drawn;
  }

   // Algumas cartas fazem o próximo jogador perder o turno. Nesse caso, avançamos duas posições em vez de uma.
  const steps = effect.skipNext ? 2 : 1;

  let newIndex = playerIndex;

  // Avança pelo número necessário de jogadores de acordo com a direção atual e o efeito aplicado.
  for (let sstep = 0; sstep < steps; sstep++) {
    newIndex = (newIndex + dir + s.players.length) % s.players.length;
  }
   // Define o jogador responsável pelo próximo turno.
  s.currentPlayer = s.players[newIndex].player;

   // Após jogar uma carta, o jogador ainda não declarou UNO até que execute explicitamente essa ação.
  s.players[playerIndex].saidUno = false;

  // Se o jogador terminou a jogada com apenas uma carta, ele passa a poder declarar UNO e também pode ser desafiado.
  s.unoChallenge =
    s.players[playerIndex].hand.cards.length === 1
      ? { player: s.players[playerIndex].player }
      : null;

  return { state: s, drawnCards, effect };
}

/**
 * Registra a declaração de UNO de um jogador.
 *
 * A declaração só é permitida quando o jogador possui um desafio
 * de UNO pendente associado a ele.
 *
 * @param {Object} state - Estado atual da partida.
 * @param {number} playerIndex - Índice do jogador que declarou UNO.
 * @returns {Object} Estado atualizado da partida.
 */
export function sayUno(state, playerIndex) {
  const s = clone(state);
  const challenge = s.unoChallenge;

  // Apenas o jogador que ficou com uma carta pode declarar UNO.
  if (!challenge || !samePlayer(challenge.player, s.players[playerIndex].player)) {
    throw new Error("Player cannot say UNO");
  }

  // Registra a declaração e remove a possibilidade de desafio.
  s.players[playerIndex].saidUno = true;
  s.unoChallenge = null;
  return s;
}

/**
 * Penaliza um jogador que ficou com uma carta e não declarou UNO.
 *
 * Outro jogador pode realizar o desafio enquanto o desafio
 * de UNO ainda estiver ativo.
 *
 * @param {Object} state - Estado atual da partida.
 * @param {number} challengerIndex - Índice do jogador que realizou o desafio.
 * @returns {Object} Estado atualizado e a carta utilizada como penalidade.
 */
export function challengeUno(state, challengerIndex) {
  const s = clone(state);
  const challenge = s.unoChallenge;

  // Não é possível desafiar se não houver um jogador pendente ou se o próprio jogador tentar desafiar a si mesmo.
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

  if (targetIndex === -1) {
    throw new Error("UNO challenge target not found");
  }

   // Aplica a penalidade de uma carta ao jogador desafiado.
  const result = drawFromDeck(s, targetIndex, 1);

   // Após a penalidade, o desafio deixa de estar disponível.
  result.state.unoChallenge = null;

  return result;
}

/**
 * Remove manualmente qualquer desafio de UNO pendente.
 *
 * @param {Object} state - Estado atual da partida.
 * @returns {Object} Estado sem um desafio de UNO ativo.
 */
export function clearUnoChallenge(state) {
  const s = clone(state);
   // Remove a referência ao jogador que estava pendente de declaração.
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
