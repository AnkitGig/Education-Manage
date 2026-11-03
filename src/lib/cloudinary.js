import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function uploadBuffer(buffer, { folder = 'edumanage', resource_type = 'auto' } = {}) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type }, (err, res) => (err ? reject(err) : resolve(res)))
      .end(buffer);
  });
}

export const removeAsset = (publicId) => cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
export default cloudinary;
