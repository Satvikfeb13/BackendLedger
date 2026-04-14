const express = require("express");
const authMiddleWare= require("../middleware/auth.middleware");
const transactionController= require("../controller/transaction.controller")
const transactionRoutes=express.Router(); 

transactionRoutes.post("/",authMiddleWare.authMiddlware,transactionController.CreateTransaction)
/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/initial-funds",authMiddleWare.authSystemUserMiddleWare, transactionController.createInitialFundsTransaction)
module.exports=transactionRoutes;