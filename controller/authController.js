const authController = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

authController.post('/signup',  async (req, res) => {
   
    try {

        // check user already exist or not
        const isExisting = await User.findOne({email: req.body.email});
        if(isExisting){
            throw new Error("User already exists with this email");
        }

        // encrypt the password
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        // save the user in DB
        const newUser = await User.create({...req.body, password: hashedPassword});

        const { password, ...others } = newUser._doc;

        // generate token for user and send it
        const token = jwt.sign({id: newUser._id}, process.env.JWT_SECRET, {expiresIn: '5h'})

        return res.status(201).json({others, token});

    } catch (error) {
        return res.status(500).json(error.message);
    }
})

authController.post('/login', async( req, res) => {
    try {
        const user = await User.findOne({username: req.body.username});
        if(!user){
            throw new Error("Either user not found or Invalid credentials")
        }

        const comparePass = await bcrypt.compare(req.body.password, user.password)
        if(!comparePass){
            throw new Error("Invalid credentials")
        }

        const { password, ...others } = user._doc;
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '5h'})

        return res.status(200).json({others, token});
    } catch (error) {
        return res.status(500).json(error.message);
    }
})


module.exports = authController;