import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: [true, "Player is required"],
    },
    action: {
      type: String,
      required: [true, "Action is required"],
    },
    card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("History", historySchema);
