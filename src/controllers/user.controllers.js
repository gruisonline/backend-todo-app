import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const registerUser = asyncHandler(async (req, res) => {
  const { username, fullname, email, password } = req.body

  if(
    [fullname, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required!")
  }

  const existingUser = await User.findOne({
    $or: [{username}, {email}]
  })

  if(existingUser) {
    throw new ApiError(409, "User with email or username already exists!")
  }

  const avatarLocalFilePath = req.file?.path;

  if(!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar file is required!")
  }

  const avatar = await uploadOnCloudinary(avatarLocalFilePath);

  if(!avatar) {
    throw new ApiError(400, "Error occured while uploading avatar, Please try again!")
  }

  const user = await User.create({
    fullname,
    username: username.toLowerCase(),
    avatar: avatar.secure_url,
    publicId: avatar?.public_id,
    email,
    password
  })

  const createdUser = await User.findById(user._id)
    .select(" -password -refreshToken")

  if(!createdUser) {
    throw new ApiError(500, "Something went wrong while registering User, Please try again later!")
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registerd successfully!")
  )
})

export {
  registerUser,
}