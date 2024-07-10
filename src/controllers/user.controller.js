import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"



const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
    
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating access and refresh token")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    
    // Logic:
    // get user details from frontend
    // validations - not empty
    // check if user already exists: using username and email
    // check for images, check for avatar
    // if present, then upload them to cloudinary (specially avatar as it is a required req field)
    // create user object(create entry in db)
    // remove password and refresh token fields from response
    // check for user creation(if user has been created or not)
    // return res


    // get user details from frontend
    const {fullname, email, username, password} = req.body
    console.log("email: ",email);


    // validations - not empty
    if(fullname === "") {
        throw new ApiError(400, "fullname is required")
    }
    if(email === "") {
        throw new ApiError(400, "email is required")
    }
    if(username === "") {
        throw new ApiError(400, "username is required")
    }
    if(password === "") {
        throw new ApiError(400, "password is required")
    }


    // check if user already exists: using username and email
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if(existedUser) {
        throw new ApiError(409, "User with this email or username already exist")
    }
    

    // check for images, check for avatar
    console.log(req);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    

    // if present, then upload them to cloudinary (specially avatar as it is a required req field)
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }


    // create user object(create entry in db)
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })


    // remove password and refresh token fields from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )


    // check for user creation(if user has been created or not)
    if(!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }


    // return res
    return res.status(200).json(
        new ApiResponse(200, "User registered successfully", createdUser)
    )

} )

const loginUser = asyncHandler( async (req, res) => {
    // req body -> data
    // check if username or email are sent in req body
    // find the user with the given username or email
    // match password
    // generate access and refresh token for the user
    // send these tokens through cookies and send response

    // req body -> data
    const {username, email, password} = req.body


    // check if username or email are sent in req body
    if(!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    
    // find the user with the given username or email
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if(!user) {
        throw new ApiError(404, "user do not exist")
    }


    // match password
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }


    // generate access and refresh token for the user
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


    // send these tokens through cookies and send response
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, "user logged in Successfully", {
            user: loggedInUser, accessToken, refreshToken
        })
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, "User logged out", {}))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    
    //Logic:
    // get incomingRefreshToken(refresh token that will be sent to db to verify)
    // obtain the decoded refresh token by verifying the incomingRefreshToken with the one stored in db
    // find the current user with help of decodedToken
    // check if incomingRefreshToken and the one saved in user is same or not
    // if same, then generate new access and refresh tokens
    // return response to user by saving these new tokens in cookies


    // get incomingRefreshToken(refresh token that will be sent to db to verify)
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        
        // obtain the decoded refresh token by verifying the incomingRefreshToken with the one stored in db
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    

        // find the current user with help of decodedToken
        const user = await User.findById(decodedToken._id)
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
        

        // check if incomingRefreshToken and the one saved in user is same or not
        if(user?.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
        
        
        // if same, then generate new access and refresh tokens
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
        

        // return response to user by saving these new tokens in cookies
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                "Access Token refreshed",
                {
                    accessToken, refreshToken: newRefreshToken
                }
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}

