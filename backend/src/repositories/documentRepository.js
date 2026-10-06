const path = require('node:path');
const { mkdir, unlink } = require('node:fs/promises');

const storageDirectory = path.resolve(__dirname, '../../storage');
const documents = new Map();

async function prepareStorage() {
  await mkdir(storageDirectory, { recursive: true });
  return storageDirectory;
}

function save(document) {
  documents.set(document.id, { ...document });
}

function findAll() {
  return Array.from(documents.values(), (document) => ({ ...document }));
}

function findById(id) {
  const document = documents.get(id);
  return document ? { ...document } : null;
}

function getFilePath(storageName) {
  return path.join(storageDirectory, storageName);
}

async function removeFile(storageName) {
  try {
    await unlink(getFilePath(storageName));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

module.exports = { prepareStorage, save, findAll, findById, getFilePath, removeFile };