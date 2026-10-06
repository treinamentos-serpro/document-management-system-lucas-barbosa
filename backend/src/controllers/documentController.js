const service = require('../services/documentService');

async function upload(req, res) {
  const file = req.file && {
    originalName: req.file.originalname,
    size: req.file.size,
    storageName: req.file.filename,
  };
  const document = await service.upload(file, req.body?.owner);
  res.status(201).json({ document });
}

function list(req, res) {
  res.json(service.list());
}

function download(req, res, next) {
  const document = service.download(req.params.id);
  res.download(document.filePath, document.originalName, (error) => {
    if (error) {
      if (error.code === 'ENOENT') error.code = 'DOCUMENT_NOT_FOUND';
      next(error);
    }
  });
}

function handleError(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: { code: 'FILE_TOO_LARGE', message: 'O arquivo excede o limite permitido.' } });
  }
  if (error.code === 'DOCUMENT_NOT_FOUND') {
    return res.status(404).json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' } });
  }
  if (error.code === 'FILE_REQUIRED' || error.code === 'OWNER_REQUIRED') {
    return res.status(400).json({ error: { code: error.code, message: error.message } });
  }
  if (error.name === 'MulterError' || /^(Multipart:|Unexpected end of form)/.test(error.message)) {
    return res.status(400).json({ error: { code: 'INVALID_UPLOAD', message: 'Upload inválido. Envie um arquivo no campo file.' } });
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível concluir a operação.' } });
}

module.exports = { upload, list, download, handleError };