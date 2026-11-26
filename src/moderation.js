const ADULT_DOMAINS = [
  'pornhub.com', 'xvideos.com', 'xnxx.com', 'redtube.com',
  'xhamster.com', 'youporn.com', 'onlyfans.com'
];

function getMessageText(message) {
  const m = message.message || {};
  return m.conversation
    || m.extendedTextMessage?.text
    || m.imageMessage?.caption
    || m.videoMessage?.caption
    || m.documentMessage?.caption
    || '';
}

function normalize(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getReason(text, ownInviteCode) {
  const normalized = normalize(text);

  // Só identifica convites reais do WhatsApp; não bloqueia mensagens que apenas mencionem o assunto.
  const inviteLinks = [...normalized.matchAll(/(?:https?:\/\/)?chat\.whatsapp\.com\/([a-z0-9]+)/gi)];
  if (inviteLinks.some(match => match[1] !== (ownInviteCode || '').toLowerCase())) {
    return 'link de convite de outro grupo';
  }

  // Só bloqueia domínios adultos quando aparecem como URL, não quando são citados em uma conversa.
  const urls = normalized.match(/(?:https?:\/\/|www\.)[^\s<>()]+/gi) || [];
  for (const rawUrl of urls) {
    try {
      const parsed = new URL(rawUrl.startsWith('www.') ? 'https://' + rawUrl : rawUrl);
      const hostname = parsed.hostname.replace(/^www\./, '');
      if (ADULT_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
        return 'link para site de conteúdo adulto';
      }
    } catch {
      // Ignora endereços incompletos ou inválidos.
    }
  }

  // Texto sobre ódio ou pornografia não é apagado automaticamente:
  // a detecção por palavras isoladas pode confundir denúncias, notícias e conversas normais.
  return null;
}

export async function moderateGroupMessage(sock, message) {
  const jid = message.key.remoteJid;
  if (!jid?.endsWith('@g.us') || message.key.fromMe) return false;

  const metadata = await sock.groupMetadata(jid);
  const sender = message.key.participant || message.key.remoteJid;
  const senderData = metadata.participants.find(p => p.id === sender);
  if (senderData?.admin || senderData?.isAdmin || senderData?.isSuperAdmin) return false;

  const text = getMessageText(message);
  if (!text) return false;

  let ownInviteCode = '';
  try {
    ownInviteCode = await sock.groupInviteCode(jid);
  } catch {
    // Sem conseguir consultar o convite do grupo, não bloqueia links de convite.
  }

  const reason = getReason(text, ownInviteCode);
  if (!reason) return false;

  const botJids = [sock.user?.id, sock.user?.lid].filter(Boolean).map(id => id.split(':')[0]);
  const botIsAdmin = metadata.participants.some(p =>
    botJids.includes((p.id || '').split(':')[0]) &&
    (p.admin || p.isAdmin || p.isSuperAdmin)
  );
  if (!botIsAdmin) {
    console.warn('Moderação identificou conteúdo, mas o ZapGenius não é administrador do grupo.');
    return false;
  }

  await sock.sendMessage(jid, { delete: message.key });
  await sock.sendMessage(jid, { text: '🛡️ Mensagem removida automaticamente: ' + reason + '.' });
  return true;
}
