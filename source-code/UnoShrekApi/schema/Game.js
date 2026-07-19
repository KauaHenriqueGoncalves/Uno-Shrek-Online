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
      required: [true, "O título é obrigatório"]
    },
    status: { 
      type: String, 
      required: true,
      enum: Object.values(GAME_STATUS), // Restringe valores aceitos
      default: GAME_STATUS.PENDING 
    },
    maxPlayers: { 
      type: Number, 
      required: true, 
      min: [1, "O jogo deve ter pelo menos 1 jogador"],
      max: [4, "Limite de jogadores excedido"]
    },
  },
  { 
    timestamps: true // Automatiza createdAt e updatedAt
  }
);

export default mongoose.model("Game", gameSchema);