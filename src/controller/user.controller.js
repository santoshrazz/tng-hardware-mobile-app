import { ApiError } from '../middleware/errorHandler.middleware.js'
import { userModel } from '../models/user.models.js'
import sendMail from '../utils/sendMail.js'
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
        const sendGmailRespons = await sendMail(email, { name, OTP: userOtp })
        if (!sendGmailRespons) {
            return next(new ApiError("Failed to send gmail", 400))
        }
        const createdUser = await userModel.create({
            name,
            email,
            phone,
            password,
            userVerificationOtp: userOtp
        })
        if (!createdUser) {
            return next(new ApiError("Unable to create user", 400))
        }
        const newUser = await userModel.findById(createdUser._id).select("-password -isVerified -userVerificationOtp -noOfCouponRedeem -userVerificationOtpExpiry -role");
        response.status(201).json({ message: "User created", user: newUser })
    } catch (error) {
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

        // Check if the provided OTP matches the stored OTP
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
        const user = await userModel.findOne({ email }).select("+password +isVerified");

        // Check if the user exists
        if (!user) {
            return next(new ApiError("User does not exist. Please register first.", 404));
        }

        // Check if the user's email is verified
        if (!user.isVerified) {
            return next(new ApiError("Email is not verified. Please verify your account.", 401));
        }

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
        console.error("Error during user login:", error);
        next(new ApiError("An error occurred during login. Please try again.", 500));
    }
};
