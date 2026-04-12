require("dotenv").config()
const app=require("./src/app")
const connectDb=require("./src/config/db");
const port=3000;
connectDb();
app.listen(port,()=>{
    console.log("server successfully connected on "+port);
    
});