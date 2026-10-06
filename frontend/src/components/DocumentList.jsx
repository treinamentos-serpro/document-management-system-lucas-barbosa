import DownloadButton from './DownloadButton.jsx';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1048576) return `${numberFormatter.format(size / 1024)} KiB`;
  return `${numberFormatter.format(size / 1048576)} MiB`;
}

export default function DocumentList({ documents, loading, error, onRefresh }) {
  return (
    <section className="documents-section" aria-labelledby="documents-title" aria-busy={loading}>
      <div className="section-heading">
        <div className="heading-with-count">
          <h2 id="documents-title">Documentos</h2>
          <span className="document-count" aria-label={`${documents.length} documentos`}>{documents.length}</span>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>
      {error && <p className="message error-message" role="alert">{error}</p>}
      {loading && <p className="list-state" role="status">Carregando documentos...</p>}
      {!loading && !error && documents.length === 0 && (
        <p className="list-state">Nenhum documento enviado.</p>
      )}
      {documents.length > 0 && (
        <div className="table-container" tabIndex={0} role="region" aria-label="Lista de documentos">
          <table>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Responsável</th>
                <th scope="col">Tamanho</th>
                <th scope="col">Enviado em</th>
                <th scope="col">Download</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <th scope="row" className="document-name">{document.originalName}</th>
                  <td className="document-owner">{document.owner}</td>
                  <td className="nowrap">{formatSize(document.size)}</td>
                  <td className="nowrap">
                    <time dateTime={document.uploadedAt}>{dateFormatter.format(new Date(document.uploadedAt))}</time>
                  </td>
                  <td><DownloadButton document={document} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}