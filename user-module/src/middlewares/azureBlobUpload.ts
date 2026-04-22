import multer, { FileFilterCallback } from "multer";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024; //10MB

/**
 * Accept only images: jpg, jpeg, png, webp, gif (optional)
 */
const imageFilter = (
    req: Express.Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        cb(null, true);
    } else {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only image files are allowed (jpg, jpeg, png, webp, gif)."));
    }
};

export const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: imageFilter,
    limits: { fileSize: MAX_FILE_SIZE },
});
