# Especificação - Document Management System

## 1. Objetivo

Disponibilizar uma aplicação web simples para enviar, listar e baixar documentos armazenados localmente, com metadados associados ao usuário responsável pelo envio.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição.
- Listagem dos documentos registrados durante a execução atual do backend.
- Download de um documento pelo identificador.
- Registro do nome do usuário responsável como metadado do documento.
- Interface web para executar esses fluxos e apresentar erros de forma compreensível.
- Verificação de saúde do backend pelo endpoint já existente `GET /health`.

### Fora do escopo

- Armazenamento em nuvem, provedores externos ou serviços de upload de terceiros.
- Banco de dados ou persistência durável dos metadados.
- Autenticação, autorização, gerenciamento de contas ou isolamento seguro entre usuários.
- Versionamento, edição, exclusão, busca avançada ou compartilhamento de documentos.
- Pré-visualização de conteúdo no navegador.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário pode enviar um arquivo com o campo multipart `file` e informar o campo de texto `owner`. |
| RF-02 | O sistema valida a presença do arquivo e de um identificador de dono não vazio antes de registrar o documento. |
| RF-03 | Após um envio válido, o sistema grava o arquivo no armazenamento local e retorna seus metadados com um identificador único. |
| RF-04 | O usuário pode listar os metadados dos documentos registrados na execução atual do backend. |
| RF-05 | O usuário pode baixar o arquivo correspondente a um identificador existente. |
| RF-06 | O sistema responde com erro identificável quando o arquivo ou o dono estiver ausente, o arquivo exceder o limite configurado ou o documento não existir. |
| RF-07 | A interface permite enviar arquivos, consultar a lista e iniciar o download, informando estados de carregamento, sucesso e erro. |
| RF-08 | O endpoint `GET /health` informa se o processo do backend está respondendo. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser gravados exclusivamente no filesystem local em `backend/storage`, usando `multer` com `diskStorage`. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase; reiniciar o backend remove os registros, mas não necessariamente os arquivos já gravados. |
| RNF-03 | O backend deve usar Node.js e Express em CommonJS; o frontend deve usar React e Vite em ESM, sem TypeScript nesta fase. |
| RNF-04 | Configurações operacionais, incluindo a porta e o limite de tamanho do upload, devem vir de variáveis de ambiente com valores padrão documentados. |
| RNF-05 | O limite padrão de tamanho do arquivo é 10 MiB e pode ser alterado por `MAX_FILE_SIZE_BYTES`. |
| RNF-06 | O nome original do arquivo não deve ser usado como caminho físico de armazenamento. O sistema deve gerar um nome interno único e não expor o caminho local pela API. |
| RNF-07 | O backend deve tratar erros nas fronteiras HTTP e de filesystem, sem retornar stack traces ou caminhos internos ao cliente. |
| RNF-08 | O frontend deve chamar a API pelo prefixo `/api`; no desenvolvimento, o proxy Vite remove esse prefixo e encaminha as chamadas ao backend local. |
| RNF-09 | O backend deve ter testes automatizados com o runner nativo `node:test`. |

## 5. Modelo de dados

### Metadados do documento

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único, gerado pelo servidor. |
| `originalName` | string | Sim | Nome original enviado pelo cliente; usado para exibição e nome do download. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Sim | Data e hora de registro no formato ISO 8601 em UTC. |
| `owner` | string | Sim | Identificador textual do responsável informado no envio. |

### Dados internos de armazenamento

O repositório mantém também uma referência interna, como `storageName`, para localizar o arquivo gerado no diretório local. Essa referência não faz parte dos metadados retornados pela API. O nome interno deve ser gerado pelo servidor, não pelo cliente.

### Regras e limitações

- Os metadados são mantidos em memória e não sobrevivem à reinicialização do processo.
- Os arquivos são mantidos em `backend/storage`; uma reinicialização pode deixar arquivos sem metadados correspondentes.
- `owner` é apenas um metadado declarado pelo cliente nesta fase. Sem autenticação, não comprova identidade nem restringe acesso.
- Não se define unicidade para `originalName`; documentos com nomes iguais são permitidos.

## 6. Contratos de API

Os caminhos abaixo são relativos ao backend. O frontend usa `/api` como prefixo de desenvolvimento, por exemplo `/api/documents`.

### Formato de erro

Erros HTTP devem usar JSON no formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

O campo `code` é estável para tratamento pelo cliente; `message` é uma mensagem legível em português. Erros inesperados retornam uma mensagem genérica, sem detalhes internos.

### `POST /upload`

- **Entrada:** `multipart/form-data` com `file` (arquivo obrigatório) e `owner` (texto obrigatório e não vazio).
- **Sucesso:** `201 Created`, JSON com o documento criado.

