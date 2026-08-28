import mongoose from "mongoose";

const trackingSchema = new mongoose.Schema(
  {
    endpointAccess: {
      type: String,
      required: [true, "Endpoint access is required"],
    },
    requestMethod: {
      type: String,
      required: [true, "Request method is required"],
    },
    statusCode: {
      type: Number,
      required: [true, "Status code is required"],
    },
    responseTime: {
      type: Number,
      required: [true, "Response time is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Tracking", trackingSchema);
