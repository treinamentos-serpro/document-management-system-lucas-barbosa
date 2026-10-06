---
name: dms-smoke-test
description: "Valida uma mudança do DMS com os testes de integração do backend e o build de produção do frontend."
argument-hint: "opcional: resumo da mudança ou caminho principal afetado"
agent: "agent"
tools: [execute, read, search]
---

# Validar o DMS

Valide a mudança `${input:contexto:resumo ou caminho da mudança (opcional)}` sem
alterar código ou dados preexistentes.

1. Confira os scripts em `backend/package.json` e `frontend/package.json`, o
   escopo da mudança e os testes que serão executados.
2. Antes dos testes do backend, inspecione se eles criam arquivos em
   `backend/storage` e se removem com segurança apenas os arquivos criados pelo
   próprio teste. Não apague nem sobrescreva arquivos preexistentes. Se não
   houver limpeza segura, não execute testes que gravem no storage; explique o
   bloqueio e continue apenas com verificações sem esse efeito colateral.
3. Execute separadamente `npm --prefix backend test` e
   `npm --prefix frontend run build`. Não instale dependências nem inicie
   serviços externos.
4. Confira nos testes quais fluxos HTTP foram realmente exercitados, como
   health, upload, listagem, download e respostas de erro. Não envie requisições
   de escrita a servidores em execução nem declare fluxos validados sem
   evidência nos testes.
5. Se `${input:contexto}` indicar uma área específica, relacione os resultados
   àquela mudança e aponte qualquer requisito importante que ficou sem
   verificação.

## Resultado

Resuma o resultado dos testes do backend e do build do frontend, os fluxos HTTP
comprovados pela suíte e quaisquer comandos não executados ou falhas. Não corrija
falhas automaticamente; apresente a evidência e os arquivos envolvidos.