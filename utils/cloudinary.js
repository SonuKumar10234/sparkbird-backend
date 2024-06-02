const cloudinary = require('cloudinary').v2;
const fs = require('fs');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath, folder) => {
    try {
        if (!localFilePath) return null  // or you can return a error message that could not find the path

        //upload the path on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            folder: folder,
            resource_type: 'auto' 
        })

        // Remove the local file after successful upload
        fs.unlinkSync(localFilePath);

        return response;

    } catch (error) {
        // remove the locally saved temporary file as the upload operation got failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        console.error("Error uploading to Cloudinary:", error);
        // return null;
    }
}

module.exports = uploadOnCloudinary;