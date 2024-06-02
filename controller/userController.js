const userController = require('express').Router();
const User = require('../models/User');
const Post = require('../models/Post');
const upload = require('../middlewares/multer.middleware');
const uploadOnCloudinary = require('../utils/cloudinary');
const verifyToken = require('../middlewares/verifyToken');

// get one
userController.get('/:userId', verifyToken, async(req, res) => {
    try {
     const user = await User.findById(req.params.userId);
    
     if(!user){
         return res.status(500).json({msg: "No such user, wrong id!"})
     }
 
     const {password, ...others} = user._doc;
 
     return res.status(200).json(others)
    } catch (error) {
     return res.status(500).json(error.message)
    }
 })


// get user bookmarked post
userController.get( '/get/userBookmarksPost' , verifyToken,  async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'bookmarks',
            populate: {
                path: 'user',
                select: '-password'
            }
        });

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.status(200).json(user.bookmarks);
    } catch (error) {
        res.status(500).json(error.message);
    }
});



 // get all users
userController.get('/get/AllUser', async (req, res) => {
    try {
        const users = await User.find({});
        return res.status(200).json(users);

    } catch (error) {
        return res.status(500).json(error.message)
    }
})



// get suggested users
// userController.get('/suggestedUsers', verifyToken, async (req, res) => {
//     try {
//         const currentUser = await User.findById(req.user.id);
//         const users = await User.find({}).select('-password');
//         let suggestedUser = users.filter((user) => {
//             return (!currentUser.followings.includes(user._id) && user._id.toString() !== currentUser._id.toString())
//         })

//         if (suggestedUser.length > 5) {
//             suggestedUser = suggestedUser.slice(0, 5);
//         }

//         return res.status(200).json(suggestedUser);

//     } catch (error) {
//         return res.status(500).json(error.message)
//     }
// })



// update user
userController.put('/update/:userId', verifyToken, upload.single('media'), async (req, res) => {
    
    if (req.params.userId === req.user.id) {
        try {
            const { bio, website, avatarUrl } = req.body;

            let updatedFields = { bio, website };

            if (req.file) {
                const result = await uploadOnCloudinary(req.file.path, 'social-media/images');
                updatedFields.profileAvatar = result.secure_url; // Update avatarUrl with the new image URL
            } else if (avatarUrl) {
                updatedFields.profileAvatar = avatarUrl; // Use the existing avatar URL
            }

            const updatedUser = await User.findByIdAndUpdate(req.params.userId, { $set: updatedFields }, { new: true });
            return res.status(200).json(updatedUser);
        } catch (error) {
            return res.status(500).json(error.message);
        }
    } else {
        return res.status(403).json({ msg: "You can change only your own profile!" });
    }
});




// delete user
// userController.delete('/deleteUser/:userId', verifyToken, async (req, res) => {

//     if (req.params.userId === req.user.id) {
//         try {
//             await User.findByIdAndDelete(req.user.id, {$set: req.body}, {new: true});
            
//             return res.status(200).json({msg: "Successfully deleted user"});

//         } catch (error) {
//             return res.status(500).json(error.message)
//         }
//     }
//     else {
//         return res.status(403).json({msg: "You can delete only your own profile!"});
//     }
// })



// follow/unfollow
userController.put('/toggleFollow/:otherUserId', verifyToken, async(req, res) => {
    try {
        const currentUserId = req.user.id
        const otherUserId = req.params.otherUserId

        if(currentUserId === otherUserId){
            throw new Error("You can't follow yourself")
        }

        const currentUser = await User.findById(currentUserId)
        const otherUser = await User.findById(otherUserId)

        
        if(!currentUser.followings.includes(otherUserId)){
            currentUser.followings.push(otherUserId)
            otherUser.followers.push(currentUserId)
            
            await User.findByIdAndUpdate(currentUserId, {$set: currentUser}, {new: true})
            await User.findByIdAndUpdate(otherUserId, {$set: otherUser}, {new: true})

            return res.status(200).json({msg: "You have successfully followed the user!"})
        } else {
            currentUser.followings = currentUser.followings.filter((id) => id !== otherUserId)
            otherUser.followers = otherUser.followers.filter((id) => id !== currentUserId)


            await User.findByIdAndUpdate(currentUserId, {$set: currentUser}, {new: true})
            await User.findByIdAndUpdate(otherUserId, {$set: otherUser}, {new: true})

            return res.status(200).json({msg: 'You have successfully unfollowed the user!'})
        }
    } catch (error) {
        return res.status(500).json(error.message) 
    }
})



userController.put('/bookmarkPost/:postId', verifyToken, async (req, res) => {
    try {
      const post = await Post.findById(req.params.postId).populate('user', '-password');
      if (!post) {
        return res.status(404).json({ msg: 'No such post' });
      } else {
        const user = await User.findById(req.user.id).populate({
            path: 'bookmarks',
            populate: {
                path: 'user',
                select: '-password'
            }
        });
        const isBookmarked = user.bookmarks.some(bookmarkedPost => String(bookmarkedPost._id) === req.params.postId);
  
        if (isBookmarked) {
          await User.findByIdAndUpdate(req.user.id, { $pull: { bookmarks: post._id } });
          const updatedUser = await User.findById(req.user.id).populate({
            path: 'bookmarks',
            populate: {
                path: 'user',
                select: '-password'
            }
        });

          return res.status(200).json({ msg: 'Successfully unbookmarked the post', bookmarks: updatedUser.bookmarks });
        } else {
          await User.findByIdAndUpdate(req.user.id, { $addToSet: { bookmarks: post._id } });
          const updatedUser = await User.findById(req.user.id).populate({
            path: 'bookmarks',
            populate: {
                path: 'user',
                select: '-password'
            }
        });
          return res.status(200).json({ msg: 'Successfully bookmarked the post', bookmarks: updatedUser.bookmarks  });
        }
      }
    } catch (error) {
      return res.status(500).json({ msg: error.message });
    }
  });

module.exports = userController;