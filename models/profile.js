var mongoose = require("mongoose");


var profileSchema = new mongoose.Schema({
    User: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account"
    },
    Avatar: String,
    Url: String,
    Facebook: String,
    Twitter: String,
    LinkedIn: String
  });

  module.exports = mongoose.model("profile", profileSchema);
