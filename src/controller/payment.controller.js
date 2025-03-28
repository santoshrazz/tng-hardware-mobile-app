import mongoose from "mongoose";
import { ApiError } from "../middleware/errorHandler.middleware.js";
import { paymentModal } from "../models/payment.models.js";
import { userModel } from "../models/user.models.js";

export const createPayment = async (req, res, next) => {
    const userId = req.user.id;
    const { upiId, amount } = req.body;
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const paymentRequestedUser = await userModel.findById(userId);
        if (!paymentRequestedUser) {
            return next(new ApiError("Requested user not found", 400));
        }
        if (paymentRequestedUser.totalWalletAmount < amount) {
            return next(new ApiError("You have insufficient wallet balance", 400));
        }
        paymentRequestedUser.totalWalletAmount -= amount;
        paymentRequestedUser.totalWithdrawnAmount += amount;
        const createdPayment = await paymentModal.create([{ upiId, amount, status: "pending", byUser: userId }], { session })
        await paymentRequestedUser.save({ session })
        await session.commitTransaction()
        return res.status(200).json({ success: true, message: "Your payment request created and amount will be create when admin approved" })
    } catch (error) {
        await session.abortTransaction()
        return next(new ApiError("Error while creating Payment"))
    }
    finally {
        session.endSession()
    }
}

export const getPendingPayments = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const currentUser = await userModel.findById(userId)
        if (currentUser.role === "Admin") {
            const pendingPayments = await paymentModal.find({ status: "pending" }).populate("byUser", "name _id profilePic")
            return res.status(200).json({ success: true, message: "Retrieved pending payments for Admin", payments: pendingPayments })
        }
        else if (currentUser.role === "User") {
            const pendingPayments = await paymentModal.find({ byUser: userId })
            return res.status(200).json({ success: true, message: "Retrieved pending payments for user", payments: pendingPayments })
        }
        return next(new ApiError("No Pending Activity Found", 400))
    } catch (error) {
        return next(new ApiError("Error while getting pending payments", 500))
    }
}

export const getAllPaymentAdmin = async (req, res, next) => {
    const paymentType = req.query.type;
    if (!paymentType) {
        return next(new ApiError("Activity type required", 400));
    }
    try {
        if (paymentType.toLowerCase() === "pending") {
            const payments = await paymentModal.find({ status: "pending" }).sort({ createdAt: 1 }).populate("byUser", "name _id profilePic")
            return res.status(200).json({ message: "Pending payments retrieved", payment: payments })
        } else if (paymentType.toLowerCase() === "completed") {
            const payments = await paymentModal.find({ status: "completed" }).sort({ createdAt: 1 }).populate("byUser", "name _id profilePic")
            return res.status(200).json({ message: "Pending payments retrieved", payment: payments })
        }
        else if (paymentType.toLowerCase() === "failed") {
            const payments = await paymentModal.find({ status: "failed" }).sort({ createdAt: 1 }).populate("byUser", "name _id profilePic")
            return res.status(200).json({ message: "Pending payments retrieved", payment: payments })
        }
        const payments = await paymentModal.find({}).sort({ createdAt: 1 }).populate("byUser", "name _id profilePic")
        return res.status(200).json({ message: "Pending payments retrieved", payment: payments })
    } catch (error) {
        return next(new ApiError("failed to fetch admin activity", 500))
    }
}

export async function processPayment(req, res, next) {
    try {
        const { userId, amount, transetionId, paymentMethod, paymentId } = req.body;
        const reqUserId = req.user.id;
        const currentUser = await userModel.findById(reqUserId);
        if (currentUser.role !== "Admin") {
            return next(new ApiError("Invalid Request", 401))
        }
        const currentPendingPayment = await paymentModal.findById(paymentId);
        if (!currentPendingPayment) {
            return next(new ApiError("No Payment found with the payment id"))
        }
        if (currentPendingPayment.status !== "pending") {
            return next(new ApiError(`Your payment status is already ${currentPendingPayment.status}`))
        }
        if (currentPendingPayment.amount !== amount || currentPendingPayment.byUser !== userId) {
            return next(new ApiError("Pending amount and receiver amount doesn't match"))
        }
        if (paymentMethod.toLowerCase() === "cash") {
            currentPendingPayment.paymentMethod = "cash"
            currentPendingPayment.status = "completed"
            await currentPendingPayment.save()
            return res.status(200).json({ message: "Payment made Successfully with cash", success: true })
        }
        else {
            currentPendingPayment.paymentMethod = "upi"
            currentPendingPayment.status = "completed"
            currentPendingPayment.transectionId = transetionId;
            await currentPendingPayment.save()
            return res.status(200).json({ message: "Payment made Successfully with cash", success: true })
        }

    } catch (error) {
        return next(new ApiError("Error processing payments", 500))
    }
}