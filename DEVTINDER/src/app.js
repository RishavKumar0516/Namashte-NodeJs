const express = require('express');
const {adminAuth} = require("../middlewares/auth");

const app = express();

// as we have used use and written at the top, so this will get called for all the routes that starts with /admin

// handle Auth Middleware for only GET, POST, DELETE methods
app.use('/admin', (req, res, next) => {
   const token = "xyz";
   console.log("Auth check")
   const isAdminAuthorized = token === "xyz";
   if (isAdminAuthorized) {
      next();
   } else {
      res.status(401).json({message: "Not Authorized"})
   }
})


// app.get("/admin/getAllData", (req, res)=> {
//    // here if I need to check the user is admin or not then we need to write the logic here as well as inside the other delete route as well, and this is DRY code violation. so to avoid this we can use middleware. we define a middleeare function inside a file and use it here.

//    // const token = "xyz";
//    // const isAdminAuthorized = token === "xyz";
//    // if (isAdminAuthorized) {
//    //    res.status(200).json({message: "Hello Rishav"})
//    // } else {
//    //    res.status(401).json({message: "Not Authorized"})
//    // }
// })

app.get("/admin/getAllData", adminAuth, (req, res)=> {
   return res.send("Hello Rishav from getAllData")
})

app.delete('/admin/deleteData', adminAuth, (req, res)=> {
   return res.send("Hello Rishav from deleteData")
})




app.listen('4000', () => {
    console.log(`Server is running on port 4000`);
})
