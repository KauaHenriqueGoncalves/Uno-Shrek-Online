import blue0 from "../../../assets/cards/blue/blue-number-0.png";
import blue1 from "../../../assets/cards/blue/blue-number-1.png";
import blue2 from "../../../assets/cards/blue/blue-number-2.png";
import blue3 from "../../../assets/cards/blue/blue-number-3.png";
import blue4 from "../../../assets/cards/blue/blue-number-4.png";
import blue5 from "../../../assets/cards/blue/blue-number-5.png";
import blue6 from "../../../assets/cards/blue/blue-number-6.png";
import blue7 from "../../../assets/cards/blue/blue-number-7.png";
import blue8 from "../../../assets/cards/blue/blue-number-8.png";
import blue9 from "../../../assets/cards/blue/blue-number-9.png";

import blueBlock from "../../../assets/cards/blue/blue-block.png";
import blueReverse from "../../../assets/cards/blue/blue-reverse.png";
import blueDrawTwo from "../../../assets/cards/blue/blue-more-two.png";

import green0 from "../../../assets/cards/green/green-number-0.png";
import green1 from "../../../assets/cards/green/green-number-1.png";
import green2 from "../../../assets/cards/green/green-number-2.png";
import green3 from "../../../assets/cards/green/green-number-3.png";
import green4 from "../../../assets/cards/green/green-number-4.png";
import green5 from "../../../assets/cards/green/green-number-5.png";
import green6 from "../../../assets/cards/green/green-number-6.png";
import green7 from "../../../assets/cards/green/green-number-7.png";
import green8 from "../../../assets/cards/green/green-number-8.png";
import green9 from "../../../assets/cards/green/green-number-9.png";

import greenBlock from "../../../assets/cards/green/green-block.png";
import greenReverse from "../../../assets/cards/green/green-reverse.png";
import greenDrawTwo from "../../../assets/cards/green/green-more-two.png";

import red0 from "../../../assets/cards/red/red-number-0.png";
import red1 from "../../../assets/cards/red/red-number-1.png";
import red2 from "../../../assets/cards/red/red-number-2.png";
import red3 from "../../../assets/cards/red/red-number-3.png";
import red4 from "../../../assets/cards/red/red-number-4.png";
import red5 from "../../../assets/cards/red/red-number-5.png";
import red6 from "../../../assets/cards/red/red-number-6.png";
import red7 from "../../../assets/cards/red/red-number-7.png";
import red8 from "../../../assets/cards/red/red-number-8.png";
import red9 from "../../../assets/cards/red/red-number-9.png";

import redBlock from "../../../assets/cards/red/red-block.png";
import redReverse from "../../../assets/cards/red/red-reverse.png";
import redDrawTwo from "../../../assets/cards/red/red-more-two.png";

import yellow0 from "../../../assets/cards/yellow/yellow-number-0.png";
import yellow1 from "../../../assets/cards/yellow/yellow-number-1.png";
import yellow2 from "../../../assets/cards/yellow/yellow-number-2.png";
import yellow3 from "../../../assets/cards/yellow/yellow-number-3.png";
import yellow4 from "../../../assets/cards/yellow/yellow-number-4.png";
import yellow5 from "../../../assets/cards/yellow/yellow-number-5.png";
import yellow6 from "../../../assets/cards/yellow/yellow-number-6.png";
import yellow7 from "../../../assets/cards/yellow/yellow-number-7.png";
import yellow8 from "../../../assets/cards/yellow/yellow-number-8.png";
import yellow9 from "../../../assets/cards/yellow/yellow-number-9.png";

import yellowBlock from "../../../assets/cards/yellow/yellow-block.png";
import yellowReverse from "../../../assets/cards/yellow/yellow-reverse.png";
import yellowDrawTwo from "../../../assets/cards/yellow/yellow-more-two.png";

import urroBack from "../../../assets/cards/specials/urro-back.png";
import wildColor from "../../../assets/cards/specials/wild-special-color.png";
import wildDraw4 from "../../../assets/cards/specials/wild-special-draw4.png";

import type { GameCard } from "./useGameSocket";


export const cardAssets = {
  blue: {
    number: {
      0: blue0,
      1: blue1,
      2: blue2,
      3: blue3,
      4: blue4,
      5: blue5,
      6: blue6,
      7: blue7,
      8: blue8,
      9: blue9,
    },

    block: blueBlock,
    reverse: blueReverse,
    drawTwo: blueDrawTwo,
  },

  green: {
    number: {
      0: green0,
      1: green1,
      2: green2,
      3: green3,
      4: green4,
      5: green5,
      6: green6,
      7: green7,
      8: green8,
      9: green9,
    },

    block: greenBlock,
    reverse: greenReverse,
    drawTwo: greenDrawTwo,
  },

  red: {
    number: {
      0: red0,
      1: red1,
      2: red2,
      3: red3,
      4: red4,
      5: red5,
      6: red6,
      7: red7,
      8: red8,
      9: red9,
    },

    block: redBlock,
    reverse: redReverse,
    drawTwo: redDrawTwo,
  },

  yellow: {
    number: {
      0: yellow0,
      1: yellow1,
      2: yellow2,
      3: yellow3,
      4: yellow4,
      5: yellow5,
      6: yellow6,
      7: yellow7,
      8: yellow8,
      9: yellow9,
    },

    block: yellowBlock,
    reverse: yellowReverse,
    drawTwo: yellowDrawTwo,
  },

  specials: {
    back: urroBack,
    wild: wildColor,
    draw4: wildDraw4,
  },
};

export type NormalCardColor =
  | "blue"
  | "green"
  | "red"
  | "yellow";

export function isNormalColor(
  color: string,
): color is NormalCardColor {
  return ["blue", "green", "red", "yellow"].includes(color);
}


export function getCardImage(card: GameCard) {
  if (card.type === "wild") {
    return cardAssets.specials.wild;
  }

  if (card.type === "wild_draw_four") {
    return cardAssets.specials.draw4;
  }

  if (!isNormalColor(card.color)) {
    return cardAssets.specials.back;
  }

  if (card.type === "number") {
    return cardAssets[card.color].number[
      Number(card.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
    ];
  }

  if (card.type === "skip") {
    return cardAssets[card.color].block;
  }

  if (card.type === "reverse") {
    return cardAssets[card.color].reverse;
  }

  if (card.type === "draw_two") {
    return cardAssets[card.color].drawTwo;
  }

  return cardAssets.specials.back;
}