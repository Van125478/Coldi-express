import { Schema, model } from "mongoose";

const messageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, required: true, enum: ["SHIPPER", "CARRIER"] },
    body: { type: String, required: true, maxlength: 2000 },
    sequence: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

messageSchema.index({ conversationId: 1, sequence: 1 }, { unique: true });

export const Message = model("Message", messageSchema);
