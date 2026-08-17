import mongoose from "mongoose";

export const FRIENDSHIP_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
};

const friendshipSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: [true, "Requester is required"],
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: [true, "Recipient is required"],
    },
    status: {
      type: String,
      enum: Object.values(FRIENDSHIP_STATUS),
      default: FRIENDSHIP_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  },
);

friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

export default mongoose.model("Friendship", friendshipSchema);
