import { Handler } from '@netlify/functions';
import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';
import * as querystring from 'querystring';
import * as crypto from 'crypto';

// 1. Inicializa o Firebase Admin (apenas uma vez)
if (!getApps().length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountStr) {
      const serviceAccount = JSON.parse(serviceAccountStr);
      initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      console.warn("Aviso: FIREBASE_SERVICE_ACCOUNT não encontrado nas variáveis de ambiente.");
    }
  } catch (error) {
    console.error('Erro ao inicializar o Firebase Admin:', error);
  }
}

const db = getFirestore(getApp(), process.env.FIREBASE_DATABASE_ID || 'ai-studio-financegastos220-81373407-56dc-4fe4-8f86-a49bec9a9867');

// 2. Inicializa a IA do Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function validateTwilioSignature(
  authToken: string,
  twilioSignature: string,
  url: string,
  params: Record<string, string>
): boolean {
  // Sort POST params alphabetically and concatenate key+value pairs to URL
  const sortedKeys = Object.keys(params).sort();
  const paramStr = sortedKeys.map(k => k + params[k]).join('');
  const fullUrl = url + paramStr;

  const expected = crypto
    .createHmac('sha1', authToken)
    .update(fullUrl)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(twilioSignature)
  );
}

export const handler: Handler = async (event, context) => {
  // O Twilio sempre envia as mensagens via POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Validate Twilio signature to prevent spoofed requests
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioSignature = event.headers['x-twilio-signature'] || '';
    const webhookUrl = process.env.WEBHOOK_URL || '';

    if (twilioAuthToken && webhookUrl) {
      const rawParams = querystring.parse(event.body || '') as Record<string, string>;
      const isValid = validateTwilioSignature(twilioAuthToken, twilioSignature, webhookUrl, rawParams);
      if (!isValid) {
        return { statusCode: 403, body: 'Forbidden' };
      }
    }

    // 3. Lê a mensagem enviada pelo Twilio/WhatsApp (vem em formato URL Encoded)
    const body = querystring.parse(event.body || '');
    const incomingMsg = (body.Body as string) || '';
    const sender = (body.From as string) || ''; // Exemplo: "whatsapp:+5511999999999"

    if (!incomingMsg) {
      return generateTwilioResponse('Nenhuma mensagem recebida.');
    }

    // 4. Cria o prompt para a IA classificar a mensagem
    const prompt = `
    Você é um assistente financeiro inteligente. 
    Analise a seguinte mensagem do usuário e extraia os dados da despesa para o aplicativo.
    Responda APENAS com um objeto JSON válido, sem formatação markdown (sem \`\`\`json), contendo:
    - amount: número (valor numérico da despesa, ex: 54.90)
    - description: string (descrição curta do gasto)
    - category: string (uma das categorias: 'alimentacao', 'transporte', 'lazer', 'saude', 'moradia', 'educacao', 'compras', 'servicos', 'outros')
    - type: string (sempre 'unica' para este caso)
    - cardName: string ou null (se o usuário mencionar o nome de um cartão. ex: 'nubank', 'itau', 'inter', 'c6')
    
    Mensagem do usuário: "${incomingMsg}"
    `;

    // 5. Pede para o Gemini processar
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const aiText = response.text || '{}';
    // Limpa possível formatação markdown
    const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(cleanJson);

    // 6. ID do Usuário (Para uso pessoal, configuramos na variável de ambiente)
    const userId = process.env.APP_USER_ID; 

    if (!userId) {
       return generateTwilioResponse('Erro interno: APP_USER_ID não configurado no servidor.');
    }

    const userDocRef = db.collection('users').doc(userId);
    const docSnap = await userDocRef.get();
    const userData = docSnap.exists ? docSnap.data() : {};
    
    // 7. Descobre o Cartão de Crédito se a IA identificou um nome
    let cardId = null;
    let cardTitle = '';
    
    if (parsedData.cardName && userData?.cards) {
      const cards = userData.cards as any[];
      // Procura um cartão que o nome bate com o falado
      const matchedCard = cards.find(c => c.name.toLowerCase().includes(parsedData.cardName.toLowerCase()));
      
      if (matchedCard) {
        cardId = matchedCard.id;
        cardTitle = matchedCard.name;
      }
    }

    // 8. Pega a pessoa principal da conta para atribuir o gasto
    let personId = '1';
    if (userData?.people) {
      const people = userData.people as any[];
      const selfPerson = people.find(p => p.isSelf) || people[0];
      if (selfPerson) {
        personId = selfPerson.id;
      }
    }

    // 9. Data atual no fuso horário de Brasília (sem depender de offset manual)
    const dateStr = new Date().toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).split('/').reverse().join('-'); // Converte DD/MM/YYYY → YYYY-MM-DD

    const expenseData = {
      id: crypto.randomUUID(),
      amount: parsedData.amount || 0,
      description: parsedData.description || 'Gasto via WhatsApp',
      category: parsedData.category || 'outros',
      type: parsedData.type || 'unica',
      date: dateStr,
      startMonthYear: dateStr.substring(0, 7), // "YYYY-MM" — exigido pelo tipo ExpenseItem
      cardId: cardId,
      personId: personId,
      createdAt: new Date().toISOString()
    };

    // 10. Salva direto no Firestore do aplicativo
    const currentExpenses = userData?.expenses || [];
    currentExpenses.push(expenseData);
    await userDocRef.set({ expenses: currentExpenses }, { merge: true });

    // 11. Responde no WhatsApp
    let replyMsg = `✅ Despesa anotada!\n\n💰 Valor: R$ ${expenseData.amount.toFixed(2)}\n🛒 O que: ${expenseData.description}\n🏷️ Categoria: ${expenseData.category}`;
    if (cardTitle) {
      replyMsg += `\n💳 Cartão: ${cardTitle}`;
    } else if (parsedData.cardName) {
       replyMsg += `\n⚠️ Cartão "${parsedData.cardName}" não encontrado, salvo sem cartão.`;
    }

    return generateTwilioResponse(replyMsg);

  } catch (error) {
    console.error('Erro no Webhook do WhatsApp:', error);
    return generateTwilioResponse('Desculpe, não consegui processar esse gasto. Tente mandar novamente de forma mais clara.');
  }
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Função auxiliar para retornar o XML que o Twilio exige
function generateTwilioResponse(message: string) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
    body: `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
  };
}
