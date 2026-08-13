import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: [true, "Username is unique"],
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: [true, "Email is unique"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    picture: {
      type: String,
      required: false,
      default: null,
    },
    googleId: {
      type: String,
      required: false,
      default: null,
},
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Player", playerSchema);
