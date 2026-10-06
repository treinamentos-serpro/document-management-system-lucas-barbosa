import { useState } from 'react';
import { downloadDocument } from '../services/documentApi.js';

export default function DownloadButton({ document }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setDownloading(true);
    setError('');
    try {
      const blob = await downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (downloadError) {
      setError(downloadError.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="download-action">
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        aria-label={`Baixar ${document.originalName}`}
      >
        {downloading ? 'Baixando...' : 'Baixar'}
      </button>
      {error && <p className="message error-message" role="alert">{error}</p>}
    </div>
  );
}