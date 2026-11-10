import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const revalidate = 0;

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-20">
        <div className="mb-6 inline-flex items-center gap-2.5 rounded-2xl border border-brand/30 bg-surface/90 px-4 py-2 shadow-[0_0_25px_rgba(255,92,0,0.25)] backdrop-blur-md">
          <img
            src="/logo.png"
            alt="Fábrica dos Cortes"
            className="h-6 w-6 rounded-lg object-contain drop-shadow-[0_0_12px_rgba(255,92,0,0.6)]"
          />
          <span className="text-sm font-black text-white">
            Fábrica dos <span className="text-brand">Cortes</span>
          </span>
        </div>

        <h1 className="font-display text-3xl font-extrabold text-text-primary md:text-4xl">
          Termos de <span className="text-brand">uso</span>
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          Última atualização: 9 de novembro de 2026.
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-text-secondary">
          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">1. Quem somos</h2>
            <p className="mt-2">
              A Fábrica dos Cortes é operada sob o CNPJ 59.155.448/0001-27 e disponibiliza o site{' '}
              <a href="https://www.fabricadecortes.com" className="text-brand hover:underline">
                fabricadecortes.com
              </a>
              , o software Fábrica dos Cortes, os pacotes de créditos e, quando adquirida, a Área de Membros com o curso
              de edição.
            </p>
            <p className="mt-2">
              Ao comprar créditos, contratar o curso ou utilizar o software, você declara que leu, entendeu e aceitou
              estes Termos de Uso e a Política de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">2. O que você está comprando</h2>
            <p className="mt-2">
              A Fábrica dos Cortes é um software de edição automática de vídeos com inteligência artificial. O produto é
              composto por:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>licença de uso do software no computador do cliente;</li>
              <li>créditos pré-pagos para gerar cortes;</li>
              <li>quando contratado, acesso à Área de Membros e ao curso de edição cinematográfica.</li>
            </ul>
            <p className="mt-2">
              O curso e a Área de Membros são um produto educacional opcional, adquirido separadamente por meio do
              order bump no checkout. A compra apenas dos créditos não inclui o curso.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">3. Créditos, planos e pagamento</h2>
            <p className="mt-2">
              A venda é feita por pacotes de créditos pré-pagos, com pagamento único via Pix. Não existe mensalidade,
              renovação automática, fidelidade ou cobrança recorrente.
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li><strong className="text-text-primary">1 crédito = 1 corte gerado com sucesso.</strong></li>
              <li>Os créditos são válidos por 365 dias a partir da confirmação do pagamento.</li>
              <li>Os créditos são pessoais e não podem ser transferidos, vendidos ou compartilhados.</li>
              <li>O pagamento é processado pela AbacatePay. O pedido é liberado após a confirmação do Pix.</li>
              <li>Os preços são exibidos em reais e podem ser alterados. O valor cobrado é o do momento da compra.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">4. Licença de uso</h2>
            <p className="mt-2">
              A licença é pessoal, intransferível e vinculada a <strong className="text-text-primary">1 computador</strong>,
              identificado por um código técnico (HWID). Para trocar de computador, solicite o desvínculo ao suporte.
              Podemos limitar trocas para evitar compartilhamento indevido.
            </p>
            <p className="mt-2">
              É proibido compartilhar a chave, revender a licença, sublicenciar, copiar o software, fazer engenharia
              reversa ou contornar os mecanismos de validação, salvo quando a lei permitir expressamente.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">5. Entrega e acesso</h2>
            <p className="mt-2">
              Após a confirmação do pagamento, enviamos para o e-mail cadastrado a chave de licença, o saldo de créditos e
              as instruções de instalação. Quando o curso for incluído na compra, também enviamos o login e a senha
              temporária da Área de Membros. A liberação normalmente ocorre em poucos minutos; se houver instabilidade no
              Pix ou no provedor, pode levar mais tempo.
            </p>
            <p className="mt-2">
              O cliente é responsável por informar um e-mail válido e por manter o acesso ao endereço cadastrado.
            </p>
          </section>

          <section id="reembolso" className="scroll-mt-24">
            <h2 className="font-display text-xl font-semibold text-text-primary">6. Garantia e reembolso</h2>
            <p className="mt-2">
              Você tem <strong className="text-text-primary">7 dias corridos</strong> a partir da compra para exercer o
              direito de arrependimento previsto no artigo 49 do Código de Defesa do Consumidor.
            </p>
            <p className="mt-2">
              Para solicitar o reembolso, envie um e-mail para{' '}
              <a href="mailto:contato@fabricadecortes.com" className="text-brand hover:underline">
                contato@fabricadecortes.com
              </a>{' '}
              com o e-mail usado na compra e o ID do pedido. O reembolso será feito via Pix para a mesma titularidade, em
              até 10 dias úteis após a confirmação dos dados.
            </p>
            <p className="mt-2">
              Após o prazo de 7 dias, não haverá reembolso por créditos não utilizados, salvo falha comprovada do produto
              ou obrigação legal. Se o software apresentar defeito, o suporte tentará corrigir; não sendo possível, será
              aplicada a solução prevista na legislação consumerista.
            </p>
            <p className="mt-2">
              O curso e a Área de Membros, quando adquiridos, seguem a mesma garantia de 7 dias. Após esse prazo, o acesso
              é considerado consumido, salvo falha de entrega do conteúdo.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">7. Uso permitido e conteúdo</h2>
            <p className="mt-2">
              Você é o único responsável pelos vídeos que envia ou processa. É proibido usar a ferramenta para conteúdo
              ilegal, que viole direitos autorais, privacidade, imagem ou honra de terceiros, bem como para deepfakes ou
              conteúdo íntimo não consensual.
            </p>
            <p className="mt-2">
              Você mantém os direitos sobre os vídeos de entrada e sobre os cortes gerados. Você nos concede apenas a
              licença técnica necessária para processar o material durante o uso do software.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">8. Suporte</h2>
            <p className="mt-2">
              O suporte é feito em português pelo e-mail{' '}
              <a href="mailto:contato@fabricadecortes.com" className="text-brand hover:underline">
                contato@fabricadecortes.com
              </a>{' '}
              e pelo grupo de WhatsApp informado na compra. O suporte ajuda com instalação, ativação, licença e uso do
              software; não inclui edição manual dos seus vídeos.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">9. Propriedade intelectual</h2>
            <p className="mt-2">
              O software, a marca, o layout do site, os textos, os vídeos do curso e os materiais da Área de Membros são
              protegidos por direitos autorais e pertencem à Fábrica dos Cortes ou aos seus licenciantes. É proibido
              redistribuir, revender ou publicar esse conteúdo sem autorização.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">10. Limitação de responsabilidade</h2>
            <p className="mt-2">
              A Fábrica dos Cortes é uma ferramenta de produção. Não garantimos viralização, número de visualizações,
              seguidores, engajamento ou receita. Resultados dependem do conteúdo, do nicho, da estratégia e de fatores
              das plataformas.
            </p>
            <p className="mt-2">
              Não somos responsáveis por bloqueios, suspensões ou penalidades aplicadas por TikTok, Instagram, YouTube ou
              outras plataformas, nem por perda de arquivos. Recomendamos manter backup dos seus vídeos e projetos.
            </p>
            <p className="mt-2">
              Na máxima extensão permitida pela lei, nossa responsabilidade total fica limitada ao valor efetivamente pago
              pelo produto adquirido.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">11. Privacidade</h2>
            <p className="mt-2">
              O tratamento de dados pessoais é descrito na{' '}
              <a href="/privacidade" className="text-brand hover:underline">
                Política de Privacidade
              </a>
              , que faz parte destes Termos.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">12. Alterações</h2>
            <p className="mt-2">
              Podemos atualizar estes Termos para refletir mudanças no produto, na legislação ou nos serviços. A versão
              vigente é sempre a publicada nesta página, com a data de atualização no topo. Mudanças relevantes serão
              comunicadas pelos canais de suporte.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">13. Legislação e foro</h2>
            <p className="mt-2">
              Estes Termos são regidos pelas leis brasileiras, em especial pelo Código de Defesa do Consumidor e pela Lei
              Geral de Proteção de Dados (LGPD). Fica eleito o foro do domicílio do consumidor para dirimir controvérsias,
              quando aplicável.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">14. Contato</h2>
            <p className="mt-2">
              Fábrica dos Cortes — CNPJ 59.155.448/0001-27
              <br />
              E-mail:{' '}
              <a href="mailto:contato@fabricadecortes.com" className="text-brand hover:underline">
                contato@fabricadecortes.com
              </a>
              <br />
              Site:{' '}
              <a href="https://www.fabricadecortes.com" className="text-brand hover:underline">
                www.fabricadecortes.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
