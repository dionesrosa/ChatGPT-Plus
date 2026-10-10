# Instruções para agentes — ChatGPT-Plus

Este diretório contém o userscript **ChatGPT Plus**, desenvolvido por Diones Souza para Tampermonkey. O script detecta o fim da geração de uma resposta no ChatGPT e inicia automaticamente a reprodução de voz da última mensagem.

## Regra principal de compilação

O projeto **não compila diretamente com um bundler local próprio**. A compilação deve ser feita pelo **UserScript-Builder (USB)**, localizado em:

```text
D:\DEV\Tampermonkey\UserScript-Builder
```

O USB é uma ferramenta Node.js de linha de comando. Ele lê o arquivo `userscript.config.json` do projeto atual, usa a entrada indicada em `entry`, gera o bundle JavaScript e acrescenta automaticamente o cabeçalho de metadados do Tampermonkey.

> Sempre execute os comandos a partir da raiz do projeto:
>
> ```text
> D:\DEV\Tampermonkey\ChatGPT-Plus
> ```
>
> O USB procura `userscript.config.json` no diretório de trabalho atual. Executar o comando em outra pasta pode produzir o erro `Arquivo de configuração não encontrado: userscript.config.json`.

## Entrada, configuração e saída

| Item | Caminho ou valor |
|---|---|
| Projeto | `D:\DEV\Tampermonkey\ChatGPT-Plus` |
| Ferramenta de build | `D:\DEV\Tampermonkey\UserScript-Builder` |
| Configuração | `userscript.config.json` |
| Entrada principal | `src/index.js` |
| Bundle ativado | `"bundle": true` |
| Saída gerada | `dist/chatgpt-plus.user.js` |
| Versão atual | Definida no campo `version` de `userscript.config.json` |
| Site atendido | `*://chatgpt.com/*` |

A configuração também contém os metadados do userscript, como nome, descrição, autor, permissões `GM_getValue` e `GM_setValue`, URLs de atualização e download, modo de injeção na página, execução em `document-start` e `noframes: true`.

## Comandos disponíveis no USB

Os comandos principais são os seguintes:

| Comando | Finalidade | Observações |
|---|---|---|
| `usb` | Exibe a ajuda resumida | Mostra os subcomandos disponíveis. |
| `usb build` | Compila o userscript | Gera ou atualiza `dist/chatgpt-plus.user.js`. |
| `usb init` | Inicializa um projeto novo | Não deve ser usado para reconstruir este projeto existente. |
| `usb init --yes` ou `usb init -y` | Inicializa sem confirmação | Aplicável somente à criação de um projeto novo. |
| `usb release patch` | Incrementa a versão de correção | Use para mudanças compatíveis e correções. |
| `usb release minor` | Incrementa a versão menor | Use para novas funcionalidades compatíveis. |
| `usb release major` | Incrementa a versão principal | Use para mudanças incompatíveis. |
| `usb publish` | Publica o build | Exige Git limpo, remoto `origin` e autenticação do GitHub. |
| `usb publish --draft` | Publica como rascunho | O release não fica publicado imediatamente. |
| `usb publish --prerelease` | Publica como pré-release | Marca o release como versão de pré-lançamento. |
| `usb publish --publish-draft` | Publica um draft existente | Use conforme o estado do release no GitHub. |

## Fluxo normal de desenvolvimento

Depois de alterar os arquivos em `src/`, revise o diff e compile o projeto:

```bat
cd /d D:\DEV\Tampermonkey\ChatGPT-Plus
usb build
```

Em um ambiente onde o comando global `usb` não estiver disponível, execute o binário do USB diretamente:

```bat
cd /d D:\DEV\Tampermonkey\ChatGPT-Plus
node D:\DEV\Tampermonkey\UserScript-Builder\bin\usb.js build
```

Após o build, confirme que o arquivo abaixo foi atualizado e contém o cabeçalho do Tampermonkey:

```text
dist\chatgpt-plus.user.js
```

O build não substitui os arquivos-fonte. As alterações de comportamento devem ser feitas em `src/`; `dist/` é o artefato compilado e não deve ser tratado como fonte principal.

## Fluxo de versão e publicação

Para criar uma nova versão, use o nível correto de alteração:

```bat
cd /d D:\DEV\Tampermonkey\ChatGPT-Plus
usb release patch
```

O comando `release` atualiza a versão na configuração, executa o build e cria um commit Git com a nova versão. Antes de executar um release, verifique se as alterações estão corretas e se não existem mudanças não relacionadas que possam ser incluídas no commit.

Para publicar no GitHub Releases:

```bat
cd /d D:\DEV\Tampermonkey\ChatGPT-Plus
usb publish
```

A publicação exige uma árvore de trabalho Git limpa, um remoto `origin` apontando para o repositório correto e autenticação disponível por uma destas opções: `GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_PAT` ou GitHub CLI autenticado com `gh auth login`. O comando envia o branch atual, cria ou atualiza uma tag no formato `vX.Y.Z`, publica o GitHub Release e envia o arquivo `.user.js` gerado em `dist/`.

**Não publique nem crie releases sem solicitação explícita do usuário.** Compilar é uma operação local; publicar altera o repositório remoto.

## Verificações recomendadas para agentes

Antes de editar, verifique o estado do Git:

```bat
cd /d D:\DEV\Tampermonkey\ChatGPT-Plus
git status --short --branch
git log -5 --oneline
```

Depois de editar código:

```bat
cd /d D:\DEV\Tampermonkey\ChatGPT-Plus
usb build
git diff -- src userscript.config.json AGENTS.md
git status --short
```

Este repositório não possui `package.json` próprio; portanto, não presuma que `npm test` ou `npm run build` estejam disponíveis na raiz do ChatGPT-Plus. O comando de compilação oficial é `usb build`. O USB possui seus próprios testes e scripts no projeto `D:\DEV\Tampermonkey\UserScript-Builder`.

## Estrutura relevante

| Caminho | Responsabilidade |
|---|---|
| `src/index.js` | Ponto de entrada do userscript. |
| `src/config/` | Configurações do comportamento do script. |
| `src/core/` | Logger e gerenciamento de estado. |
| `src/monitor/` | Detecção do andamento e do fim da geração. |
| `src/player/` | Reprodução e controles de áudio. |
| `src/synthesis/` | Estratégias de síntese/interceptação de voz. |
| `src/ui/` | Interface e menu do script. |
| `userscript.config.json` | Metadados, permissões, versão, entrada e saída do build. |
| `dist/chatgpt-plus.user.js` | Userscript final compilado para instalação no Tampermonkey. |
| `AGENTS.md` | Este guia operacional para agentes humanos e de IA. |

## Convenções de Git

As mensagens de commit devem ser escritas em português e seguir o padrão Conventional Commits traduzido, conforme `.kiro/steering/git.md`. Os tipos permitidos são `feat`, `fix`, `refactor`, `chore`, `docs`, `style` e `test`.

Exemplo para esta documentação:

```text
docs: documenta fluxo de compilação pelo USB
```

## Resumo rápido para outro agente

1. Trabalhe em `D:\DEV\Tampermonkey\ChatGPT-Plus`.
2. Altere os arquivos-fonte em `src/`, não o bundle como fonte principal.
3. Compile usando `usb build`.
4. Se `usb` não for encontrado, use `node D:\DEV\Tampermonkey\UserScript-Builder\bin\usb.js build`.
5. Confirme o resultado em `dist/chatgpt-plus.user.js`.
6. Não execute `usb release` ou `usb publish` sem autorização explícita.
