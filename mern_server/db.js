import mongoose from "mongoose";

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/restrodb")

const db = mongoose.connection
db.on('connected', () => {
    console.log("Connected Successfully")
})

db.on('error', (err) => {
    console.log("Error in connection",err)
})

export default db;
