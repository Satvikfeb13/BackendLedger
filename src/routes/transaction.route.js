const express = require("express");
const authMiddleWare= require("../middleware/auth.middleware");
const transactionController= require("../controller/transaction.controller")
const transactionRoutes=express.Router(); 

transactionRoutes.post("/",authMiddleWare.authMiddlware,transactionController.CreateTransaction)

module.exports=router;