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
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: [true, "Id of owner is required"],
    },
    maxPlayers: {
      type: Number,
      required: true,
      min: [1, "The game have at least 1 player"],
      max: [4, "Exceedid max player"],
    },
    players: {
      type: [
        // ATENÇAO, CASO ALTERE A LISTA DE PLAYERS, ATUALIZE O PlayerService.create no saveData!!!!
        {
          player: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Player",
            required: true,
          },
          ready: {
            type: Boolean,
            default: false,
          },
          score: {
            type: Number,
            default: 0,
          },
          _id: false,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Game", gameSchema);
