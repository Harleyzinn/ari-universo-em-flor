# Ari, meu universo em flor

Um presente estático, leve e sem rastreamento. Uma luz revela uma constelação, os traços crescem em flores e o jardim se torna um coração. São 14 recados, uma estrela secreta, uma flor extra e uma carta. A narrativa dura 75 segundos de tempo ativo. Sem áudio ou dependências externas durante a visita.

## Personalizar

Edite **`src/personalizacao.js`**: apelido, abertura, 14 recados, segredo, carinho extra, texto final, carta, assinatura, paleta e duração em milissegundos. A composição tem 14 flores; preserve os 14 itens. Não há campos vazios na versão padrão. A carta padrão tem aproximadamente 220 palavras.

Depois de editar, envie um commit para `main`. O workflow `.github/workflows/pages.yml` faz o build e publica automaticamente. Acompanhe a aba **Actions** do repositório. A publicação deve usar **Settings → Pages → Source → GitHub Actions**.

```sh
npm ci
npm run build
npm run dev
```

Abra `http://127.0.0.1:4173`. A pasta publicada é `dist/`. Os assets usam caminhos relativos, inclusive sob o subdiretório do repositório. `SITE_URL` configura os metadados da prévia; o workflow define a URL automaticamente. `public/preview.svg` é a fonte da prévia e `public/preview.png` é a imagem pronta de compartilhamento. Não contém a surpresa completa.

## Funcionamento

Uma única linha do tempo com `requestAnimationFrame` governa a narrativa. Pausa manual, recado aberto, diálogo, aba oculta e `pagehide` suspendem o avanço. `pageshow` retoma sem acumular tempo oculto. Anterior/próximo permitem ler todos os recados mesmo antes da revelação das respectivas flores. O botão de voltar ao jardim retoma a narrativa, respeitando uma pausa manual anterior. “Revelar tudo” conclui o jardim; “Recomeçar” volta à abertura sem duplicar elementos. A flor extra é única e pode ser relida.

Os desenhos são SVG próprios e os textos são HTML. Os recados não são anunciados automaticamente por leitor de tela; as flores têm nomes acessíveis. Os diálogos têm foco contido, Escape, fechamento acessível e rolagem interna. A navegação funciona por teclado. Flores abertas ganham uma marca ✓, além de seu nome acessível. “Ler todos os recados” está disponível desde a abertura, inclusive segredo e extra.

## Compatibilidade

JavaScript compilado explicitamente com esbuild para `safari15`. SVG inline, traços, opacity e transform, sem filtros, WebGL, vídeo, bibliotecas de interface ou fontes remotas. `100svh`, `env(safe-area-inset-*)`, `:focus-visible` e overscroll são melhorias progressivas: há altura normal, fluxo vertical, padding e foco nativo como alternativas. O layout não usa uma altura de tela fixa. Sem `dialog`, View Transitions, módulos no navegador, APIs de arquivos ou áudio. Mudanças de orientação alteram somente o CSS e preservam o estado.

Referências consultadas:

- [Apple: Safari 15](https://developer.apple.com/documentation/safari-release-notes/safari-15-release-notes)
- [WebKit: reduced motion](https://webkit.org/blog/7551/responsive-design-for-motion/)
- [MDN: requestAnimationFrame e compatibilidade](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)
- [MDN: unidades de comprimento e compatibilidade](https://developer.mozilla.org/en-US/docs/Web/CSS/length)
- [GitHub Pages: workflow personalizado](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Verificações

Testes automatizados com Playwright, Chromium (Edge) e WebKit 26.5 para Windows, além de inspeção visual de screenshots:

- 320, 375 e 414 CSS px; telas baixas; 667 × 375 em orientação horizontal.
- Sem overflow horizontal. Corpo em fluxo normal permite rolar com as barras do navegador visíveis.
- Linha do tempo inteira de 75 segundos com relógio de animação controlado; pausa e retomada; aba oculta simulada sem avanço; volta ao estado anterior.
- Abertura e fechamento das 14 flores; anterior/próximo; todos os recados desde o início; estrela; extra repetido sem multiplicação de flores.
- Carta longa com rolagem interna, fechar visível, foco contido, Tab e Escape.
- Reinício, revelação completa, movimento reduzido e layout com fonte raiz ampliada.
- Build de produção com alvo Safari 15. Nenhum erro JavaScript nos testes.
- Conexão lenta simulada no Chromium: latência de 400 ms e download de 16 KB/s; iniciar por toque, revelar, abrir e fechar a carta. O botão inicial aguarda a preparação do desenho.

`scripts/check.mjs` permite repetir os testes com Playwright instalado à parte (`PLAYWRIGHT_PATH` opcional). `TEST_URL` permite testar o endereço publicado. Screenshots e resultados locais ficam em `test-results/`, ignorados no Git.

`scripts/verify-public.mjs` compara SHA-256 de seis arquivos publicados com o build local e verifica o fluxo por toque com conexão lenta simulada. Execute após `npm run build`, com `TEST_URL` apontando para o site.

**Limitações:** WebKit no Windows é um motor atual de teste, não Safari 15. Não houve teste em iPhone físico, simulação real das barras dinâmicas do Safari, VoiceOver ou suspensão do processo pelo iOS. A troca de aba foi simulada com os eventos correspondentes. O teste de aumento de fonte raiz não substitui todos os ajustes de acessibilidade do iOS. Um teste no aparelho dela continua sendo útil.

## Privacidade

A página do GitHub Pages é pública e pode ser aberta por qualquer pessoa com o endereço, além de poder ser descoberta por terceiros. O código deste repositório público também pode ser lido por qualquer pessoa; a visibilidade do código segue a configuração do repositório. Não inclua segredos nem detalhes íntimos que não queira publicar. Sem analytics, formulários, fotos, cookies ou armazenamento de dados pessoais.
