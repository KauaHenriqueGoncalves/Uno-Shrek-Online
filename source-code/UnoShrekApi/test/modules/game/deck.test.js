import {
  createDeck,
  shuffle,
  deal,
  isValidPlay,
  cardEffect,
  COLORS,
  WILD_TYPES,
  SPECIAL_TYPES,
} from "../../../src/modules/game/util/deck.js";

describe("deck", () => {
  describe("createDeck", () => {
    it("should create a deck with 108 cards", () => {
      const deck = createDeck();
      expect(deck).toHaveLength(108);
    });

    it("should create 25 cards per color (number + special)", () => {
      const deck = createDeck();
      for (const color of COLORS) {
        const cardsOfColor = deck.filter((c) => c.color === color);
        expect(cardsOfColor).toHaveLength(25);
      }
    });

    it("should create only one 0 card per color", () => {
      const deck = createDeck();
      for (const color of COLORS) {
        const zeros = deck.filter(
          (c) => c.color === color && c.type === "number" && c.value === 0,
        );
        expect(zeros).toHaveLength(1);
      }
    });

    it("should create two of each number 1-9 per color", () => {
      const deck = createDeck();
      for (const color of COLORS) {
        for (let number = 1; number <= 9; number++) {
          const cards = deck.filter(
            (c) =>
              c.color === color && c.type === "number" && c.value === number,
          );
          expect(cards).toHaveLength(2);
        }
      }
    });

    it("should create two of each special type per color", () => {
      const deck = createDeck();
      for (const color of COLORS) {
        for (const type of SPECIAL_TYPES) {
          const cards = deck.filter(
            (c) => c.color === color && c.type === type,
          );
          expect(cards).toHaveLength(2);
        }
      }
    });

    it("should create four of each wild type with color 'wild'", () => {
      const deck = createDeck();
      for (const type of WILD_TYPES) {
        const cards = deck.filter((c) => c.type === type);
        expect(cards).toHaveLength(4);
        expect(cards.every((c) => c.color === "wild")).toBe(true);
        expect(cards.every((c) => c.value === null)).toBe(true);
      }
    });
  });

  describe("shuffle", () => {
    it("should keep the same elements after shuffling", () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = shuffle([...arr]);
      expect(shuffled.sort()).toEqual(arr.sort());
    });

    it("should return the same array reference (in-place shuffle)", () => {
      const arr = [1, 2, 3];
      const result = shuffle(arr);
      expect(result).toBe(arr);
    });
  });

  describe("deal", () => {
    it("should remove and return the given number of cards from the deck", () => {
      const deck = [1, 2, 3, 4, 5];
      const hand = deal(deck, 3);

      expect(hand).toEqual([1, 2, 3]);
      expect(deck).toEqual([4, 5]);
    });

    it("should return an empty array when count is 0", () => {
      const deck = [1, 2, 3];
      const hand = deal(deck, 0);

      expect(hand).toEqual([]);
      expect(deck).toEqual([1, 2, 3]);
    });

    it("should return all remaining cards when count exceeds deck size", () => {
      const deck = [1, 2];
      const hand = deal(deck, 5);

      expect(hand).toEqual([1, 2]);
      expect(deck).toEqual([]);
    });
  });

  describe("isValidPlay", () => {
    it("should allow a wild card regardless of the top card", () => {
      const card = { color: "wild", type: "wild", value: null };
      const topCard = { color: "red", type: "number", value: 5 };

      expect(isValidPlay(card, topCard, null)).toBe(true);
    });

    it("should allow a wild_draw_four card regardless of the top card", () => {
      const card = { color: "wild", type: "wild_draw_four", value: null };
      const topCard = { color: "blue", type: "skip", value: null };

      expect(isValidPlay(card, topCard, "green")).toBe(true);
    });

    it("should allow a card matching the active color", () => {
      const card = { color: "green", type: "number", value: 3 };
      const topCard = { color: "red", type: "number", value: 7 };

      expect(isValidPlay(card, topCard, "green")).toBe(true);
    });

    it("should allow a number card matching the top card's value when there is no active color", () => {
      const card = { color: "blue", type: "number", value: 5 };
      const topCard = { color: "red", type: "number", value: 5 };

      expect(isValidPlay(card, topCard, null)).toBe(true);
    });

    it("should allow a special card matching the top card's type", () => {
      const card = { color: "blue", type: "skip", value: null };
      const topCard = { color: "red", type: "skip", value: null };

      expect(isValidPlay(card, topCard, null)).toBe(true);
    });

    it("should reject a card that matches neither color nor value/type", () => {
      const card = { color: "blue", type: "number", value: 5 };
      const topCard = { color: "red", type: "number", value: 7 };

      expect(isValidPlay(card, topCard, null)).toBe(false);
    });

    it("should reject a number card matching value but of different type than top card", () => {
      const card = { color: "blue", type: "number", value: 5 };
      const topCard = { color: "red", type: "skip", value: null };

      expect(isValidPlay(card, topCard, null)).toBe(false);
    });

    it("should use the top card's color when activeColor is not set", () => {
      const card = { color: "red", type: "number", value: 2 };
      const topCard = { color: "red", type: "number", value: 9 };

      expect(isValidPlay(card, topCard, undefined)).toBe(true);
    });
  });

  describe("cardEffect", () => {
    it("should reverse the direction for a reverse card with more than 2 players", () => {
      const result = cardEffect({ type: "reverse" }, 1, 4);

      expect(result).toEqual({ direction: -1, skipNext: false, drawCount: 0 });
    });

    it("should reverse and skip when a reverse card is played with 2 players", () => {
      const result = cardEffect({ type: "reverse" }, 1, 2);

      expect(result).toEqual({ direction: -1, skipNext: true, drawCount: 0 });
    });

    it("should skip the next player on a skip card", () => {
      const result = cardEffect({ type: "skip" }, 1, 4);

      expect(result).toEqual({ direction: 1, skipNext: true, drawCount: 0 });
    });

    it("should apply draw two and skip on a draw_two card", () => {
      const result = cardEffect({ type: "draw_two" }, 1, 3);

      expect(result).toEqual({ direction: 1, skipNext: true, drawCount: 2 });
    });

    it("should apply draw four and skip on a wild_draw_four card", () => {
      const result = cardEffect({ type: "wild_draw_four" }, -1, 3);

      expect(result).toEqual({ direction: -1, skipNext: true, drawCount: 4 });
    });

    it("should return unchanged direction and no effect for a plain number card", () => {
      const result = cardEffect({ type: "number" }, 1, 4);

      expect(result).toEqual({ direction: 1, skipNext: false, drawCount: 0 });
    });

    it("should return unchanged direction and no effect for a wild card", () => {
      const result = cardEffect({ type: "wild" }, -1, 4);

      expect(result).toEqual({ direction: -1, skipNext: false, drawCount: 0 });
    });
  });
});
