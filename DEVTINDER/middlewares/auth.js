

const adminAuth = (req, res)=> {
   
   // here if I need to check the user is admin or not then we need to write the logic here as well as inside the other delete route as well, and this is DRY code violation. so to avoid this we can use middleware. we define a middleeare function inside a file and use it here.

   // const token = "xyz";
   // const isAdminAuthorized = token === "xyz";
   // if (isAdminAuthorized) {
   //    res.status(200).json({message: "Hello Rishav"})
   // } else {
   //    res.status(401).json({message: "Not Authorized"})
   // }
   
};

module.exports = {
    adminAuth
}