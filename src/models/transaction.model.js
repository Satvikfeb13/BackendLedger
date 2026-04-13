const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema({
    fromaccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "transaction must be associated with a from account"],
        index: true
    },
    toaccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "transaction must be associated with a to account"],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ["PENDING","COMPLETED","FAILED","REVERSED"],
            message:"Status can be either PENDING COMPLETED FAILED or REVERSED"
        },
        default:"PENDING"
    },
    amount:{
        type:Number,
        required:[true,"amount is required"],
        min:[0,"Transaction amount can never be negative"]
    },
    /**
     * this key will generate on a client side 
     */
    idempotencyKey:{
        type:String,
        required:[true,"Idempotency key is required for creating a transaction"],
        index:true,
        unique:true
    }
},{
    timestamps:true
}
)

const transactionModel= mongoose.model("transaction",transactionSchema);

module.exports={
    transactionModel
}