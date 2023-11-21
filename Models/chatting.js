const mongoose = require("mongoose");

const chatSchema = mongoose.Schema(
  {
    receiver: String,
    isNewMessage: Boolean,
    lastSeen: Date,
  },
  { strict: false },
);

const ChatData = mongoose.model("ChatData", chatSchema);

module.exports = ChatData;
