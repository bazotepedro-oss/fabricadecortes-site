// SEO central da Fábrica dos Cortes: endereço, palavras-chave e páginas por nicho.
// Cada página de nicho vira uma URL própria (/cortes-gta-6, /cortes-de-live...)
// com título, descrição, conteúdo e perguntas frequentes próprios.

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://fabricadecortes.com').replace(/\/$/, '');
export const SITE_NAME = 'Fábrica dos Cortes';
export const DEFAULT_OG_IMAGE = '/banner.jpg';

export const GLOBAL_KEYWORDS = [
  'cortes com ia',
  'fábrica de cortes',
  'fabrica dos cortes',
  'gerador de cortes',
  'cortes virais',
  'cortes para tiktok',
  'cortes para reels',
  'cortes para shorts',
  'cortes de podcast',
  'cortes de live',
  'cortes para streamers',
  'cortes gta 6',
  'legendas automáticas',
  'alternativa ao opus clip',
  'melhores momentos',
  'canal de cortes',
];

export interface NicheFaq {
  q: string;
  a: string;
}

export interface NicheSection {
  title: string;
  body: string;
  bullets?: string[];
}

export interface NichePage {
  slug: string;
  /** Título da aba / resultado do Google (até ~60 caracteres). */
  title: string;
  /** Descrição do resultado do Google (até ~155 caracteres). */
  description: string;
  keywords: string[];
  badge: string;
  h1: string;
  h1Highlight: string;
  lead: string;
  sections: NicheSection[];
  steps: string[];
  faqs: NicheFaq[];
  disclaimer?: string;
  related: string[];
}

const COMMON_STEPS = [
  'Cole o link do YouTube ou envie o arquivo do vídeo.',
  'Escolha quantos cortes quer e a duração de cada um.',
  'A IA transcreve, encontra os melhores momentos e sugere títulos e hashtags.',
  'Receba os cortes em 9:16 com rosto enquadrado e legenda animada, prontos para postar.',
];

