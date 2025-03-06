import bcryptjs from 'bcryptjs'
import { customAlphabet } from 'nanoid'
export const comparePassword = async (password, hashPassword) => {
    const isMatch = await bcryptjs.compare(password, hashPassword)
    return isMatch
}
const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 12)
export const generateCouponCode = () => {
    const prefix = "s"; // Add any prefix you want
    const suffix = "62s";   // Add any suffix you want
    const id = nanoid(12);
    return prefix + id + suffix;
}