import 'dotenv/config';

export const config = {
  prefix: process.env.PREFIX || '!',
  botName: process.env.BOT_NAME || 'ZapGenius',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  authDir: 'auth_info'
};