export const NICHE_PAGES: NichePage[] = [
  {
    slug: 'cortes-com-ia',
    title: 'Cortes com IA para TikTok, Reels e Shorts | Fábrica dos Cortes',
    description:
      'Gerador de cortes com IA: transforme vídeos longos em cortes verticais com legenda animada e rosto enquadrado. Sem mensalidade, a partir de R$ 19,90 no Pix.',
    keywords: ['cortes com ia', 'ia para cortes', 'gerador de cortes com ia', 'cortar vídeo com ia', 'criar cortes automaticamente'],
    badge: 'Cortes automáticos com IA',
    h1: 'Cortes com IA:',
    h1Highlight: 'do vídeo longo ao corte pronto',
    lead:
      'A Fábrica dos Cortes usa inteligência artificial para assistir o vídeo inteiro por você, encontrar os trechos com mais potencial de viralizar e entregar cada um já editado no formato vertical, com legenda animada e o rosto sempre no quadro.',
    sections: [
      {
        title: 'O que a IA faz no seu lugar',
        body:
          'Editar cortes na mão leva horas: assistir tudo, marcar os momentos, recortar, enquadrar e legendar palavra por palavra. A IA faz essas etapas em sequência e você só revisa o resultado.',
        bullets: [
          'Transcrição completa do áudio com marcação de tempo palavra por palavra.',
          'Escolha dos momentos com gancho forte, começo e fim completos.',
          'Título e hashtags sugeridos para cada corte.',
          'Enquadramento 9:16 automático: um rosto, tela dividida para duas pessoas ou quem está falando.',
          'Legenda animada com destaque na palavra falada.',
        ],
      },
      {
        title: 'Sem mensalidade: você paga por corte',
        body:
          'Em vez de assinatura em dólar, você compra créditos no Pix e usa quando quiser. Cada crédito vale um corte completo e os créditos valem por 365 dias.',
      },
      {
        title: 'Roda no seu computador ou na nuvem',
        body:
          'Com placa de vídeo NVIDIA o processamento é rápido no seu PC. Se o seu computador for mais simples, dá para usar a versão na nuvem pelo Google Colab.',
      },
    ],
    steps: COMMON_STEPS,
    faqs: [
      {
        q: 'Preciso saber editar vídeo para usar?',
        a: 'Não. Você cola o link, escolhe quantos cortes quer e a duração. A edição, o enquadramento e a legenda são feitos automaticamente. Se quiser ajustar depois, dá para exportar o projeto para Premiere ou DaVinci.',
      },
      {
        q: 'A IA escolhe bem os momentos?',
        a: 'A IA analisa a transcrição inteira e procura trechos com gancho, emoção e começo e fim completos. Mesmo assim, recomendamos revisar os cortes antes de postar, como em qualquer ferramenta de IA.',
      },
      {
        q: 'Quanto custa?',
        a: 'Não há mensalidade. Os pacotes começam em R$ 19,90 e cada crédito equivale a um corte completo. Veja todos os pacotes na página de preços.',
      },
    ],
    related: ['cortes-de-podcast', 'cortes-de-live', 'legendas-automaticas', 'alternativa-opus-clip'],
  },
  {
    slug: 'cortes-de-live',
    title: 'Cortes de Live com IA: melhores momentos da sua live | Fábrica dos Cortes',
    description:
      'Transforme lives de horas em cortes para TikTok, Reels e Shorts. A IA encontra os melhores momentos da live, enquadra e legenda. Créditos no Pix, sem mensalidade.',
    keywords: ['cortes de live', 'clipes de live', 'melhores momentos da live', 'cortar live', 'cortes de live com ia'],
    badge: 'Lives longas viram dezenas de cortes',
    h1: 'Cortes de live:',
    h1Highlight: 'horas de transmissão viram cortes prontos',
    lead:
      'Uma live de várias horas tem dezenas de momentos que funcionariam como corte, mas ninguém tem tempo de assistir tudo de novo. A Fábrica dos Cortes lê a live inteira, separa os picos de reação e entrega os cortes já no formato vertical.',
    sections: [
      {
        title: 'Feito para transmissões longas',
        body:
          'A IA trabalha em cima da transcrição completa da live, então consegue comparar momentos do começo ao fim e escolher os melhores, e não só os primeiros minutos.',
        bullets: [
          'Funciona com VODs longos do YouTube ou com o arquivo da live enviado do seu computador.',
          'Cortes de 15 segundos a vários minutos, você escolhe a duração.',
          'Melhores Momentos: um compilado 16:9 para subir no YouTube, com capítulos prontos.',
        ],
      },
      {
        title: 'Reação, risada e virada de jogo',
        body:
          'Os melhores cortes de live costumam ser reações fortes, momentos engraçados e viradas. O prompt da IA prioriza trechos com pico de emoção e com começo e fim completos, para o corte fazer sentido sozinho.',
      },
      {
        title: 'Legenda e enquadramento automáticos',
        body:
          'A webcam vira o centro do vídeo vertical e a legenda animada acompanha a fala. Você posta direto ou ajusta no seu editor.',
      },
    ],
    steps: COMMON_STEPS,
    faqs: [
      {
        q: 'Funciona com live da Twitch ou da Kick?',
        a: 'Você pode baixar o VOD da sua live e enviar o arquivo pelo modo "Usar Vídeo". Links do YouTube podem ser colados direto.',
      },
      {
        q: 'Quantos cortes dá para tirar de uma live?',
        a: 'Você escolhe. Em lives longas é comum pedir de 5 a 20 cortes por vez. Cada corte entregue usa 1 crédito.',
      },
      {
        q: 'E se eu quiser um vídeo com os melhores momentos da live inteira?',
        a: 'Use o Melhores Momentos: a IA monta um compilado em 16:9 para o YouTube, com legenda SRT, título, descrição e capítulos.',
      },
    ],
    related: ['cortes-para-streamers', 'cortes-gta-6', 'cortes-com-ia', 'canal-de-cortes'],
  },
  {
    slug: 'cortes-gta-6',
    title: 'Cortes de GTA 6 com IA para TikTok e Shorts | Fábrica dos Cortes',
    description:
      'Crie cortes de GTA 6 (GTA VI) a partir de gameplays e lives: a IA acha as melhores reações, enquadra a webcam e legenda. Sem mensalidade, créditos no Pix.',
    keywords: ['cortes gta 6', 'gta 6 cortes', 'clipes gta 6', 'gta vi', 'canal de cortes gta 6', 'gta 6 tiktok'],
    badge: 'Gameplay e lives de GTA 6',
    h1: 'Cortes de GTA 6:',
    h1Highlight: 'das lives de gameplay para o TikTok',
    lead:
      'Com o lançamento de GTA 6, as lives de gameplay ficaram enormes e cheias de reações. A Fábrica dos Cortes transforma essas transmissões em cortes curtos com a reação do streamer em destaque, legenda animada e título sugerido.',
    sections: [
      {
        title: 'Por que cortes de GTA 6 funcionam',
        body:
          'Quem não assistiu a live quer ver os momentos mais marcantes: a primeira cena, uma reviravolta da história, um bug engraçado, a reação a um gráfico absurdo. São exatamente esses picos que a IA procura na transcrição.',
        bullets: [
          'Reações do streamer ao descobrir algo novo no jogo.',
          'Momentos engraçados, falhas e perseguições.',
          'Viradas da história e cenas marcantes comentadas ao vivo.',
        ],
      },
      {
        title: 'Webcam e jogo no mesmo corte',
        body:
          'O enquadramento automático segue o rosto do streamer para o vídeo vertical. Lives longas de várias horas funcionam normalmente.',
      },
      {
        title: 'Respeite o criador original',
        body:
          'Se você corta lives de outros streamers, use canais e programas de cortes autorizados pelo criador e dê o crédito no vídeo. Isso protege seu canal de denúncias.',
      },
    ],
    steps: COMMON_STEPS,
    faqs: [
      {
        q: 'Funciona com lives de GTA 6 de muitas horas?',
        a: 'Sim. A IA lê a transcrição inteira e escolhe os melhores momentos de qualquer parte da live.',
      },
      {
        q: 'Posso cortar a live de outro streamer?',
        a: 'Faça isso só com autorização do criador (muitos têm programas oficiais de cortes) e sempre dando o crédito. A ferramenta faz o corte, mas a responsabilidade pelo uso do conteúdo é de quem publica.',
      },
      {
        q: 'Os cortes saem com legenda?',
        a: 'Sim, com legenda animada que destaca a palavra falada, em vídeo vertical 9:16 pronto para TikTok, Reels e Shorts.',
      },
    ],
    disclaimer:
      'GTA, Grand Theft Auto e GTA VI são marcas de seus respectivos donos. A Fábrica dos Cortes não é afiliada, associada nem patrocinada pela Rockstar Games ou pela Take-Two Interactive.',
    related: ['cortes-de-live', 'cortes-para-streamers', 'canal-de-cortes', 'cortes-com-ia'],
  },
  {
    slug: 'cortes-para-streamers',
    title: 'Cortes para Streamers: clipes da sua live com IA | Fábrica dos Cortes',
    description:
      'Ferramenta de cortes para streamers: transforme suas lives em clipes verticais com a webcam enquadrada e legenda animada para crescer no TikTok, Reels e Shorts.',
    keywords: ['cortes para streamers', 'clipes para streamers', 'cortes de stream', 'crescer na twitch', 'clipes da live para tiktok'],
    badge: 'Para quem faz live',
    h1: 'Cortes para streamers:',
    h1Highlight: 'sua live trabalhando enquanto você descansa',
    lead:
      'Os cortes são a principal porta de entrada de novos espectadores para quem faz live. Com a Fábrica dos Cortes você transforma cada transmissão em vários clipes verticais sem precisar de editor.',
    sections: [
      {
        title: 'Mais alcance com o mesmo conteúdo',
        body:
          'Uma live vista por centenas de pessoas pode virar cortes vistos por milhares nas redes. A IA separa os momentos que funcionam fora da live e entrega tudo pronto para postar.',
        bullets: [
          'Webcam enquadrada automaticamente no vídeo vertical.',
          'Tela dividida quando duas pessoas aparecem.',
          'Legenda animada, título e hashtags sugeridos.',
        ],
      },
      {
        title: 'Sem editor e sem mensalidade',
        body:
          'Você compra créditos no Pix e usa quando fizer live. Cada crédito vale um corte e os créditos valem por 365 dias.',
      },
    ],
    steps: COMMON_STEPS,
    faqs: [
      {
        q: 'Funciona para live de qualquer jogo ou bate-papo?',
        a: 'Sim. A IA trabalha com a fala da live, então funciona para gameplay, bate-papo, react e podcast ao vivo.',
      },
      {
        q: 'Preciso de um PC potente?',
        a: 'Com placa de vídeo NVIDIA o processamento é rápido no seu PC. Se o seu computador for simples, use a versão na nuvem pelo Google Colab.',
      },
      {
        q: 'Posso contratar editores e usar a mesma conta?',
        a: 'A licença é pessoal. Para equipes e agências, os pacotes maiores têm o menor custo por corte.',
      },
    ],
    related: ['cortes-de-live', 'cortes-gta-6', 'legendas-automaticas', 'cortes-com-ia'],
  },
  {
    slug: 'cortes-de-podcast',
    title: 'Cortes de Podcast com IA para Reels e Shorts | Fábrica dos Cortes',
    description:
      'Transforme episódios de podcast em cortes virais com IA: tela dividida para dois convidados, legenda animada e compilado Melhores Momentos para o YouTube.',
    keywords: ['cortes de podcast', 'cortar podcast', 'podcast para reels', 'clipes de podcast', 'cortes de podcast com ia'],
    badge: 'Podcasts e entrevistas',
    h1: 'Cortes de podcast:',
    h1Highlight: 'cada episódio vira uma semana de conteúdo',
    lead:
      'Um episódio de uma ou duas horas rende vários cortes fortes. A Fábrica dos Cortes encontra as falas mais marcantes, enquadra quem está falando e entrega os cortes com legenda, além de um compilado 16:9 para o YouTube.',
    sections: [
      {
        title: 'Feito para conversa',
        body:
          'Podcast tem duas ou mais pessoas na tela. O enquadramento automático divide a tela quando há dois rostos e pode seguir quem está falando.',
        bullets: [
          'Tela dividida automática para dois convidados.',
          'Modo "quem está falando" (experimental).',
          'Legenda animada sincronizada palavra por palavra.',
        ],
      },
      {
        title: 'Melhores Momentos para o YouTube',
        body:
          'Além dos cortes verticais, a IA monta um compilado horizontal com os trechos mais fortes do episódio, com legenda SRT, título, descrição e capítulos prontos.',
      },
    ],
    steps: COMMON_STEPS,
    faqs: [
      {
        q: 'Funciona com podcast em vídeo do YouTube?',
        a: 'Sim. Cole o link do episódio ou envie o arquivo. Se o YouTube já tiver legenda, a transcrição fica ainda mais rápida.',
      },
      {
        q: 'Quantos créditos custa o compilado Melhores Momentos?',
        a: 'Cada compilado custa 10 créditos, cobrados só quando o vídeo fica pronto.',
      },
      {
        q: 'Posso traduzir as legendas?',
        a: 'Sim, há opção de traduzir a legenda para outro idioma na hora de gerar os cortes.',
      },
    ],
    related: ['cortes-com-ia', 'legendas-automaticas', 'canal-de-cortes', 'alternativa-opus-clip'],
  },
  {
    slug: 'legendas-automaticas',
    title: 'Legendas Automáticas Animadas para Reels, TikTok e Shorts | Fábrica dos Cortes',
    description:
      'Legenda automática animada com destaque na palavra falada, no estilo dos cortes virais. Gere cortes verticais já legendados com IA, sem mensalidade.',
    keywords: ['legendas automáticas', 'legenda animada', 'legenda para reels', 'legenda automática tiktok', 'legenda estilo hormozi'],
    badge: 'Legenda que prende a atenção',
    h1: 'Legendas automáticas:',
    h1Highlight: 'animadas e sincronizadas palavra por palavra',
    lead:
      'A maioria das pessoas assiste vídeos curtos sem som. Por isso a legenda é parte do corte, não um detalhe. A Fábrica dos Cortes transcreve o áudio e gera a legenda animada já queimada no vídeo vertical.',
    sections: [
      {
        title: 'Estilo de corte viral',
        body:
          'A palavra falada ganha destaque de cor e tamanho, em blocos curtos e fáceis de ler no celular.',
        bullets: [
          'Fontes, cores, contorno e posição personalizáveis.',
          'Destaque na palavra falada ou frase inteira.',
          'Tradução da legenda para outros idiomas.',
          'Editor para corrigir alguma palavra antes de exportar.',
        ],
      },
      {
        title: 'Transcrição precisa',
        body:
          'A transcrição usa o modelo Whisper com alinhamento palavra por palavra, o que deixa a legenda sincronizada com a fala.',
      },
    ],
    steps: COMMON_STEPS,
    faqs: [
      {
        q: 'Funciona em português?',
        a: 'Sim, a transcrição funciona em português e em vários outros idiomas.',
      },
      {
        q: 'Dá para mudar a fonte e a cor?',
        a: 'Sim. Você escolhe fonte, tamanho, cor do destaque, contorno e posição da legenda.',
      },
      {
        q: 'Posso só legendar um vídeo que já cortei?',
        a: 'Sim, envie o vídeo pelo modo "Usar Vídeo" e gere a versão legendada.',
      },
    ],
    related: ['cortes-com-ia', 'cortes-de-podcast', 'cortes-para-streamers', 'alternativa-opus-clip'],
  },
  {
    slug: 'alternativa-opus-clip',
    title: 'Alternativa ao Opus Clip em Português, sem mensalidade | Fábrica dos Cortes',
    description:
      'Procurando uma alternativa ao Opus Clip? A Fábrica dos Cortes cria cortes com IA em português, com pagamento por crédito no Pix e sem assinatura em dólar.',
    keywords: ['alternativa ao opus clip', 'opus clip em português', 'opus clip brasileiro', 'concorrente opus clip', 'opus clip pix'],
    badge: 'Feito no Brasil, pago no Pix',
    h1: 'Alternativa ao Opus Clip:',
    h1Highlight: 'cortes com IA sem assinatura em dólar',
    lead:
      'Ferramentas como o Opus Clip cobram assinatura mensal em dólar e limitam minutos de processamento. A Fábrica dos Cortes funciona por créditos comprados no Pix, com suporte em português.',
    sections: [
      {
        title: 'O que muda na prática',
        body: 'Você paga pelos cortes que fizer, sem cobrança recorrente no cartão.',
        bullets: [
          'Pagamento por crédito no Pix, sem mensalidade.',
          'Créditos válidos por 365 dias.',
          'Suporte em português pelo WhatsApp.',
          'Processamento no seu PC ou na nuvem.',
          'Exportação para Premiere Pro e DaVinci Resolve.',
        ],
      },
      {
        title: 'Os mesmos recursos que você procura',
        body:
          'Escolha de momentos com IA, enquadramento vertical automático, legenda animada e títulos sugeridos, além do compilado Melhores Momentos para o YouTube.',
      },
    ],
    steps: COMMON_STEPS,
    faqs: [
      {
        q: 'É mais barato que o Opus Clip?',
        a: 'Depende de quanto você usa. Como não há mensalidade, quem produz em ritmo variável costuma gastar menos. Os pacotes começam em R$ 19,90.',
      },
      {
        q: 'Tem marca d’água?',
        a: 'A marca d’água é opcional e você pode desativá-la na hora de gerar os cortes.',
      },
      {
        q: 'Preciso de cartão de crédito?',
        a: 'Não. O pagamento é feito no Pix e a licença chega na hora.',
      },
    ],
    related: ['cortes-com-ia', 'legendas-automaticas', 'cortes-de-podcast', 'canal-de-cortes'],
  },
  {
    slug: 'canal-de-cortes',
    title: 'Como Criar um Canal de Cortes com IA | Fábrica dos Cortes',
    description:
      'Monte seu canal de cortes (inclusive canal dark) com IA: escolha de momentos, enquadramento vertical e legenda automática para postar todo dia no TikTok, Reels e Shorts.',
    keywords: ['canal de cortes', 'canal dark de cortes', 'como fazer cortes', 'criar canal de cortes', 'cortes para canal dark'],
    badge: 'Produção em volume',
    h1: 'Canal de cortes:',
    h1Highlight: 'produza todo dia sem passar o dia editando',
    lead:
      'Canal de cortes cresce com constância: postar vários vídeos por dia, todos os dias. A Fábrica dos Cortes automatiza a parte pesada para você focar em escolher bons vídeos de origem e publicar.',
    sections: [
      {
        title: 'Fluxo de produção',
        body: 'Um vídeo longo vira um lote de cortes em uma única execução.',
        bullets: [
          'Escolha o vídeo de origem (podcast, live, entrevista).',
          'Gere de 5 a 20 cortes de uma vez.',
          'Revise na Biblioteca, aprove os melhores e exporte.',
          'Poste com o título e as hashtags sugeridos.',
        ],
      },
      {
        title: 'Use conteúdo com permissão',
        body:
          'Os canais de cortes que duram trabalham com criadores que autorizam cortes (muitos têm programas oficiais) e sempre dão crédito. Isso evita derrubadas e denúncias.',
      },
      {
        title: 'Custo previsível',
        body:
          'Nos pacotes maiores o custo cai para menos de R$ 0,60 por corte, sem mensalidade. Bom para quem posta em volume.',
      },
    ],
    steps: COMMON_STEPS,
    faqs: [
      {
        q: 'Dá para ganhar dinheiro com canal de cortes?',
        a: 'Muitos canais monetizam com programas de parceria das plataformas e campanhas de cortes pagas pelos criadores. Os resultados dependem do nicho, da constância e da qualidade, e não há garantia de ganhos.',
      },
      {
        q: 'Quantos cortes por dia consigo produzir?',
        a: 'Depende do seu computador. Com placa de vídeo NVIDIA, um lote de cortes sai em minutos; na nuvem também funciona.',
      },
      {
        q: 'Qual pacote é melhor para canal de cortes?',
        a: 'Para volume, os pacotes Escala (120 cortes) e Agência (250 cortes) têm o menor custo por corte.',
      },
    ],
    related: ['cortes-com-ia', 'cortes-gta-6', 'cortes-de-live', 'alternativa-opus-clip'],
  },
];

export function getNichePage(slug: string): NichePage | undefined {
  return NICHE_PAGES.find((page) => page.slug === slug);
}

export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
