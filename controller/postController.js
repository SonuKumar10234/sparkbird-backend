const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const postController = require('express').Router();
const upload = require('../middlewares/multer.middleware');
const verifyToken = require('../middlewares/verifyToken');
const uploadOnCloudinary = require('../utils/cloudinary');

// create post
postController.post('/createpost', verifyToken, upload.single('media'), async (req, res) => {
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        let newPost;
        if (!req.file) {
            newPost = new Post({ content: content, user: userId });
        } else {
            // Upload image directly to Cloudinary
            let folder = 'social-media/';
            if (req.file.mimetype.split('/')[0] === 'video') {
                folder += 'videos';
            } else {
                folder += 'images';
            }

            const result = await uploadOnCloudinary(req.file.path, folder);
            newPost = new Post({ content: content, mediaURL: result.secure_url, user: userId });
        }

        const savedPost = await newPost.save();
        const populatedPost = await Post.findById(savedPost._id).populate('user', '-password');

        res.status(201).json({ message: 'Post created successfully', post: populatedPost });

    } catch (error) {
        res.status(500).json({ error: 'Something went wrong while creating post' });
    }
});

// get user post
postController.get('/userposts/:id', async (req, res) => {
    try {
        const posts = await Post.find({ user: req.params.id }) .populate("user", '-password')
        .exec();
        return res.status(200).json(posts);

    } catch (error) {
        return res.status(500).json(error.message)
    }
})


// get one post
postController.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate("user", '-password');
        if (!post) {
            return res.status(500).json({ msg: 'No such post with this id' });
        }
        return res.status(200).json(post);

    } catch (error) {
        return res.status(500).json(error.message)
    }
})


// get all posts
postController.get('/get/allPosts', verifyToken, async (req, res) => {

    try {
        const currentUser = await User.findById(req.user.id);
        
        // Fetch current user's posts
        const currentUserPosts = await Post.find({ user: currentUser._id })
            .populate("user", '-password')
            .exec();

        // Fetch posts from friends
        const friendsPosts = await Post.find({ user: { $in: currentUser.followings } })
            .populate("user", '-password')
            .exec();

        // Combine the posts and sort by creation date
        let timelinePosts = [...currentUserPosts, ...friendsPosts];
        timelinePosts = timelinePosts.sort((a, b) => b.createdAt - a.createdAt);

        // Limit to 40 posts
        if (timelinePosts.length > 40) {
            timelinePosts = timelinePosts.slice(0, 40);
        }

        return res.status(200).json(timelinePosts);
    } catch (error) {
        return res.status(500).json(error.message);
    }
});


// update post
postController.put('/:id', verifyToken, upload.single('media'), async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (post.user.toString() === req.user.id.toString()) { // jisne post create kiya aur edit karne wale ki id
            let updatedPostData = req.body;
            if (req.file) { // user changed the media
                let folder = 'social-media/';
                if (req.file.mimetype.split('/')[0] === 'video') {
                    folder += 'videos';
                } else {
                    folder += 'images';
                }

                const result = await uploadOnCloudinary(req.file.path, folder);
                updatedPostData.mediaURL = result.secure_url;
            }
            
            // user ne media change kiya hai to phle upload karo cloudinary pe and then url save karo

            const updatedPost = await Post.findByIdAndUpdate(req.params.id, { $set: updatedPostData }, { new: true }).populate("user", '-password');
            return res.status(200).json(updatedPost);
        }
        return res.status(403).json({ error: 'You can only edit your own posts' });

    } catch (error) {
        return res.status(500).json({ error: 'Something went wrong while editing post' });
    }
})

// delete post
postController.delete('/:id', verifyToken, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate("user", '-password');
        if (!post) {
            return res.status(500).json({ msg: 'No such post with this id' });
        }
        else if (post.user._id.toString() !== req.user.id.toString()) {
            return res.status(403).json({ msg: 'You can delete only your own post' });
        }
        else {
            await Post.findByIdAndDelete(req.params.id);
            return res.status(200).json({ msg: 'Post deleted successfully' });
        }

    } catch (error) {
        return res.status(500).json(error.message)
    }
})


postController.put('/toggleLike/:id', verifyToken, async (req, res) => {
   
    try {
        const currentUserId = req.user.id;
        const post = await Post.findById(req.params.id);

        // Toggle like/unlike
        if (post.likes.includes(currentUserId)) {
            post.likes = post.likes.filter(id => id.toString() !== currentUserId);
        } else {
            post.likes.push(currentUserId);
        }

        await post.save();

        // Fetch all posts liked by the current user
        const updatedPost = await Post.findById(req.params.id).populate('user', '-password');

        return res.status(200).json({
            msg: post.likes.includes(currentUserId) ? 'Successfully liked the post' : 'Successfully unliked the post',
            post: updatedPost,
            
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

module.exports = postController;