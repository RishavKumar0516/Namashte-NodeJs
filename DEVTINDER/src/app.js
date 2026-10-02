require("dotenv").config();
const express = require('express');
const connectDB = require("../configs/database");
const { adminAuth } = require("../middlewares/auth");
const User = require("../models/users");
const app = express();

app.use(express.json());

app.post("/signup", async (req,res)=>{
    const user = new User({
        firstName: "Rishav", 
        lastName: "Kumar",
        age: 21,
        emailId: "merishavkumar@gmail.com",
        password:"Rishav@123"
    });

   try {
       await user.save();
       res.status(200).send("User added successfully");
   } catch (error) {
      res.status(400).send("Error saving user:", error.message);
   }
})

// get User by email 
app.get("/user", async (req, res)=> {
   const userEmail = req.body.emailId;

   try {
      const user = await User.findOne({emailId: userEmail});

      if (!user) {
         res.status(404).send("User not found");
         return;
      }
      res.status(200).send(user);
   } catch(error) {
      res.status(400).send("Error finding user:", error.message);
   }
})

// feed api
app.get("/users", async (req, res)=> {
   try {
       const users = User.find({});

       if (users.length == 0) {
          return res.status(400).send("No users found");
       } 

       return res.status(200).send(users);

   } catch(error) {
      return res.status(400).send("Error finding users:", error.message);
   }
})

// delete user api
app.delete("/users/:id", async (req, res) => {
   const userId = req.params.id;

   try {
      const user = await User.deleteOne({_id: userId})
   } catch (error) {
      res.status(400).send("Error deleting user:", error.message);
   }
})

// update the data of user
app.patch("/user", async (req, res)=> {
   try {
      const userId = req.body.userId;
      const data = req.body;
      try {
         const user = await User.findOneAndUpdate({_id: userId}, data, {new: true});
         return res.status(200).send("User updated successfully");
      } catch(error) {
         return res.status(400).send("Error updating user:", error.message);
      }
   } catch (error) {
      return res.status(400).send("Error updating user:", error.message);
   }
})

connectDB().then(()=> {
   console.log("Database connected successfully");

   app.listen(4000, ()=> {
      console.log("Server is running on port 4000");
   })
}).catch((error)=> {
   console.log("Error while connecting to the database:", error);
});
