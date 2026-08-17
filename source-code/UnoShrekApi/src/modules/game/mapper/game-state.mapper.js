import CardRepository from "../../card/card.repository.js";

export default class GameStateMapper {
  constructor(cardSchema) {
    this.cardRepository = new CardRepository(cardSchema);
  }

  /**
   * Busca no banco as cartas referenciadas pelo jogo (deck, descarte e mãos) e monta o estado "puro" que
   * o engine entende. Mongoose -> pure state
   */
  async toEngineState(game) {
    const cardIds = this._collectCardIds(game);
    const cardMap = await this._loadCardMap(cardIds);
    const hydrate = (id) => this._hydrateCard(cardMap, id);
   const players = game.players.map((p) => ({
        player: p.player,
        isBot: p.isBot === true,
        hand: { cards: (p.hand?.cards ?? []).map(hydrate), },
     }));
    return {
      deck: game.deck.map(hydrate),
      discard: game.discard.map(hydrate),
      players,
      currentPlayer: game.currentPlayer,
      direction: game.direction ?? 1,
      activeColor: game.activeColor ?? null,
    };
  }

  /**
   * State conversion methods between GameOrchestrator and GameEngine. pure state -> Mongoose
   */
  applyEngineStateToGame(game, state) {
    const dehydrate = (card) => card.id;
    game.deck = state.deck.map(dehydrate);
    game.discard = state.discard.map(dehydrate);
    game.currentPlayer = state.currentPlayer;
    game.direction = state.direction;
    game.activeColor = state.activeColor;
    game.players = game.players.map((p) => {
      const ep = state.players.find(
        (sp) => sp.player.toString() === p.player.toString(),
      );
      return {
        ...p,
        isBot: p.isBot === true,
        hand: ep ? { cards: ep.hand.cards.map(dehydrate) } : { cards: [] },
      };
    });
    return game;
  }

  /**
   * Coleta, sem duplicar, todos os ids de carta usados pelo jogo (deck, descarte e mãos).
   */
  _collectCardIds(game) {
    const deckIds = game.deck;
    const discardIds = game.discard;
    const handIds = game.players.flatMap((p) => p.hand?.cards ?? []);
    const allIds = [...deckIds, ...discardIds, ...handIds].map((id) =>
      id.toString(),
    );
    return [...new Set(allIds)];
  }

  /**
   * Busca as cartas no banco e monta um mapa id -> carta, para consulta rápida.
   */
  async _loadCardMap(cardIds) {
    if (cardIds.length === 0) {
      return new Map();
    }
    const cardDocs = await this.cardRepository.getAllByIds(cardIds);
    return new Map(cardDocs.map((c) => [c._id.toString(), c]));
  }

  /**
   * Transforma um id de carta no objeto simples que o engine entende.
   */
  _hydrateCard(cardMap, id) {
    const card = cardMap.get(id.toString());
    if (!card) {
      throw new NotFoundError(`Card not found. [cardId=${id}]`);
    }
    return {
      id: card._id.toString(),
      color: card.color,
      type: card.type,
      value: card.value,
    };
  }
}
