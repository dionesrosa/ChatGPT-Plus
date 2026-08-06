---
inclusion: always
---

# Convenções de Git

## Idioma dos commits
Sempre escreva mensagens de commit em **português**, incluindo título e descrição.

## Formato
Siga o padrão Conventional Commits traduzido:

```
<tipo>: <descrição curta em português>

[corpo opcional com mais detalhes]
```

**Tipos permitidos:**
- `feat` – nova funcionalidade
- `fix` – correção de bug
- `refactor` – refatoração sem mudança de comportamento
- `chore` – tarefas de manutenção, dependências, build
- `docs` – alterações em documentação
- `style` – formatação, sem mudança de lógica
- `test` – adição ou correção de testes

## Exemplos
```
feat: adiciona modo player com requisição direta ao backend

refactor: modulariza o código em múltiplos arquivos por responsabilidade

fix: corrige fallback quando token de autorização não está disponível
```
