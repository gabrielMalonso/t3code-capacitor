# Handoff — T3 Code Capacitor

Este repositório é uma adaptação pessoal do T3 Code para Android usando Capacitor. Ele não é um
fork completo: o T3 Code original continua no repositório irmão `../t3code`, limpo e acompanhando o
upstream.

As pequenas mudanças de interface para celular ficam em `patches/`. Durante a build,
`scripts/sync-web.mjs` cria uma cópia temporária do T3 Code, aplica esses patches e gera o aplicativo
Android. Nunca faça essas alterações diretamente em `../t3code`.

## O que já foi adaptado

- safe areas e barras do sistema Android;
- tema correto da barra de status;
- ícone roxo do aplicativo;
- Enter quebra a linha e o envio é feito pelo botão;
- o teclado não deve abrir automaticamente ao trocar de chat;
- no celular, o contexto de ambiente, checkout, branch e pull request fica em uma gaveta;
- no header do celular ficam somente Git e o menu de três pontos;
- as gavetas do celular podem expandir e fechar com swipe para baixo.

Essas mudanças de layout devem continuar exclusivas do celular. O tablet já está funcionando bem e
deve manter a interface normal do T3 Code.

## Como continuar

1. Faça as alterações como patches do web client dentro deste repositório.
2. Mantenha `../t3code` limpo.
3. Gere a build com `corepack pnpm build:android`.
4. Atualize o aparelho com `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.

Use sempre `adb install -r`: não desinstale o aplicativo e não limpe seus dados, porque as
credenciais de pareamento ficam no armazenamento privado do app. O `appId`, a assinatura Android e
a origem do Capacitor também devem permanecer iguais entre as versões.

Antes de encerrar uma mudança visual, valide no celular real e confirme que o caminho do tablet não
foi alterado. Não faça commit ou push sem autorização do usuário.
