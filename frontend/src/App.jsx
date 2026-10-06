import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadDocuments() {
      setLoading(true);
      setError('');
      try {
        const result = await listDocuments(controller.signal);
        if (!controller.signal.aborted) setDocuments(result);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    loadDocuments();
    return () => controller.abort();
  }, [refreshIndex]);

  function refreshDocuments() {
    setRefreshIndex((current) => current + 1);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <span className="app-mark" aria-hidden="true">DMS</span>
        <h1>Gestão de documentos</h1>
      </header>
      <UploadComponent onUploaded={refreshDocuments} />
      <DocumentList documents={documents} loading={loading} error={error} onRefresh={refreshDocuments} />
    </main>
  );
}
