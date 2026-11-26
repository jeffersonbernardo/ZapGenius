import OpenAI from 'openai';
import { config } from './config.js';

let client;

export async function askAI(prompt) {
  if (!config.openaiApiKey) {
    return 'A função de IA ainda não foi configurada. O administrador precisa adicionar OPENAI_API_KEY no arquivo .env.';
  }

  client ??= new OpenAI({ apiKey: config.openaiApiKey });
  const response = await client.responses.create({
    model: config.openaiModel,
    input: [
      { role: 'system', content: 'Você é o ZapGenius, um assistente útil em grupos de WhatsApp. Responda em português brasileiro, de forma curta, educada e segura.' },
      { role: 'user', content: prompt }
    ],
    max_output_tokens: 350
  });

  return response.output_text?.trim() || 'Não consegui gerar uma resposta agora.';
}
