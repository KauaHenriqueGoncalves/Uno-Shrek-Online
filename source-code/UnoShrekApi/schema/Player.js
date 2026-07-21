import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Username is unique"],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Player", playerSchema);
