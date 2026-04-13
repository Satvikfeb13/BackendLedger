const express = require("express");
const authMiddleWare= require("../middleware/auth.middleware");
const accountController= require("../controller/account.controller")
const router=express.Router(); 
router.post("/",authMiddleWare.authMiddlware,accountController.createAccountController);


module.exports=router;