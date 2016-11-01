var mongoose = require("mongoose");

var configSchema = new mongoose.Schema({
    User: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account"
    },
    Timezone: String
  });

  module.exports = mongoose.model("config", configSchema);