```json
{
  "document": {
    "id": "uuid",
    "originalName": "relatorio.pdf",
    "size": 12345,
    "uploadedAt": "2026-10-06T12:00:00.000Z",
    "owner": "usuario-123"
  }
}
```

- **Erros:** `400 Bad Request` para arquivo ou dono ausente/inválido; `413 Payload Too Large` quando o limite de tamanho for excedido; `500 Internal Server Error` para falha inesperada ao gravar ou registrar o arquivo.

### `GET /documents`

- **Entrada:** sem corpo ou parâmetros obrigatórios.
- **Sucesso:** `200 OK`, array JSON de metadados, podendo ser vazio. A resposta não inclui caminhos nem nomes físicos internos.
- **Erro:** `500 Internal Server Error` para falha inesperada ao consultar o repositório em memória.

```json
[
  {
    "id": "uuid",
    "originalName": "relatorio.pdf",
    "size": 12345,
    "uploadedAt": "2026-10-06T12:00:00.000Z",
    "owner": "usuario-123"
  }
]
```

### `GET /documents/:id/download`

- **Entrada:** identificador do documento no segmento `:id`.
- **Sucesso:** `200 OK`, conteúdo binário com `Content-Disposition: attachment` e nome de download baseado em `originalName`.
- **Erros:** `404 Not Found` se o identificador não estiver registrado ou se o arquivo local não existir; `500 Internal Server Error` para outra falha de leitura.

### `GET /health`

- **Sucesso:** `200 OK`, JSON `{ "status": "ok" }` quando o processo estiver respondendo.

## 7. Decisões arquiteturais

### Backend

O backend segue Clean Architecture simples, com dependências apontando para dentro do fluxo de negócio:

`routes -> controllers -> services -> repositories`

- **Routes:** declaram endpoints, conectam middleware de upload do Multer e encaminham a requisição ao controller. Não implementam regras de negócio.
- **Controllers:** leem parâmetros e dados HTTP, fazem validação básica de entrada, chamam services e traduzem resultados/erros para status e respostas HTTP.
- **Services:** aplicam as regras de upload, listagem e download sem depender de Express ou Multer.
- **Repositories:** encapsulam a coleção de metadados em memória e o acesso aos arquivos locais. Não conhecem detalhes de HTTP.
- **Multer:** usa `diskStorage` no limite de entrada HTTP, gravando em `backend/storage` com nomes internos gerados. A configuração do middleware não deve deslocar persistência ou regras de negócio para controllers.

### Frontend

- Usar componentes funcionais e React Hooks, organizados em `components/`, `pages/` e `services/`.
- Centralizar chamadas HTTP em serviços que usam `fetch` e o prefixo `/api`.
- Manter validação de interface como conveniência; o backend continua sendo a autoridade para validar requisições.

### Configuração

- `PORT`: porta HTTP do backend, padrão `3000`.
- `MAX_FILE_SIZE_BYTES`: limite máximo do upload em bytes, padrão `10485760` (10 MiB).
- O local de armazenamento permanece fixo em `backend/storage`, conforme a restrição do projeto; não deve ser substituído por um serviço remoto.

## 8. Plano de execução

As etapas abaixo são um roteiro futuro de implementação. Esta especificação não executa nem altera arquivos de backend ou frontend.

1. Confirmar contratos, formato de erros, variáveis de ambiente e comportamento de ownership descritos nesta especificação.
2. Implementar o fluxo de upload local, geração de identificadores e registro de metadados em memória, respeitando as camadas do backend.
3. Implementar listagem e download com tratamento de documento inexistente e falhas de filesystem.
4. Construir a interface para upload, listagem e download e conectá-la à API pelo proxy `/api`.
5. Cobrir contratos e fluxos principais com testes backend e verificações de integração manual entre frontend e backend.
6. Validar reinicialização, limite de upload, erros HTTP e ausência de dependências de armazenamento externo.

## 9. Critérios de aceite

- Um envio válido grava o arquivo em `backend/storage` e devolve os metadados definidos nesta especificação.
- Arquivo ausente, dono vazio e arquivo acima do limite produzem erros HTTP documentados.
- A listagem retorna todos os metadados da execução atual sem expor dados internos de armazenamento.
- O download de um documento existente entrega o conteúdo como anexo; identificador ou arquivo inexistente resulta em `404`.
- O backend mantém a separação `routes -> controllers -> services -> repositories` e os testes usam `node:test`.
- Nenhum arquivo é enviado a armazenamento externo; os metadados não são persistidos além da memória do processo.
- O frontend consome os endpoints pelo prefixo `/api` e apresenta os estados essenciais dos fluxos.