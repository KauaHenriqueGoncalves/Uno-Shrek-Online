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
    currentPlayer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: false,
    },
    maxPlayers: {
      type: Number,
      required: true,
      min: [1, "The game have at least 1 player"],
      max: [4, "Exceedid max player"],
    },
    players: {
      type: [
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
          scorePlayer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ScorePlayer",
            required: false,
          },
          hand: {
            type: {
              cards: {
                type: [
                  {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Card",
                  },
                ],
                default: [],
              },
            },
            default: () => ({ cards: [] }),
          },
          _id: false,
        },
      ],
      default: [],
    },
    deck: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Card",
        },
      ],
      default: [],
    },
    discard: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Card",
        },
      ],
      default: [],
    },
    direction: {
      type: Number,
      default: 1,
    },
    activeColor: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Game", gameSchema);
