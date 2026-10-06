const API_PREFIX = '/api';

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, options);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao servidor. Tente novamente.');
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message || 'Não foi possível concluir a operação.');
  }
  return response;
}

export async function listDocuments(signal) {
  const response = await request('/documents', { signal });
  return response.json();
}

export async function uploadDocument(file, owner) {
  const body = new FormData();
  body.append('file', file);
  body.append('owner', owner.trim());
  const response = await request('/upload', { method: 'POST', body });
  const { document } = await response.json();
  return document;
}

export async function downloadDocument(id) {
  const response = await request(`/documents/${encodeURIComponent(id)}/download`);
  return response.blob();
}