import mongoose from "mongoose";

export const CARD_TYPES = [
  "number",
  "skip",
  "reverse",
  "draw_two",
  "wild",
  "wild_draw_four",
];

const CardSchema = new mongoose.Schema(
  {
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: CARD_TYPES,
      default: "number",
    },
    color: {
      type: String,
      required: [true, "Color is required"],
      enum: ["red", "green", "blue", "yellow", "wild"],
    },
    value: {
      type: String,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Card", CardSchema);
