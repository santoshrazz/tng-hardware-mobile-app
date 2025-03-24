import dotenv from 'dotenv'
import { v2 as cloudinary } from 'cloudinary'
dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINERY_CLOUD_NAME,
    api_key: process.env.CLOUDINERY_API_KEY,
    api_secret: process.env.CLOUDINERY_API_SECRET
})
const uploadToCloudinery = async (filePath) => {
    try {
        const url = await cloudinary.uploader.upload(filePath, { resource_type: "auto" })
        return url?.secure_url;
    } catch (error) {
        return null
    }
}
export { uploadToCloudinery }