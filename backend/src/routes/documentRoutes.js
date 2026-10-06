const express = require('express');
const multer = require('multer');
const { randomUUID } = require('node:crypto');
const repository = require('../repositories/documentRepository');
const controller = require('../controllers/documentController');

const maxFileSize = Number(process.env.MAX_FILE_SIZE_BYTES ?? 10485760);
if (!Number.isSafeInteger(maxFileSize) || maxFileSize <= 0) {
  throw new Error('MAX_FILE_SIZE_BYTES deve ser um inteiro positivo.');
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    repository.prepareStorage().then(
      (directory) => callback(null, directory),
      (error) => callback(error),
    );
  },
  filename(req, file, callback) {
    callback(null, randomUUID());
  },
});

const upload = multer({ storage, limits: { fileSize: maxFileSize } });
const router = express.Router();

router.post('/upload', upload.single('file'), controller.upload);
router.get('/documents', controller.list);
router.get('/documents/:id/download', controller.download);
router.use(controller.handleError);

module.exports = router;