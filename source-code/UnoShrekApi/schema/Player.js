import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  email: { type: String, required: true, unique: true }
  },
  { 
    timestamps: true // Automatiza createdAt e updatedAt
  }
);

export default mongoose.model("Player", playerSchema);
