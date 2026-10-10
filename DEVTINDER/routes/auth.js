const express = require('express');
const bcrypt = require("bcryptjs");
const { validateSignUpData } = require("../src/utils/validation");
const { User } = require("../models/users");
const { adminAuth, userAuth } = require("../middlewares/auth");

const router = express.Router();

router.post("/signup",  userAuth, async (req, res) => {

   try {
      validateSignUpData(req);

      const {password} = req.body;

      const salt = await bcrypt.getSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      req.body.password = hashedPassword;

      // don't pass the whole req.body to the User model. as hacker may can send lot of unwanted data, that can stop your server.
      const user = new User({
         firstName,
         lastName,
         emailId,
         password
      });
      await user.save();
      res.status(200).send("User added successfully");
   } catch (error) {
      res.status(400).send("Error saving user:", error.message);
   }
})

router.post("/logout", userAuth, async (req, res)=> {
    try { 
        res.cookie("token", null, {expires: new Date(Date.now()), httpOnly: true, secure: true});

        // or

        res.clearCookie("token");
        res.status(200).send("User logged out successfully");
    } catch (error) {
        res.status(400).send("Error logging out user:", error.message);
    }
})

module.exports = router;
