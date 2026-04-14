const { default: mongoose } = require("mongoose");
const accountModel= require("../models/account.model")
const Ledger= require("../models/ledger.model");
const ledgerModel = require("../models/ledger.model");

async function createAccountController(req,res) {
    const user= req.user;
    const account=  await accountModel.create({
        user:user._id,
    });
    res.status(201).
    json({
       account
    })
}
async function getUserAccountController(req,res) {
    const accounts= await accountModel.find({user:req.user._id});
    return res.status(200).json({
        accounts
    })
}

async function checkBalance(req, res) {
    try {
        const accountId = req.params.account;

        const account = await accountModel.findById(accountId);

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        const balance = await account.getBalance();

        return res.status(200).json({
            balance
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
}
module.exports={
    createAccountController,getUserAccountController,checkBalance
}