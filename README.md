# ChatGPT Web Extras

Userscript para o ChatGPT desenvolvido por Diones Souza com Tampermonkey.

[![Licença MIT](https://img.shields.io/badge/licença-MIT-green)](LICENSE)
[![Tampermonkey](https://img.shields.io/badge/Tampermonkey-suportado-orange)](https://www.tampermonkey.net/)

[![Instalar](https://img.shields.io/badge/Instalar-Userscript-blue?style=for-the-badge&logo=Tampermonkey)](https://raw.githubusercontent.com/dionesrosa/ChatGPT-Plus/main/dist/chatgpt-web-extras.user.js)

---

## ✨ O que o script faz

Este userscript detecta automaticamente o fim da geração de uma resposta no ChatGPT e inicia a reprodução de voz da última mensagem.

## 🔧 Funcionalidades

- Detecta o fim da resposta do assistente
- Abre o menu de ações da última mensagem
- Inicia a reprodução automática de voz
- Evita disparos duplicados com controle de estado interno
- Usa fallback para lidar com atrasos da interface

## 🚀 Instalação

1. Instale a extensão [Tampermonkey](https://www.tampermonkey.net/) no navegador.
2. Instale o userscript disponível no link acima.
3. Acesse o ChatGPT normalmente.

## 🖱️ Como usar

O script funciona automaticamente quando a resposta terminar de ser gerada. Não é necessário configurar nada manualmente.

## 🛠️ Compilação com userscript-builder

Para gerar o arquivo final localmente:

```bash
usb build
```

## 🧩 Estrutura do projeto

- [script.js](script.js): lógica principal do userscript
- [userscript.config.json](userscript.config.json): metadados e configuração do build

## 👤 Autor

Diones Souza

## 📜 Licença

MIT