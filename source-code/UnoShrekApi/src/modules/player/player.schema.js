import mongoose from "mongoose";

export const AVATAR_KEYS = ["shrek", "fiona", "donkey", "puss"];

export function assignDefaultAvatar(picture) {
  if (picture) {
    return { picture, avatarKey: null };
  }
  const avatarKey = AVATAR_KEYS[Math.floor(Math.random() * AVATAR_KEYS.length)];
  return { picture: null, avatarKey };
}

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
    avatarKey: {
      type: String,
      required: false,
      enum: [...AVATAR_KEYS, null],
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Player", playerSchema);
