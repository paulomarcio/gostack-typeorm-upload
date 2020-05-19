import path from 'path';
import multer from 'multer';

const destinationPath = path.resolve(__dirname, '..', '..', 'tmp');

export default {
  destDir: destinationPath,
  storage: multer.diskStorage({
    destination: destinationPath,
    filename: (request, file, callback) => {
      return callback(null, file.originalname);
    },
  }),
};
