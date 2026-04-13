const express = require("express");
const authcontroller=require("../controller/auth.controller");
const router=express.Router(); 
router.post("/register",authcontroller.userRegisterController)
router.post("/login",authcontroller.userLoginController)
module.exports=router;