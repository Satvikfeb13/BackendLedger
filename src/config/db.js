const mongoose= require("mongoose")
function connectDb(){
    
mongoose.connect(process.env.MONGO_URL)  
  .then(()=>{
        console.log("Server is connected to Database")
    })
    .catch(()=>{
        console.log("Error while Database Connection");
        process.exit(1)
    })
}
module.exports=connectDb