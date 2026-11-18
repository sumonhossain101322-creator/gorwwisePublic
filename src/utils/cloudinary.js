import { v2 as cloudinary } from "cloudinary";

// CLOUDINARY_URL supplies cloud name, key, and secret. secure keeps delivery on HTTPS.
const current = cloudinary.config();
cloudinary.config({ ...current, secure: true });

export default cloudinary;
