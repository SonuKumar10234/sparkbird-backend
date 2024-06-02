const mongoose = require('mongoose');


const PostSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    content: { type: String, required: true },
    mediaURL: { type: String, default: '' },
    likes:  { type: [String], default: [] }

}, {timestamps: true});

module.exports = mongoose.model("Post", PostSchema);