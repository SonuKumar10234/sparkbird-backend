const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv').config();
const authController = require('./controller/authController');
const postController = require('./controller/postController');
const userController = require('./controller/userController');
const commentController = require('./controller/commentController');
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.use('/auth', authController);
app.use('/post', postController);
app.use('/comment', commentController);
app.use('/user', userController);


// connect database
mongoose.connect(process.env.MONGO_URL).then(() => console.log('DB Connected'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// connect server
app.listen(PORT, ()=>{
    console.log('Server is running...');
})