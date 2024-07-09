import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    const {username, email, fullname, password} = req.body
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
    const user = User.create({
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
        throw new ApiError(500, "something went wrong while registering the user")
    }


    // return res
    return res.status(200).json(
        new ApiResponse(200, "User registered successfully", createdUser)
    )

} )

export {registerUser}

