import mongoose from "mongoose";

const scorePlayerSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: [true, "Id of player is required"],
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: [true, "Id of game is required"],
    },
    score: {
      type: Number,
      required: [true, "Score is required"],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("ScorePlayer", scorePlayerSchema);
