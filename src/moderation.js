const ADULT_DOMAINS = [
  'pornhub.com', 'xvideos.com', 'xnxx.com', 'redtube.com',
  'xhamster.com', 'youporn.com', 'onlyfans.com'
];

const HATE_PATTERNS = [
  /\bvolta\s+para\s+a\s+senzala\b/i,
  /\b(?:tem\s+que|deveria)\s+(?:matar|exterminar|eliminar)\s+(?:todos?\s+)?(?:os?\s+)?(?:negros?|judeus?|indigenas?|gays?|pessoas\s+trans)\b/i,
  /\b(?:negros?|judeus?|indigenas?|gays?|pessoas\s+trans)\s+(?:nao\s+deveriam|nao\s+merecem)\s+(?:viver|existir|ter\s+direitos?)\b/i,
  /\b(?:raca\s+inferior|limpeza\s+racial|supremacia\s+racial)\b/i,
  /\b(?:macaco|primata)\b.{0,35}\b(?:negro|preto|negra)\b/i,
  /\b(?:negro|preto|negra)\b.{0,35}\b(?:macaco|primata)\b/i
];

const PORN_PATTERNS = [
  /\b(?:porno|porno\s+explicito|video\s+sexual\s+explicito|sexo\s+explicito)\b/i,
  /\b(?:pack\s+de\s+nudes?|vazou\s+nudes?|nudes?\s+explicitos?)\b/i,
  /\b(?:conteudo\s+adulto|site\s+adulto|video\s+pornografico)\b/i
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
  const inviteLinks = [...normalized.matchAll(/(?:https?:\/\/)?chat\.whatsapp\.com\/([a-z0-9]+)/gi)];
  if (inviteLinks.some(match => match[1] !== (ownInviteCode || '').toLowerCase())) {
    return 'link de convite de outro grupo';
  }
  if (ADULT_DOMAINS.some(domain => normalized.includes(domain))) return 'link de conteúdo adulto';
  if (PORN_PATTERNS.some(pattern => pattern.test(normalized))) return 'conteúdo pornográfico explícito';
  if (HATE_PATTERNS.some(pattern => pattern.test(normalized))) return 'discurso de ódio ou discriminação';
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
