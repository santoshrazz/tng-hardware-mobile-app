import { userModel } from "../models/user.models.js"
import { ApiError } from "./errorHandler.middleware.js"
import jwt from 'jsonwebtoken'

export async function verifyUserToken(req, res, next) {
    try {
        const token = req?.cookie?.token || req?.headers?.authorization?.split(" ")[1]
        if (!token) {
            return next(new ApiError("unauthenticated", 403))
        }
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET_KEY)
        req.user = decodedPayload
        next()
    } catch (error) {
        return next(new ApiError("unauthenticated", 403))
    }
}
export async function isAdmin(req, res, next) {
    try {
        const userId = req?.user?.id
        if (!userId) {
            return next(new ApiError("unauthenticated", 403))
        }
        const user = await userModel.findById(userId)
        if (!user) {
            return next(new ApiError("No user found ", 403))
        }
        if (user.role === "Admin") {
            next()
        }
        else {
            return next(new ApiError("Need admin access to get the info", 403))
        }
    } catch (error) {
        return next(new ApiError("unauthenticated", 403))
    }
}