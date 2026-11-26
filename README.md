# ZapGenius 🤖

Bot de WhatsApp em desenvolvimento para criação de figurinhas, comandos com IA e ferramentas de grupos.

## O que já existe no código

- Conexão com WhatsApp Web por QR Code.
- Comandos `!menu` e `!ping`.
- Criação de figurinha WebP a partir de imagem.
- Comando `!ia` opcional, usando a API da OpenAI.
- Comando `!marcar`, restrito a administradores do grupo.

## Requisitos

- Node.js 20 ou superior.
- Uma conta WhatsApp para vincular ao bot.
- Chave da API da OpenAI apenas se quiser ativar a função de IA.

## Instalação

1. Baixe ou clone este repositório.
2. Instale as dependências: `npm install`.
3. Copie `.env.example` para `.env`.
4. (Opcional) Adicione sua chave em `OPENAI_API_KEY`.
5. Inicie com `npm start`.
6. Escaneie o QR Code exibido no terminal pelo WhatsApp.

## Comandos

| Comando | Função |
| --- | --- |
| `!menu` | Lista os comandos |
| `!ping` | Testa a conexão |
| `!figurinha` | Converte uma imagem em figurinha |
| `!ia pergunta` | Pergunta à IA (requer chave) |
| `!marcar` | Menciona os participantes (admin do grupo) |

## Segurança e observações

- Nunca envie o arquivo `.env` ou a pasta `auth_info` para o GitHub.
- A sessão do WhatsApp é privada; mantenha-a protegida.
- Esta versão usa Baileys, uma biblioteca comunitária que se conecta pelo WhatsApp Web. Não é uma API oficial da Meta e seu uso pode apresentar risco de desconexão ou restrições na conta.
- A conversão de imagem em figurinha está implementada. Figurinhas com áudio/som não estão implementadas: o suporte e o formato precisam ser confirmados antes de prometer essa função.
- Use automações apenas com autorização dos participantes e sem spam.

## Estado do projeto

🚧 MVP inicial. Testes reais de conexão e envio ainda precisam ser feitos em um ambiente Node.js.
