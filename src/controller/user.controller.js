import { ApiError } from '../middleware/errorHandler.middleware.js'
import { userModel } from '../models/user.models.js'
import sendMail from '../utils/sendMail.js'
import { comparePassword } from '../utils/index.js'
import { couponModel } from '../models/coupon.models.js'
import { uploadToCloudinery } from '../utils/cloudinery.js'
import { activityModal } from '../models/activity.models.js'
import { productModel } from '../models/product.models.js'
import { timeDifference } from '../constants/index.js'
import { validationResult } from 'express-validator'
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
        // const userOtp = Math.floor(100000 + Math.random() * 900000);
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

        const newUser = await userModel.findById(createdUser._id).select("-password -isVerified -userVerificationOtp  -userVerificationOtpExpiry");
        const activityUpdate = await activityModal.create({
            message: ` just join our platform`,
            byUser: newUser._id
        })
        const token = await newUser.generateAuthToken();
        newUser.token = token;
        response.status(201).json({ message: "User created", token, user: newUser, success: true })

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
        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(400).json({ errors: errors.array() });
        }
        const { email, password, phone } = request.body;

        // Find the user by email, including the password (since it's marked as `select: false` in the schema)
        const user = await userModel.findOne({
            $or: [
                { email },
                { phone: email }
            ]
        }).select("+password +isVerified +role");

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
        console.log("error", error)
        next(new ApiError("An error occurred during login. Please try again.", 500));
    }
};

export const getUserProfileDetail = async (request, response, next) => {
    try {
        const userId = request?.user?.id
        if (!userId) {
            return next(new ApiError("No user id found", 401))
        }
        const user = await userModel.findById(userId).select("-noOfCouponRedeem")
        const allRedeemdCoupons = await couponModel.find({ usedByUser: user._id })
        response.status(200).json({ success: true, message: "Getting user details successfully", user })
    } catch (error) {
        console.log("error", error)
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
export const userDetails = async (request, response, next) => {
    try {
        const userId = request?.params?.id
        if (!userId) {
            return next(new ApiError("No user id found", 401))
        }
        const user = await userModel.findById(userId).select("-noOfCouponRedeem")
        const allRedeemdCoupons = await couponModel.find({ usedByUser: user._id })
        response.status(200).json({ success: true, message: "Retrived user details successfully", user, coupons: allRedeemdCoupons })
    } catch (error) {
        return next(new ApiError("Error getting user detail"));
    }
}

export const updateUserProfile = async (request, response, next) => {
    try {
        const userId = request.user.id
        const { name, email, phone, address } = request.body;
        const profilePic = request.file;
        let userUploadedProfilePic = "";
        if (profilePic && profilePic?.filename && profilePic?.path) {
            const uploadUrl = await uploadToCloudinery(profilePic?.path)
            if (!uploadUrl) {
                return new ApiError("Error  Uploading Profile Pic", 400)
            }
            userUploadedProfilePic = uploadUrl
        }
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email
        if (phone) updateData.phone = phone
        if (address) updateData.address = address
        if (userUploadedProfilePic) updateData.profilePic = userUploadedProfilePic;
        const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true })
        response.status(200).json({ success: true, message: "User details updated successfully", user: updatedUser })
    } catch (error) {
        return next(new ApiError("Error updating user detail"));
    }
}
export const getRecentActivity = async (request, response, next) => {
    try {
        const allActivity = await activityModal.find({});
        return response.status(200).json({ success: true, message: "Recent activity retrieved successfully", activity: allActivity })
    } catch (error) {
        return next(new ApiError("Error retrieving recent activity"));
    }
}
export const getDashboardData = async (req, res, next) => {
    try {
        const type = req.params.type;
        const userId = req.user.id;
        const dataToSend = {}
        // ======> Getting the Admin Dashboard Data  <========
        if (type.toUpperCase() === "ADMIN") {
            const allUserCount = await userModel.countDocuments({ role: "User" });
            const allCoupons = await couponModel.countDocuments();
            const allRedeemCoupons = await couponModel.countDocuments({ isUsed: true });
            dataToSend.userCount = allUserCount
            dataToSend.CouponCount = allCoupons
            dataToSend.CouponRedeemCount = allRedeemCoupons

            const allRedeemedCouponList = await couponModel.find({ isUsed: true })
            let totalRedeemedAmount = 0;
            allRedeemedCouponList.forEach((coupon) => {
                totalRedeemedAmount += coupon?.couponAmount || 0
            })
            dataToSend.pointsWithdrawn = totalRedeemedAmount;
            const recentActivity = await activityModal.find({}).populate("byUser", "name _id profilePic").limit(3);
            const recentActivityArrayModified = recentActivity.map((activity) => {
                const timeDiff = timeDifference(activity.createdAt)
                const simpleObject = {
                    id: activity._id,
                    user: activity?.byUser?.name,
                    action: activity.message,
                    avatar: activity?.byUser?.profilePic || "",
                    time: timeDiff
                }
                return simpleObject
            })
            dataToSend.recentActivity = recentActivityArrayModified;
            return res.status(200).json({ success: true, message: "Dashboard data retrieved successfully for admin", data: dataToSend })
        }
        else if (type.toUpperCase() === "USER") {
            const userData = await userModel.findById(userId).select("+totalWalletAmount +noOfCouponRedeem")
            dataToSend.user = { walletAmout: userData?.totalWalletAmount || 0, redeemCouponCount: userData?.noOfCouponRedeem || 0 }

            const allRecentScanCoupons = await couponModel.find({ isUsed: true }).sort({ createdAt: 1 }).limit(3).populate("usedByUser", "name _id profilePic")

            dataToSend.recentScans = allRecentScanCoupons;

            const recentProducts = await productModel.find({ isFeatured: true }).sort({ createdAt: 1 }).limit(4);
            dataToSend.products = recentProducts;
            return res.status(200).json({ success: true, message: "Dashboard data retrieved successfully for user", data: dataToSend })
        }

    } catch (error) {
        return next(new ApiError("Error retrieving dashboard data", 500))
    }
}