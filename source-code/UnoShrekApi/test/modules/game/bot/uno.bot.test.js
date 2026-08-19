import UnoBot from "../../../../src/modules/game/bot/uno.bot.js";
import { isValidPlay } from "../../../../src/modules/game/util/deck.js";

jest.mock("../../../../src/modules/game/util/deck.js", () => ({
  isValidPlay: jest.fn(),
}));

describe("UnoBot", () => {
  let bot;

  const card = (over = {}) => ({
    id: "c1",
    type: "number",
    color: "red",
    value: 5,
    ...over,
  });

  const makeState = (players, over = {}) => ({
    players,
    discard: [card({ id: "top" })],
    activeColor: "red",
    direction: 1,
    ...over,
  });

  beforeEach(() => {
    bot = new UnoBot();
    jest.clearAllMocks();
  });

  describe("choosePlay", () => {
    it("returns null when player has no hand", () => {
      const state = makeState([{ hand: { cards: [] } }]);
      expect(bot.choosePlay(state, 0)).toBeNull();
    });

    it("returns null when no cards are playable (bot must draw)", () => {
      isValidPlay.mockReturnValue(false);
      const state = makeState([
        { hand: { cards: [card()] } },
        { hand: { cards: [card()] } },
      ]);
      expect(bot.choosePlay(state, 0)).toBeNull();
    });

    it("prioritizes a special card when the next player has <= 2 cards left", () => {
      isValidPlay.mockReturnValue(true);
      const skipCard = card({ id: "s1", type: "skip" });
      const numCard = card({ id: "n1" });
      const state = makeState([
        { hand: { cards: [numCard, skipCard] } },
        { hand: { cards: [card(), card()] } }, // 2 cartas -> gatilho
      ]);

      const decision = bot.choosePlay(state, 0);
      expect(decision.card.type).toBe("skip");
    });

    it("avoids playing a wild card when a non-wild playable card exists", () => {
      isValidPlay.mockReturnValue(true);
      const wildCard = card({ id: "w1", type: "wild" });
      const numCard = card({ id: "n1", type: "number" });
      const state = makeState([
        { hand: { cards: [wildCard, numCard] } },
        { hand: { cards: [card(), card(), card()] } }, // 3 cartas, sem gatilho especial
      ]);

      const decision = bot.choosePlay(state, 0);
      expect(decision.card.type).toBe("number");
    });

    it("plays a wild card only when it's the only playable option", () => {
      isValidPlay.mockReturnValue(true);
      const wildCard = card({ id: "w1", type: "wild" });
      const state = makeState([
        { hand: { cards: [wildCard] } },
        { hand: { cards: [card(), card(), card()] } },
      ]);

      const decision = bot.choosePlay(state, 0);
      expect(decision.card.type).toBe("wild");
      expect(decision.colorChoice).not.toBeNull();
    });
  });

  describe("chooseSpecialCard", () => {
    it("prioritizes draw_two over skip over reverse", () => {
      const cards = [
        card({ type: "reverse" }),
        card({ type: "skip" }),
        card({ type: "draw_two" }),
      ];
      expect(bot.chooseSpecialCard(cards).type).toBe("draw_two");
    });

    it("returns skip when draw_two is not available", () => {
      const cards = [card({ type: "reverse" }), card({ type: "skip" })];
      expect(bot.chooseSpecialCard(cards).type).toBe("skip");
    });

    it("returns null when no special cards are present", () => {
      expect(bot.chooseSpecialCard([card({ type: "number" })])).toBeNull();
    });
  });

  describe("chooseNormalCard", () => {
    it("prefers the color that appears most frequently in hand", () => {
      const cards = [
        card({ id: "1", color: "red" }),
        card({ id: "2", color: "red" }),
        card({ id: "3", color: "blue" }),
      ];
      expect(bot.chooseNormalCard(cards).color).toBe("red");
    });
  });

  describe("chooseWildCard", () => {
    it("prefers 'wild' over 'wild_draw_four'", () => {
      const cards = [card({ type: "wild_draw_four" }), card({ type: "wild" })];
      expect(bot.chooseWildCard(cards).type).toBe("wild");
    });

    it("returns the first card when 'wild' is not available", () => {
      const cards = [card({ type: "wild_draw_four", id: "x" })];
      expect(bot.chooseWildCard(cards).id).toBe("x");
    });
  });

  describe("createDecision", () => {
    it("sets colorChoice only when the played card is a wild", () => {
      const hand = [card({ id: "a" }), card({ id: "b", type: "wild" })];
      const decision = bot.createDecision(hand[0], hand);
      expect(decision.colorChoice).toBeNull();
    });

    it("sets callUno to true when only one card remains after playing", () => {
      const hand = [card({ id: "a" }), card({ id: "b" })];
      const decision = bot.createDecision(hand[0], hand);
      expect(decision.callUno).toBe(true);
    });
  });

  describe("chooseBestColor", () => {
    it("returns the color with the highest count in hand", () => {
      const hand = [
        card({ color: "blue" }),
        card({ color: "blue" }),
        card({ color: "green" }),
      ];
      expect(bot.chooseBestColor(hand)).toBe("blue");
    });
  });

  describe("getNextPlayerIndex", () => {
    it("advances normally when direction is 1", () => {
      const state = { players: [1, 2, 3], direction: 1 };
      expect(bot.getNextPlayerIndex(state, 0)).toBe(1);
    });

    it("wraps around correctly when direction is -1", () => {
      const state = { players: [1, 2, 3], direction: -1 };
      expect(bot.getNextPlayerIndex(state, 0)).toBe(2);
    });
  });

  describe("shouldCallUno", () => {
    it("returns true when hand has exactly one card", () => {
      expect(bot.shouldCallUno([card()])).toBe(true);
    });

    it("returns false when hand has more than one card", () => {
      expect(bot.shouldCallUno([card(), card()])).toBe(false);
    });
  });
});
