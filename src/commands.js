import { config } from './config.js';
import { askAI } from './ai.js';
import { makeImageSticker } from './stickers.js';

const helpText = (prefix) => [
  '*🤖 ZapGenius — comandos*',
  '',
  prefix + 'menu — mostrar esta lista',
  prefix + 'ping — testar o bot',
  prefix + 'ia sua pergunta — conversar com a IA',
  prefix + 'figurinha — transformar uma imagem respondida em figurinha',
  '',
  '*Administração (somente administradores)*',
  prefix + 'marcar — mencionar participantes do grupo',
  '',
  'Em breve: mais ferramentas de moderação e personalização.'
].join('\n');

function getText(message) {
  const m = message.message;
  return m?.conversation
    || m?.extendedTextMessage?.text
    || m?.imageMessage?.caption
    || m?.videoMessage?.caption
    || '';
}

function isGroupAdmin(metadata, jid) {
  const participant = metadata?.participants?.find(p => p.id === jid);
  return Boolean(participant?.admin || participant?.isAdmin || participant?.isSuperAdmin);
}

function quotedImage(message) {
  const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quoted) return null;
  if (quoted.imageMessage) return { message: { imageMessage: quoted.imageMessage } };
  return null;
}

export async function handleMessage(sock, message) {
  if (!message.message || message.key.fromMe) return;

  const jid = message.key.remoteJid;
  const sender = message.key.participant || message.key.remoteJid;
  const text = getText(message).trim();
  if (!text.startsWith(config.prefix)) return;

  const [rawCommand, ...args] = text.slice(config.prefix.length).trim().split(/\s+/);
  const command = (rawCommand || '').toLowerCase();
  const argument = args.join(' ');

  try {
    if (command === 'menu' || command === 'ajuda') {
      await sock.sendMessage(jid, { text: helpText(config.prefix) }, { quoted: message });
      return;
    }

    if (command === 'ping') {
      await sock.sendMessage(jid, { text: '🏓 Pong! ZapGenius está online.' }, { quoted: message });
      return;
    }

    if (command === 'ia') {
      if (!argument) {
        await sock.sendMessage(jid, { text: 'Escreva sua pergunta depois do comando. Ex.: !ia me explique fotossíntese' }, { quoted: message });
        return;
      }
      const answer = await askAI(argument);
      await sock.sendMessage(jid, { text: answer }, { quoted: message });
      return;
    }

    if (command === 'figurinha' || command === 'sticker') {
      const image = message.message.imageMessage ? message : quotedImage(message);
      if (!image) {
        await sock.sendMessage(jid, { text: 'Envie uma imagem com a legenda !figurinha ou responda à imagem com !figurinha.' }, { quoted: message });
        return;
      }
      const sticker = await makeImageSticker(image);
      await sock.sendMessage(jid, { sticker }, { quoted: message });
      return;
    }

    if (command === 'marcar' || command === 'tagall') {
      if (!jid.endsWith('@g.us')) {
        await sock.sendMessage(jid, { text: 'Esse comando só funciona em grupos.' }, { quoted: message });
        return;
      }
      const metadata = await sock.groupMetadata(jid);
      if (!isGroupAdmin(metadata, sender)) {
        await sock.sendMessage(jid, { text: 'Somente administradores do grupo podem usar esse comando.' }, { quoted: message });
        return;
      }
      const mentions = metadata.participants.map(p => p.id);
      const lines = mentions.map(id => '• @' + id.split('@')[0]);
      await sock.sendMessage(jid, {
        text: '📢 *Atenção, pessoal!*\n' + lines.join('\n'),
        mentions
      }, { quoted: message });
      return;
    }
  } catch (error) {
    console.error('Erro no comando:', error);
    await sock.sendMessage(jid, { text: 'Não consegui concluir esse comando. Tente novamente.' }, { quoted: message }).catch(() => {});
  }
}
