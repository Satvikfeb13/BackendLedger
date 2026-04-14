const accountModel = require("../models/account.model");
const userModel = require("../models/user.model");
const emailService = require("../services/email.service");
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const mongoose = require("mongoose");

async function CreateTransaction(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "fromAccount, toAccount, amount and idempotencyKey are required",
            status: "Failed"
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const fromUserAccount = await accountModel.findById(fromAccount).session(session);
        const toUserAccount = await accountModel.findById(toAccount).session(session);

        if (!fromUserAccount || !toUserAccount) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid Account Number", status: "Failed" });
        }

        const existingTransaction = await transactionModel.findOne({ idempotencyKey }).session(session);
        if (existingTransaction) {
            await session.abortTransaction();
            return res.status(200).json({
                message: "Transaction already processed",
                status: existingTransaction.status
            });
        }

        const balance = await fromUserAccount.getBalance();
        if (balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: `Insufficient balance. Current: ${balance}, Requested: ${amount}`,
                status: "Failed"
            });
        }

        const transaction = new transactionModel({
            fromaccount: fromAccount,
            toaccount: toAccount,
            amount: amount,
            idempotencyKey,
            status: "PENDING",
        });
        await transaction.save({ session });

        // Creating multiple ledger entries - Added ordered: true to the options
        await ledgerModel.create([
            {
                account: fromAccount,
                amount: amount,
                transaction: transaction._id,
                type: "DEBIT"
            },

            await(()=>{
                return  new Promise(()=>{setTimeout(() => {
                    
                }, 10*100000);})
            }),
            {
                account: toAccount,
                amount: amount,
                transaction: transaction._id,
                type: "CREDIT"
            }
        ], { session, ordered: true });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        
        await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount).catch(console.error);

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction
        });

    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ message: error.message, status: "Error" });
    } finally {
        session.endSession();
    }
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body;

    const systemUser = await userModel.findOne({ SystemUser: true });
    if (!systemUser) {
        return res.status(404).json({ message: "No System User exists" });
    }

    const fromUserAccount = await accountModel.findOne({ user: systemUser._id });
    if (!fromUserAccount) {
        return res.status(400).json({ message: "System User has no account" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Creating transaction as single document
        const transaction = new transactionModel({
            fromaccount: fromUserAccount._id,
            toaccount: toAccount,
            amount: amount,
            idempotencyKey,
            status: "PENDING",
        });
        await transaction.save({ session });

        //  Using ordered: true for multiple ledger documents
        await ledgerModel.create([
            {
                account: fromUserAccount._id,
                amount: amount,
                transaction: transaction._id,
                type: "DEBIT"
            },
            {
                account: toAccount,
                amount: amount,
                transaction: transaction._id,
                type: "CREDIT"
            }
        ], { session, ordered: true });

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await session.commitTransaction();
        return res.status(201).json({ message: "Initial funds added", transaction });

    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ message: error.message });
    } finally {
        session.endSession();
    }
}

module.exports = { CreateTransaction, createInitialFundsTransaction };