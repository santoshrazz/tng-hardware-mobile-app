import { ApiError } from '../middleware/errorHandler.middleware.js'
import { userModel } from '../models/user.models.js'
import sendMail from '../utils/sendMail.js'
import { comparePassword } from '../utils/index.js'
export const handleCreateUser = async (request, response, next) => {
    try {
        const { name, email, phone, password } = request.body
        if (!name || !password || !email) {
            return response.status(400).json({ message: "No required information available", success: false })
        }
        const isUserExists = await userModel.findOne({ email })
        if (isUserExists) {
            next(new ApiError("User already exists try logging into your account", 400))
        }
        const userOtp = Math.floor(100000 + Math.random() * 900000);
        // TODO ---> Send mail to user
        // const sendGmailRespons = true
        // const sendGmailRespons = await sendMail(email, { name, OTP: userOtp })
        // if (!sendGmailRespons) {
        //     return next(new ApiError("Failed to send gmail", 400))
        // }
        const createdUser = await userModel.create({
            name,
            email,
            phone,
            password,
            // userVerificationOtp: userOtp
        })
        if (!createdUser) {
            return next(new ApiError("Unable to create user", 400))
        }
        const newUser = await userModel.findById(createdUser._id).select("-password -isVerified -userVerificationOtp -noOfCouponRedeem -userVerificationOtpExpiry -role");
        response.status(201).json({ message: "User created", user: newUser, success: true })
    } catch (error) {
        console.log(error);
        next(new ApiError("Error creating user", 400))
    }
}

export const verifyUser = async (request, response, next) => {
    try {
        const { email, otp } = request.body;

        // Validate required fields
        if (!email || !otp) {
            return response.status(400).json({ message: "Email and OTP are required", success: false });
        }

        // Find the user by email
        const user = await userModel.findOne({ email });
        if (!user) {
            return next(new ApiError("User not found", 404));
        }

        // Check if the user is already verified
        if (user.isVerified) {
            return response.status(400).json({ message: "User is already verified", success: false });
        }

        if (Number(user.userVerificationOtp) !== parseInt(otp, 10)) {
            return next(new ApiError("Invalid OTP", 400));
        }

        // Check if the OTP has expired
        if (user.userVerificationOtpExpiry < Date.now()) {
            return next(new ApiError("OTP has expired. Please request a new one.", 400));
        }

        // All conditions are met, set isVerified to true and clear the OTP
        user.isVerified = true;
        user.userVerificationOtp = undefined;
        user.userVerificationOtpExpiry = undefined;

        await user.save();

        response.status(200).json({ message: "User successfully verified", success: true });
    } catch (error) {
        console.log(error);
        next(new ApiError("Error verifying user", 500));
    }
};

export const loginUser = async (request, response, next) => {
    try {
        const { email, password } = request.body;

        // Check if email and password are provided
        if (!email || !password) {
            return response.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
        }

        // Find the user by email, including the password (since it's marked as `select: false` in the schema)
        const user = await userModel.findOne({ email }).select("+password +isVerified +role");

        // Check if the user exists
        if (!user) {
            return next(new ApiError("User does not exist. Please register first.", 404));
        }

        // Check if the user's email is verified
        // if (!user.isVerified) {
        //     return next(new ApiError("Email is not verified. Please verify your account.", 401));
        // }

        // Compare the provided password with the hashed password stored in the database
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return next(new ApiError("Invalid email or password.", 401));
        }

        // Generate an authentication token
        const token = await user.generateAuthToken();

        // Exclude sensitive fields before sending the user data
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            totalWalletAmount: user.totalWalletAmount,
            noOfCouponRedeem: user.noOfCouponRedeem,
        };

        // Send the response
        response.status(200).json({
            success: true,
            message: "Logged in successfully.",
            token,
            user: userResponse,
        });
    } catch (error) {
        next(new ApiError("An error occurred during login. Please try again.", 500));
    }
};

export const getUserProfileDetail = async (request, response, next) => {
    try {
        const userId = request?.user?.id;
        if (!userId) {
            return next(new ApiError("No user id found", 401))
        }
        const user = await userModel.findById(userId).select("-noOfCouponRedeem")
        response.status(200).json({ success: true, message: "Getting user details successfully", user })
    } catch (error) {
        return next(new ApiError("Error getting user profile detail"));
    }
}

export const changePassword = async (request, response, next) => {
    try {
        const { oldPassword, newPassword } = request.body;
        if (!oldPassword || !newPassword) {
            return next(new ApiError("Old and new password required", 400))
        }
        if (oldPassword === newPassword || oldPassword == newPassword) {
            return next(new ApiError("Old and new password can't be same", 400))
        }
        const userId = request.user.id;
        const currentUser = await userModel.findById(userId).select("+password");
        if (!currentUser) {
            return next(new ApiError("No user found in db", 400))
        }
        const isMatch = await comparePassword(oldPassword, currentUser.password);
        if (!isMatch) {
            return next(new ApiError("Wrong old password", 400))
        }
        currentUser.password = newPassword;
        await currentUser.save();
        return response.status(200).json({ success: true, message: "password changed successfully" })
    } catch (error) {
        console.log("Error changing user password", error);
        return next(new ApiError("Error changing user password", 500))
    }
}

export const handleForgetPassword = async (request, response, next) => {
    try {
        const userId = request.user.id;
        const currentUser = await userModel.findById(userId).select("+password");
        if (!currentUser) {
            return next(new ApiError("No user found in db", 400))
        }
        const userOtp = Math.floor(100000 + Math.random() * 900000);
        // TODO ---> Send mail to user
        // const sendGmailRespons = true
        const sendGmailRespons = await sendMail(email, { name: currentUser.name, OTP: userOtp, message: "This is your new password . open the application and set your new password" })
        if (!sendGmailRespons) {
            return next(new ApiError("Failed to send gmail", 400))
        }
        currentUser.password = userOtp;
        await currentUser.save()

    } catch (error) {
        return next(new ApiError("Error in handler forget password", 500))
    }
}
export const allUsersList = async (req, res, next) => {
    try {
        const allUserList = await userModel.find({ role: "User" });
        return res.status(200).json({ success: true, users: allUserList, message: "User retrieved successfully" })
    } catch (error) {
        return next(new ApiError("error getting user lists"))
    }
}