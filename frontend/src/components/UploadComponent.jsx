import { useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';

export default function UploadComponent({ onUploaded }) {
  const [owner, setOwner] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get('file');
    setError('');
    setSuccess('');
    if (!file?.name || !owner.trim()) {
      setError('Selecione um arquivo e informe o responsável.');
      return;
    }
    setUploading(true);
    try {
      const document = await uploadDocument(file, owner);
      form.elements.file.value = '';
      setSuccess(`${document.originalName} enviado com sucesso.`);
      onUploaded(document);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <h2 id="upload-title">Enviar documento</h2>
      <form onSubmit={handleSubmit} aria-busy={uploading}>
        <fieldset disabled={uploading} className="upload-fields">
          <div className="field">
            <label htmlFor="document-owner">Responsável</label>
            <input
              id="document-owner"
              name="owner"
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              required
              placeholder="Identificador do usuário"
            />
          </div>
          <div className="field file-field">
            <label htmlFor="document-file">Arquivo</label>
            <input id="document-file" name="file" type="file" required />
          </div>
          <button className="primary-button" type="submit">
            {uploading ? 'Enviando...' : 'Enviar documento'}
          </button>
        </fieldset>
      </form>
      {error && <p className="message error-message" role="alert">{error}</p>}
      {success && <p className="message success-message" role="status">{success}</p>}
    </section>
  );
}