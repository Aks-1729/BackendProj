import dotenv from 'dotenv'
import connectDB from './db/index.js'
import {app} from './app.js'

dotenv.config({
    path: './.env'
})
connectDB()
.then( () => {

    app.on("Errror", (error) => {
        console.log("ERR: ", error);
        throw error
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is listening on port: ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MongoDB connection failed: ", err);
})


/*
import mongoose from 'mongoose'
import { DB_NAME } from './constants.js';
import express from 'express'
const app = express()
;( async() => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error) => {
            console.log("ERR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    }
    catch(error){
        console.error("Error: ", error)
        throw error
    }
})()

*/