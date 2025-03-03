import bcryptjs from 'bcryptjs'
export const comparePassword = async (password, hashPassword) => {
    const isMatch = await bcryptjs.compare(password, hashPassword)
    return isMatch
}