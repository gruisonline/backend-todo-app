import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const generateAccessAndRefreshTokens = async(userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false})

    return {accessToken, refreshToken}

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token!")
  }
}

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

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password} = req.body

  if(!(username || email)) {
    throw new ApiError(400, "Username or email is required!")
  }

  if(!password) {
    throw new ApiError(400, "Password filed is required!")
  }

  const user = await User.findOne({
    $or: [{username}, {email}]
  })

  if(!user) {
    throw new ApiError(404, "User does not exist!")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials!")
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

   if(!loggedInUser) {
    throw new ApiError(500, "Something went wrong while login User, Please try again later!")
  }

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User logged in successfully!"
      )
    )
})

export {
  registerUser,
  loginUser,
}