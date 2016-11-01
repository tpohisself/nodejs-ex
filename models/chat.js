var mongoose = require("mongoose");

var chatSchema = new mongoose.Schema({
  User: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account"
  },
  Verbiage: String,
  Timestamp: String,
  Url: String,
  Deleted:{
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("chat", chatSchema);
