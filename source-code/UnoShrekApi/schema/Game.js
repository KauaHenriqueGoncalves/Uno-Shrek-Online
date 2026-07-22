import mongoose from "mongoose";

export const GAME_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  FINISHED: "finished",
};

const gameSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(GAME_STATUS),
      default: GAME_STATUS.PENDING,
    },
    maxPlayers: {
      type: Number,
      required: true,
      min: [1, "The game have at least 1 player"],
      max: [4, "Exceedid max player"],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Game", gameSchema);
