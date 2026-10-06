const { randomUUID } = require('node:crypto');
const repository = require('../repositories/documentRepository');

function publicMetadata(document) {
  const { id, originalName, size, uploadedAt, owner } = document;
  return { id, originalName, size, uploadedAt, owner };
}

async function upload(file, owner) {
  try {
    if (!file) {
      throw Object.assign(new Error('Envie um arquivo.'), { code: 'FILE_REQUIRED' });
    }
    if (typeof owner !== 'string' || !owner.trim()) {
      throw Object.assign(new Error('Informe o dono do documento.'), { code: 'OWNER_REQUIRED' });
    }
    const document = {
      id: randomUUID(),
      originalName: file.originalName,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner: owner.trim(),
      storageName: file.storageName,
    };
    repository.save(document);
    return publicMetadata(document);
  } catch (error) {
    if (file) await repository.removeFile(file.storageName);
    throw error;
  }
}

function list() {
  return repository.findAll().map(publicMetadata);
}

function download(id) {
  const document = repository.findById(id);
  if (!document) {
    throw Object.assign(new Error('Documento não encontrado.'), { code: 'DOCUMENT_NOT_FOUND' });
  }
  return { filePath: repository.getFilePath(document.storageName), originalName: document.originalName };
}

module.exports = { upload, list, download };