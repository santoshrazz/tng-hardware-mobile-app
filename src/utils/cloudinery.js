import dotenv from 'dotenv'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'
dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINERY_CLOUD_NAME,
    api_key: process.env.CLOUDINERY_API_KEY,
    api_secret: process.env.CLOUDINERY_API_SECRET
})
const uploadToCloudinery = async (filePath) => {
    try {
        const url = await cloudinary.uploader.upload(filePath, { resource_type: "auto" })
        if (url) {
            fs.unlinkSync(filePath)
            return url?.secure_url;
        }
        return null
    } catch (error) {
        return null
    }
}
export { uploadToCloudinery }