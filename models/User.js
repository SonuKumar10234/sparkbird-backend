const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: true, unique: true},
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true, min: 6},
    profileAvatar: { type: String, default: ""},
    bio: { type: String, default: ""},
    website: { type: String, default: ""},
    followings: { type: [String], default: []},
    followers: { type: [String], default: []},
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],

}, {timestamps: true});

module.exports = mongoose.model("User", UserSchema);