import { isValidPlay } from "../util/deck.js";

const SPECIAL_CARDS = ["skip", "reverse", "draw_two"];
const WILD_CARDS = ["wild", "wild_draw_four"];
const COLORS = ["red", "blue", "green", "yellow"];

// OBS: EM FASE DE TESTE
export default class UnoBot {
  /**
   * Decide qual jogada o bot deve realizar.
   *
   * O bot possui uma inteligência intermediária:
   * - Prioriza cartas especiais contra jogadores próximos de vencer;
   * - Evita gastar coringas;
   * - Prefere cartas normais;
   * - Escolhe a cor mais frequente ao usar um coringa.
   */
  choosePlay(state, playerIndex) {
    const player = state.players[playerIndex];

    // Verifica se o jogador é um bot e se possui cartas na mão
    if (!player?.hand?.cards?.length) {
      return null;
    }

    // Representa a mão do bot
    const hand = player.hand.cards;

    // Filtra as cartas jogáveis com base na carta do topo do descarte e na cor ativa
    const topCard =
      state.discard?.length > 0
        ? state.discard[state.discard.length - 1]
        : null;

    // Filtra as cartas jogáveis com base na carta do topo do descarte e na cor ativa
    const playableCards = hand.filter((card) =>
      isValidPlay(card, topCard, state.activeColor),
    );

    // Nenhuma carta jogável, o bot deve comprar uma carta
    if (playableCards.length === 0) {
      return null;
    }

    // Determina o próximo jogador na ordem de jogo
    const nextPlayerIndex = this.getNextPlayerIndex(
      state,
      playerIndex,
    );

    const nextPlayer = state.players[nextPlayerIndex];
 
    const nextPlayerCards =
      nextPlayer?.hand?.cards?.length ?? Infinity;

    
     //Se o próximo jogador está perto de vencer,damos prioridade às cartas especiais
    if (nextPlayerCards <= 2) {
      const specialCard = this.chooseSpecialCard(playableCards);

      if (specialCard) {
        return this.createDecision(specialCard, hand);
      }
    }
    
     //  Evita gastar coringas enquanto houver outras cartas jogáveis
    const nonWildCards = playableCards.filter(
      (card) => !WILD_CARDS.includes(card.type),
    );

    if (nonWildCards.length > 0) {
      const selectedCard = this.chooseNormalCard(
        nonWildCards,
      );

      return this.createDecision(selectedCard, hand);
    }

    
    // Se só existem coringas jogáveis, finalmente utiliza um deles.
    const wildCard = this.chooseWildCard(playableCards);

    return this.createDecision(wildCard, hand);
  }

  
  // Prioridade das cartas especiais: = 2 > Skip > Reverse
  chooseSpecialCard(cards) {

    // Aqui escolhe a carta especial com maior prioridade, caso haja mais de uma jogável.
    const specialCards = cards.filter((card) =>
      SPECIAL_CARDS.includes(card.type),
    );

    // Se não houver cartas especiais jogáveis, retorna null.
    if (specialCards.length === 0) {
      return null;
    }

    // Prioridade das cartas especiais: Draw Two > Skip > Reverse
    const drawTwo = specialCards.find(
      (card) => card.type === "draw_two",
    );

    if (drawTwo) {
      return drawTwo;
    }

    // Se não houver Draw Two, procura por Skip
    const skip = specialCards.find(
      (card) => card.type === "skip",
    );

    if (skip) {
      return skip;
    }

    // Se não houver Skip, procura por Reverse
    return specialCards.find(
      (card) => card.type === "reverse",
    );
  }

  // Aqui escolhe uma carta normal.
  // Para manter o bot no nível intermediário, não fazemos uma análise extremamente complexa.
  // Preferimos cartas que aparecem mais vezes na mão, ajudando o bot a manter opções para os próximos turnos.
  chooseNormalCard(cards) {

    // Contagem de cores na mão do bot
    const colorCount = {};

    // Contabiliza a quantidade de cartas de cada cor na mão do bot
    for (const card of cards) {
      if (COLORS.includes(card.color)) {
        colorCount[card.color] =
          (colorCount[card.color] || 0) + 1;
      }
    }

    // Cria um array de objetos contendo a carta e sua pontuação com base na contagem de cores
    const scoredCards = cards.map((card) => ({
      card,
      score: colorCount[card.color] || 0,
    }));

    // Ordena as cartas com base na pontuação 
    scoredCards.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return Math.random() - 0.5; // empate, então escolhe aleatoriamente entre as cartas com a mesma pontuação
    });

    return scoredCards[0].card;
  }

  // Escolhe coringa
  chooseWildCard(cards) {
    const wild = cards.find(
      (card) => card.type === "wild",
    );

    return wild || cards[0]; // Se não houver coringa simples, retorna o primeiro coringa disponível 
  }

 
  // Cria a decisão final do bot.
  createDecision(card, hand) {

    // Cria a mão que sobraria depois que o bot jogar aquela carta
    const remainingCards = hand.filter(
      (handCard) => handCard.id !== card.id,
    );

    
    let colorChoice = null;

    // Se a carta jogada for um coringa, escolhe a cor que aparece mais vezes na mão do bot.
    if (WILD_CARDS.includes(card.type)) {
      colorChoice = this.chooseBestColor(remainingCards);
    }

    return {
      card,
      colorChoice,
      callUno: remainingCards.length === 1,
    };
  }

  
  // Escolhe a cor que vai aparecer mais vezes na mão do bot
  chooseBestColor(hand) {
    const colorCount = {
      red: 0,
      blue: 0,
      green: 0,
      yellow: 0,
    };

    for (const card of hand) {
      if (
        Object.prototype.hasOwnProperty.call(
          colorCount,
          card.color,
        )
      ) {
        colorCount[card.color]++;
      }
    }

    return Object.entries(colorCount)
      .sort((a, b) => b[1] - a[1])
      .map(([color]) => color)[0];
  }

  // Obtem o index do prox jogador, respeitando a direção atual da partida.
  getNextPlayerIndex(state, playerIndex) {
    const direction =
      state.direction === -1 ? -1 : 1;

    return (
      (playerIndex + direction + state.players.length) %
      state.players.length
    );
  }

  // Verifica se o bot deve declarar UNO.
  shouldCallUno(hand) {
    return hand.length === 1;
  }
}