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

// app.get("/admin/getAllData", adminAuth, (req, res)=> {
//    return res.send("Hello Rishav from getAllData")
// })

// app.delete('/admin/deleteData', adminAuth, (req, res)=> {
//    return res.send("Hello Rishav from deleteData")
// })



// Error handling
// use try catch block to handle errors

// but if there are some error that are not handled then ho you can handle that errors

// order of this argument always matters : err, req, res, next
// if using only 3 argument then order will be: req, res, next

// this only works when its written at the bottom, and it not used the try/catch in the handlers. as code run top to bottom. if you write this at top then, when it runs at first there is no any error.

app.get("/admin/getAllData", adminAuth, (req, res)=> {
   throw new Error("from getAll Data")
   // return res.send("Hello Rishav from getAllData")
})

app.use("/", (err, req, res, next)=> {
    if (err) {
       res.status(500).json({message: "Something went wrong"})
    }
})









app.listen('4000', () => {
    console.log(`Server is running on port 4000`);
})
