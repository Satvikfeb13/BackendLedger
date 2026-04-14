const express = require('express');
const cookieParser = require("cookie-parser");

/**
 * Routes Required
 */
const authRouter = require("./routes/auth.routes");
const accountRouter= require("./routes/account.routes");
const transactionRouter=require("./routes/transaction.route");

const app = express();

app.use(express.json());
app.use(cookieParser());

/** `
 * Use Routes
 */
app.get("/",(req,res)=>{
    res.send("Ledger service is running")
})
app.use("/api/auth", authRouter);
app.use("/api/accounts",accountRouter);
app.use("/api/transactions",transactionRouter);


module.exports = app;