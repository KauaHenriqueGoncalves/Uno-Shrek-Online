import {
  startGameState,
  refillDeckIfNeeded,
  drawFromDeck,
  validatePlay,
  applyPlay,
} from "../../../src/modules/game/game.engine.js";
import * as deckModule from "../../../src/modules/game/deck.js";

jest.mock("../../../src/modules/game/deck.js", () => {
  const actual = jest.requireActual("../../../src/modules/game/deck.js");
  return {
    ...actual,
    shuffle: jest.fn((arr) => arr),
  };
});

function card(color, type, value = null, id = undefined) {
  return id !== undefined ? { id, color, type, value } : { color, type, value };
}

describe("game.engine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("startGameState", () => {
    it("should deal the given hand size to each player", () => {
      const deck = Array.from({ length: 20 }, (_, i) =>
        card("red", "number", i),
      );

      const state = startGameState(["p1", "p2"], 5, deck);

      expect(state.players).toHaveLength(2);
      expect(state.players[0].hand.cards).toHaveLength(5);
      expect(state.players[1].hand.cards).toHaveLength(5);
    });

    it("should set the first player as the current player", () => {
      const deck = Array.from({ length: 10 }, () => card("green", "skip"));

      const state = startGameState(["p1", "p2", "p3"], 2, deck);

      expect(state.currentPlayer).toBe("p1");
    });

    it("should initialize direction as 1 and activeColor as null", () => {
      const deck = Array.from({ length: 5 }, () => card("yellow", "reverse"));

      const state = startGameState(["p1"], 2, deck);

      expect(state.direction).toBe(1);
      expect(state.activeColor).toBeNull();
    });

    it("should set currentPlayer as null when there are no players", () => {
      const state = startGameState([], 5, []);

      expect(state.currentPlayer).toBeNull();
      expect(state.discard).toEqual([]);
    });
  });

  describe("refillDeckIfNeeded", () => {
    it("should not change the state when the deck is not empty", () => {
      const state = {
        deck: [card("red", "number", 1)],
        discard: [card("blue", "number", 2)],
        players: [],
      };

      const result = refillDeckIfNeeded(state);

      expect(result.deck).toEqual([card("red", "number", 1)]);
      expect(result.discard).toEqual([card("blue", "number", 2)]);
    });

    it("should rebuild the deck from the discard pile when the deck is empty", () => {
      const state = {
        deck: [],
        discard: [
          card("red", "number", 1),
          card("blue", "number", 2),
          card("green", "number", 3),
        ],
        players: [],
      };

      const result = refillDeckIfNeeded(state);

      expect(deckModule.shuffle).toHaveBeenCalled();
      expect(result.deck).toEqual([
        card("red", "number", 1),
        card("blue", "number", 2),
      ]);
      expect(result.discard).toEqual([card("green", "number", 3)]);
    });

    it("should result in an empty deck and discard when both are empty", () => {
      const state = { deck: [], discard: [], players: [] };

      const result = refillDeckIfNeeded(state);

      expect(result.deck).toEqual([]);
      expect(result.discard).toEqual([]);
    });

    it("should keep only the top card in discard when discard has a single card", () => {
      const state = {
        deck: [],
        discard: [card("red", "number", 5)],
        players: [],
      };

      const result = refillDeckIfNeeded(state);

      expect(result.deck).toEqual([]);
      expect(result.discard).toEqual([card("red", "number", 5)]);
    });
  });

  describe("drawFromDeck", () => {
    it("should draw the requested number of cards and add them to the player's hand", () => {
      const state = {
        deck: [card("red", "number", 1), card("blue", "number", 2)],
        discard: [card("green", "number", 9)],
        players: [{ player: "p1", hand: { cards: [] } }],
      };

      const { state: newState, drawn } = drawFromDeck(state, 0, 2);

      expect(drawn).toEqual([
        card("red", "number", 1),
        card("blue", "number", 2),
      ]);
      expect(newState.players[0].hand.cards).toEqual(drawn);
      expect(newState.deck).toEqual([]);
    });

    it("should create the hand when the player has none yet", () => {
      const state = {
        deck: [card("red", "number", 1)],
        discard: [card("green", "number", 9)],
        players: [{ player: "p1" }],
      };

      const { state: newState } = drawFromDeck(state, 0, 1);

      expect(newState.players[0].hand.cards).toEqual([
        card("red", "number", 1),
      ]);
    });

    it("should draw fewer cards than requested when the deck and discard cannot supply enough", () => {
      const state = {
        deck: [],
        discard: [card("green", "number", 9)],
        players: [{ player: "p1", hand: { cards: [] } }],
      };

      const { drawn } = drawFromDeck(state, 0, 3);

      expect(drawn).toEqual([]);
    });
  });

  describe("validatePlay", () => {
    it("should delegate to isValidPlay from deck.js", () => {
      const played = card("red", "number", 5);
      const top = card("red", "number", 7);

      const result = validatePlay(played, top, null);

      expect(result).toBe(true);
    });

    it("should return false for an invalid play", () => {
      const played = card("blue", "number", 5);
      const top = card("red", "number", 7);

      expect(validatePlay(played, top, null)).toBe(false);
    });
  });

  describe("applyPlay", () => {
    function baseState() {
      return {
        deck: [card("red", "number", 1), card("red", "number", 2)],
        discard: [card("blue", "number", 4)],
        players: [
          { player: "p1", hand: { cards: [card("red", "skip", null, "c1")] } },
          { player: "p2", hand: { cards: [] } },
          { player: "p3", hand: { cards: [] } },
        ],
        currentPlayer: "p1",
        direction: 1,
        activeColor: null,
      };
    }

    it("should remove the played card from the player's hand and add it to discard", () => {
      const state = baseState();
      const cardToPlay = { id: "c1" };

      const { state: newState } = applyPlay(state, 0, cardToPlay);

      expect(newState.players[0].hand.cards).toHaveLength(0);
      expect(newState.discard[newState.discard.length - 1]).toEqual(
        card("red", "skip", null, "c1"),
      );
    });

    it("should throw when the card is not found in the player's hand", () => {
      const state = baseState();
      const cardToPlay = { id: "does-not-exist" };

      expect(() => applyPlay(state, 0, cardToPlay)).toThrow(
        "Card not found in hand",
      );
    });

    it("should set activeColor to the card's color for a non-wild card", () => {
      const state = baseState();

      const { state: newState } = applyPlay(state, 0, { id: "c1" });

      expect(newState.activeColor).toBe("red");
    });

    it("should require colorChoice for a wild card and throw when missing", () => {
      const state = baseState();
      state.players[0].hand.cards = [
        { id: "w1", color: "wild", type: "wild", value: null },
      ];

      expect(() => applyPlay(state, 0, { id: "w1" })).toThrow(
        "colorChoice required for wild",
      );
    });

    it("should set activeColor to colorChoice when a wild card is played", () => {
      const state = baseState();
      state.players[0].hand.cards = [
        { id: "w1", color: "wild", type: "wild", value: null },
      ];

      const { state: newState } = applyPlay(state, 0, { id: "w1" }, "green");

      expect(newState.activeColor).toBe("green");
    });

    it("should skip a player and move currentPlayer two seats forward on a skip card", () => {
      const state = baseState();

      const { state: newState } = applyPlay(state, 0, { id: "c1" });

      expect(newState.currentPlayer).toBe("p3");
    });

    it("should advance currentPlayer by one seat for a plain number card", () => {
      const state = baseState();
      state.players[0].hand.cards = [
        { id: "n1", color: "red", type: "number", value: 5 },
      ];

      const { state: newState } = applyPlay(state, 0, { id: "n1" });

      expect(newState.currentPlayer).toBe("p2");
    });

    it("should reverse the direction on a reverse card", () => {
      const state = baseState();
      state.players[0].hand.cards = [
        { id: "r1", color: "red", type: "reverse", value: null },
      ];

      const { state: newState } = applyPlay(state, 0, { id: "r1" });

      expect(newState.direction).toBe(-1);
    });

    it("should draw cards for the next player on a draw_two card", () => {
      const state = baseState();
      state.players[0].hand.cards = [
        { id: "d2", color: "red", type: "draw_two", value: null },
      ];

      const { state: newState, drawnCards } = applyPlay(state, 0, {
        id: "d2",
      });

      expect(drawnCards).toHaveLength(2);
      expect(newState.players[1].hand.cards).toHaveLength(2);
    });

    it("should find the card by color/type/value when no id is provided", () => {
      const state = baseState();
      state.players[0].hand.cards = [card("red", "number", 5)];

      const { state: newState } = applyPlay(state, 0, {
        color: "red",
        type: "number",
        value: 5,
      });

      expect(newState.players[0].hand.cards).toHaveLength(0);
    });

    it("should not mutate the original state object", () => {
      const state = baseState();
      const originalHandLength = state.players[0].hand.cards.length;

      applyPlay(state, 0, { id: "c1" });

      expect(state.players[0].hand.cards).toHaveLength(originalHandLength);
    });
  });
});
