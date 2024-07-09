import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";       //ese { ___ } import tabhi kr skte hain jab imported file ko "default" export NAHI kiya ho
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

router.route("/register").post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    }, 
    {
        name: "coverImage",
        maxCount: 1
    }
]), registerUser)

export default router