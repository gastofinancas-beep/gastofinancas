<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2d2d5371-e20c-48ba-b345-fad87b9906c1

## Configuração de Autenticação Firebase (Domínios Autorizados no Netlify)

Para garantir que o **Google Sign-In** funcione corretamente no Netlify e em dispositivos móveis:

1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Selecione o seu projeto e vá em **Authentication > Configurações (Settings) > Domínios Autorizados (Authorized Domains)**.
3. Adicione o seu domínio do Netlify (ex: `seu-app.netlify.app`) e quaisquer domínios customizados.
4. Sem essa configuração, o Firebase cancela requisições OAuth iniciadas a partir do seu site publicado.


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
