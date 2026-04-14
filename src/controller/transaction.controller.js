const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const mongoose = require("mongoose")

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check account status
     * 4. Derive sender balance from ledger
     * 5. Create transaction (PENDING)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction COMPLETED
     * 9. Commit MongoDB session
     * 10. Send email notification
 */

// Validate Request

async function CreateTransaction(req, res) {

    const { fromaccount, toaccount, amount, idempotencyKey } = req.body;

    if (!fromaccount || !toaccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "fromaccount,toaccount,amount and  idempotencyKey are required",
            status: "Failed"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromaccount
    })
    const toUserAccount = await accountModel.findOne({
        _id: toaccount
    })
    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid Account Number",
            status: "Failed"
        })
    }

    // validate idempotency key 
    // if this is true means the request came twice and we dont want user pay twice  
    const existingTransaction = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })
    if (existingTransaction) {
        if (existingTransaction.status === "COMPLETED") {
            return res.status(200), json({
                message: "Transaction already processd",
                transactionModel: existingTransaction
            })
        }
        if (existingTransaction.status === "PENDING") {
            return res.status(200), json({
                message: "Transaction is Still Processing",
            })
        }
        if (existingTransaction.status === "FAILED") {
            return res.status(500), json({
                message: "Transaction Processing failed",

            })
        }
        if (existingTransaction.status === "REVERSED") {
            return res.status(500), json({
                message: "Transaction was Reverse please try",

            })
        }

    }

    // Check the account status

    if (fromUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Sender account is not active",
            status: "Failed"
        })
    }
    if (toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Receiver account is not active",
            status: "Failed"
        })
    }

    // Derived sender balnce from ledger 

    // const ledgerEntry= await ledgerModel.findOne({
    //     _id:fromaccount
    // })
    // let balance = 0;
    // ledgerEntry.forEach(entry => {
    //     if (entry.type === "CREDIT") balance += entry.amount;
    //     if (entry.type === "DEBIT") balance -= entry.amount;
    // })

    // if(balance<amount){
    //     res.status(400).status({
    //         message:"Insufficient Balance",
    //         status:"Failed"
    //     })
    // }

    const balance = await fromUserAccount.getBalance();
    if (balance < amount) {
        res.ststus(400).json({
            message: `Insufficient balance Current balance is ${balance} Requested amount is ${amount}`,
            status: "Failed"
        })
    }

    // 
    // From to staus amount idempoenetcy key 

    // Create transaction (PENDING)
    const session = await mongoose.startSession()
    // After this one either all will execute or if any one fail then it will be  the revert back 
    session.startTransaction()
    const transaction =  await transactionModel.create({
        fromAccount,
        toaccount,
        amount ,
        idempotencyKey,
        status: "PENDING",
    },{session})

    // Debit Ledger Entry

    const debitLedgerEntry = await ledgerModel.create({
            account:fromAccount,
            amount:amount,
            transaction:transaction._id,
            type:"DEBIT"
    },{session})

        // Debit Ledger Entry

    const creditLedgerEntry = await ledgerModel.create({
            account:toaccount,
            amount:amount,
            transaction:transaction._id,
            type:"CREDIT"
    },{session})
    // Update the transaction

    transaction.status="COMPLETED"
    await  session.commitTransaction();
    session.endSession()

    // Send the email
    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })

}

module.exports={
    CreateTransaction
}