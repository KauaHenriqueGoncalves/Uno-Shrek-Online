import mongoose from "mongoose";

const scorePlayerSchema = new mongoose.Schema(
  {
    playerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: [true, "id of player is required"],
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: [false, "id of game is required"], // TODO: trocar pra true quando tiver a entidade game na main
    },
    score: {
      type: Number,
      required: [true, "score is required"],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("ScorePlayer", scorePlayerSchema);
