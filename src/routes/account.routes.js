const express = require("express");
const authMiddleWare= require("../middleware/auth.middleware");
const accountController= require("../controller/account.controller")
const router=express.Router(); 
/**
 * Post /api/account
 * create a neww account
 */
router.post("/",authMiddleWare.authMiddlware,accountController.createAccountController);

/**
 *  get api/accounts
 * get all accounts of a logged-in user
 */
router.get("/",authMiddleWare.authMiddlware,accountController.getUserAccountController);


router.get("/balance/:account",authMiddleWare.authMiddlware,accountController.checkBalance);

module.exports=router;