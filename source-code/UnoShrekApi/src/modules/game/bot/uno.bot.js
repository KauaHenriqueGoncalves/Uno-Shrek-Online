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

    if (!player?.hand?.cards?.length) {
      return null;
    }

    const hand = player.hand.cards;

    const topCard =
      state.discard?.length > 0
        ? state.discard[state.discard.length - 1]
        : null;

    const playableCards = hand.filter((card) =>
      isValidPlay(card, topCard, state.activeColor),
    );

    // Nenhuma carta jogável, o bot deve comprar uma carta
    if (playableCards.length === 0) {
      return null;
    }

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
    const specialCards = cards.filter((card) =>
      SPECIAL_CARDS.includes(card.type),
    );

    if (specialCards.length === 0) {
      return null;
    }

    const drawTwo = specialCards.find(
      (card) => card.type === "draw_two",
    );

    if (drawTwo) {
      return drawTwo;
    }

    const skip = specialCards.find(
      (card) => card.type === "skip",
    );

    if (skip) {
      return skip;
    }

    return specialCards.find(
      (card) => card.type === "reverse",
    );
  }

  // Aqui escolhe uma carta normal.
  // Para manter o bot no nível intermediário, não fazemos uma análise extremamente complexa.
  // Preferimos cartas que aparecem mais vezes na mão, ajudando o bot a manter opções para os próximos turnos.
  chooseNormalCard(cards) {
    const colorCount = {};

    for (const card of cards) {
      if (COLORS.includes(card.color)) {
        colorCount[card.color] =
          (colorCount[card.color] || 0) + 1;
      }
    }

    const scoredCards = cards.map((card) => ({
      card,
      score: colorCount[card.color] || 0,
    }));

    scoredCards.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return Math.random() - 0.5;
    });

    return scoredCards[0].card;
  }

  // Escolhe coringa
  chooseWildCard(cards) {
    const wild = cards.find(
      (card) => card.type === "wild",
    );

    return wild || cards[0];
  }

 
  // Cria a decisão final do bot.
  createDecision(card, hand) {
    const remainingCards = hand.filter(
      (handCard) => handCard.id !== card.id,
    );

    let colorChoice = null;

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

  // Obtem o inddex do prox jogador, respeitando a direção atual da partida.
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