import makeWASocket, {
  Browsers,
  DisconnectReason,
  useMultiFileAuthState
} from 'baileys';
import qrcode from 'qrcode-terminal';
import { handleMessage } from './commands.js';
import { config } from './config.js';

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(config.authDir);
  const sock = makeWASocket({
    auth: state,
    browser: Browsers.ubuntu(config.botName),
    markOnlineOnConnect: false,
    syncFullHistory: false
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('\nEscaneie este QR Code pelo WhatsApp:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') console.log('✅ ' + config.botName + ' conectado ao WhatsApp!');
    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode;
      if (status === DisconnectReason.loggedOut) {
        console.error('Sessão encerrada. Apague auth_info e conecte novamente.');
        return;
      }
      console.log('Conexão perdida. Tentando reconectar...');
      setTimeout(() => startBot().catch(console.error), 3000);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const message of messages) {
      await handleMessage(sock, message);
    }
  });
}

startBot().catch(error => {
  console.error('Falha ao iniciar o ZapGenius:', error);
  process.exitCode = 1;
});
