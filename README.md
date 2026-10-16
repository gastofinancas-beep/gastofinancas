# Gastô?

Controle financeiro pessoal: cartões e faturas, carteira com várias contas, caixinhas, divisão de gastos com pessoas, assinaturas e módulos para quem trabalha por conta própria.

App em React + Vite + Tailwind, com Firebase (login e Firestore) e funções no Netlify. Publicado em https://gastofinancas.netlify.app a cada merge na `main`.

## Rodar localmente

```bash
npm install
cp .env.example .env.local   # preencha as variáveis VITE_FIREBASE_*
npm run dev
```

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | servidor local |
| `npm run build` | gera a versão de produção em `dist/` |
| `npm run lint` | confere os tipos (TypeScript) |
| `npm test` | roda os testes das contas de saldo/fatura e da migração de dados |

## Variáveis de ambiente (Netlify)

Veja `.env.example`. As que começam com `VITE_` vão para o navegador: nunca coloque segredos nelas.

- `VITE_FIREBASE_*`: configuração do cliente Firebase (inclui `VITE_FIREBASE_DATABASE_ID`).
- `VITE_PRIVACY_EMAIL`: e-mail do encarregado de dados (LGPD), exibido na Política de Privacidade.
- `VITE_SUPPORT_WHATSAPP` / `VITE_SUPPORT_EMAIL` (opcionais): ligam o link "Ajuda & Suporte" no app.

## Dados e segurança

- Os dados de cada pessoa ficam em `users/{uid}` no Firestore e sincronizam em tempo real por login.
- As regras estão em `firestore.rules` (acesso só do próprio dono; campos de plano só o servidor grava). Publique-as no console do Firebase, no banco usado pelo app.
- `src/lib/firstSyncMerge.ts` faz a migração segura de quem usava só dados locais.

## Login: domínios autorizados

Para o Google Sign-In funcionar no Netlify e no celular: Firebase Console, Authentication, Settings, Authorized domains, e adicione o domínio do Netlify e qualquer domínio próprio.
