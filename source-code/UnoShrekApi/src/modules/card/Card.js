import mongoose from "mongoose";

const CardSchema = new mongoose.Schema(
  {
    color: {
      type: String,
      required: [true, "Color is required"],
      enum: ["red", "green", "blue", "yellow", "wild"],
    },
    value: {
      type: String,
      required: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Card", CardSchema);
