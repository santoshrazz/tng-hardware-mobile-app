import { couponModel } from "../models/coupon.models.js";
import { ApiError } from "../middleware/errorHandler.middleware.js"; // Assuming you have an ApiError utility
import { userModel } from "../models/user.models.js";
import mongoose from "mongoose";
import { generateCouponCode } from "../utils/index.js";
import { activityModal } from "../models/activity.models.js";
import { paymentModal } from "../models/payment.models.js";

// ===========>   User only Controller   <================
export const handleCreateCoupon = async (req, res, next) => {
    try {
        const { amount, couponNo } = req.body;
        const userId = req.user.id

        // Validate input
        if (!amount || !couponNo || couponNo <= 0) {
            return next(new ApiError("Amount and couponNo (positive integer) are required", 400));
        }
        if (couponNo >= 50) {
            return next(new ApiError("Maximum 50 coupons can created at once", 400));
        }
        const coupons = [];
        for (let i = 0; i < couponNo; i++) {
            let newCouponCode;
            let isUnique = false;

            // Ensure unique coupon code
            while (!isUnique) {
                newCouponCode = generateCouponCode();
                const isExists = await couponModel.findOne({ couponCode: newCouponCode });
                if (!isExists) {
                    isUnique = true;
                }
            }
            coupons.push({
                couponCode: newCouponCode, // Match schema field name
                couponAmount: amount
            });
        }
        // Insert all coupons into the database
        await couponModel.insertMany(coupons);
        await activityModal.create({
            message: `${coupons.length} coupon created`,
            byUser: userId
        })
        const newCoupons = coupons.map(({ couponCode }) => ({ couponCode }));

        res.status(201).json({
            success: true,
            message: `${couponNo} coupons created successfully`,
            newCoupons,
        });
    } catch (error) {
        next(error); // Pass error to the error handler
    }
};

export const handleRedeemCoupon = async (req, res, next) => {
    const { couponCode } = req.body;
    if (!couponCode) {
        return next(new ApiError("Coupon code required", 400))
    }
    const userId = req.user.id;
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const isCouponExists = await couponModel.findOne({ couponCode })
        if (!isCouponExists) {
            return next(new ApiError("Invalid coupon code", 400))
        }
        if (isCouponExists.isUsed) {
            return next(new ApiError("Coupon Already Used Try purchasing a new product", 400))
        }
        const user = await userModel.findById(userId);
        if (!user) {
            return next(new ApiError("No user found", 400))
        }
        user.totalWalletAmount = (user.totalWalletAmount || 0) + isCouponExists.couponAmount;
        user.noOfCouponRedeem = (user.noOfCouponRedeem || 0) + 1;
        isCouponExists.isUsed = true;
        isCouponExists.usedByUser = userId;
        await user.save({ session })
        await isCouponExists.save({ session })

        await session.commitTransaction();
        session.endSession();
        await activityModal.create({
            message: `Redeem coupon of ${isCouponExists.couponAmount}`,
            byUser: userId
        })
        res.status(200).json({
            message: "Coupon redeemed successfully",
            success: true,
            points: isCouponExists.couponAmount,
            walletAmount: user.totalWalletAmount,
            redeemedCoupons: user.noOfCouponRedeem,
        })
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return next(new ApiError("Error redeem coupon", 400))
    }

}
// export const getAllRedeemdCouponList = async (req, res, next) => {
//     try {
//         const coupons = await couponModel.find({ isUsed: true }).populate('usedByUser', 'name _id');
//         if (coupons.length <= 0) {
//             return res.status(200).json({ success: true, message: "No redeemed coupons yet", coupons });
//         }
//         return res.status(200).json({ success: true, message: "coupons retrieved successfully", coupons });
//     } catch (error) {
//         return next(new ApiError("error fetching redeemed coupons", 500))
//     }
// }

// =========> Admin only Controllers <=============
export const getRedeemedByUserCouponList = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const userDetails = await userModel.findById(userId);
        const dataToSend = {
            totalWalletAmount: userDetails.totalWalletAmount,
            totalWithdrawnAmount: userDetails.totalWithdrawnAmount,
            pointsTillNow: userDetails.totalWalletAmount + userDetails.totalWithdrawnAmount
        }
        const coupons = await couponModel.find({ usedByUser: userId })
        if (coupons.length <= 0) {
            return res.status(200).json({ success: true, message: "No redeemed coupons yet", userDetails: dataToSend, coupons });
        }
        const paymentsWithdrawn = await paymentModal.find({
            $and: [
                { status: "approved" },
                { byUser: userId }
            ]
        })
        const rejectedPayment = await paymentModal.find({
            $and: [
                { status: "rejected" },
                { byUser: userId }
            ]
        })
        return res.status(200).json({ success: true, userDetails: dataToSend, message: "coupons retrieved successfully", coupons, paymentsWithdrawn, rejectedPayment });
    } catch (error) {
        return next(new ApiError("error fetching redeemed coupons", 500))
    }
}

export const getUnUsedCouponList = async (req, res, next) => {
    const status = req.params.status;
    try {
        if (status === "used") {
            const allCoupons = await couponModel.find({ isUsed: true }).populate('usedByUser', 'name _id');
            return res.status(200).json({ message: "Used coupons retrieved successfully", success: true, coupons: allCoupons })
        }
        else if (status === "unused") {
            const allCoupons = await couponModel.find({ isUsed: false });
            return res.status(200).json({ message: "Unused coupons retrieved successfully", success: true, coupons: allCoupons })
        }
        const allCoupons = await couponModel.find({});
        return res.status(200).json({ message: "all coupons retrieved successfully", success: true, coupons: allCoupons })
    } catch (error) {
        return next(new ApiError("Error getting coupons", 500))
    }
}
export const deleteCouponById = async (req, res, next) => {
    const couponId = req.params.couponId;
    if (!couponId) {
        return next(new ApiError("No coupon Id provided", 404))
    }
    try {
        const deletedCoupon = await couponModel.deleteOne({ _id: couponId });
        if (deletedCoupon?.deletedCount !== 1) {
            return next(new ApiError("Error deleting coupon", 500))
        }
        return res.status(200).json({ message: "coupon Deleted", success: true })
    } catch (error) {
        return next(new ApiError("Error deleting coupon", 500))
    }

}
export const deleteUsedCoupon = async (req, res, next) => {
    const couponType = req.params.couponType;
    if (!couponType) {
        return next(new ApiError("Type required Used or Unused", 404))
    }
    const isUsedorUnused = couponType === "used" ? true : false;
    try {
        const deletedCoupon = await couponModel.deleteMany({ isUsed: isUsedorUnused });
        // if (deletedCoupon?.deletedCount !== 1) {
        //     return next(new ApiError("Error deleting coupon", 500))
        // }
        return res.status(200).json({ message: "coupon Deleted", success: true })
    } catch (error) {
        return next(new ApiError("Error deleting coupon", 500))
    }

}
//all user list
//all those coupons which is not in used