import multer from 'multer';

const allowedTypes = {
  pdf: 'application/pdf',
  epub: 'application/epub+zip'
};

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, callback) => {
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    if (
      !Object.hasOwn(allowedTypes, extension) ||
      file.mimetype !== allowedTypes[extension]
    ) {
      return callback(
        new Error('Solo se permiten archivos PDF y EPUB válidos.')
      );
    }

    req.fileFormat = extension;
    callback(null, true);
  }
});

export default upload;
