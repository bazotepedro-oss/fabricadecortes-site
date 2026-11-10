import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const revalidate = 0;

export default function PrivacidadePage() {
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

        <h1 className="font-display text-3xl font-bold text-text-primary md:text-4xl">
          Política de <span className="text-brand">privacidade</span>
        </h1>
        <p className="mt-3 text-sm text-text-secondary">
          Última atualização: 9 de novembro de 2026.
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-text-secondary">
          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">1. Quem controla seus dados</h2>
            <p className="mt-2">
              A Fábrica dos Cortes, CNPJ 59.155.448/0001-27, é a controladora dos dados pessoais tratados no site{' '}
              <a href="https://www.fabricadecortes.com" className="text-brand hover:underline">
                fabricadecortes.com
              </a>
              , no checkout, na Área de Membros e no software.
            </p>
            <p className="mt-2">
              Contato do encarregado de dados / privacidade:{' '}
              <a href="mailto:contato@fabricadecortes.com" className="text-brand hover:underline">
                contato@fabricadecortes.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">2. Quais dados coletamos</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li><strong className="text-text-primary">Cadastro e compra:</strong> nome, e-mail, telefone (opcional) e dados do pedido.</li>
              <li><strong className="text-text-primary">Pagamento:</strong> dados necessários para gerar o Pix e confirmar o pagamento, processados pela AbacatePay.</li>
              <li><strong className="text-text-primary">Licença e uso:</strong> chave de licença, créditos, status da licença, data de expiração e um código técnico do computador (hash HWID) usado para validar a licença.</li>
              <li><strong className="text-text-primary">Acesso ao site:</strong> endereço IP, data e hora, navegador e dados de segurança para prevenir fraude e abuso.</li>
              <li><strong className="text-text-primary">Comunicação:</strong> mensagens enviadas ao suporte por e-mail ou WhatsApp.</li>
              <li><strong className="text-text-primary">Cookies e análise:</strong> cookies essenciais de sessão e segurança. Ferramentas de análise e publicidade podem ser usadas quando informadas e, quando exigido, com consentimento.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">3. Para que usamos os dados</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>processar o pedido, confirmar o pagamento e liberar a licença e os créditos;</li>
              <li>criar e gerenciar o acesso à Área de Membros, quando o curso for adquirido;</li>
              <li>prestar suporte, responder dúvidas e resolver problemas técnicos;</li>
              <li>prevenir fraude, abuso, compartilhamento indevido de licença e incidentes de segurança;</li>
              <li>cumprir obrigações legais, fiscais e regulatórias;</li>
              <li>enviar comunicações sobre o produto e o suporte;</li>
              <li>medir desempenho do site e melhorar a experiência, quando permitido.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">4. Bases legais</h2>
            <p className="mt-2">
              Tratamos dados com base na execução do contrato (compra, licença e suporte), no cumprimento de obrigação
              legal, no legítimo interesse (segurança, prevenção a fraude e melhoria do serviço) e, quando necessário, no
              consentimento do titular. Você pode revogar o consentimento a qualquer momento.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">5. Com quem compartilhamos</h2>
            <p className="mt-2">
              Compartilhamos apenas o necessário com prestadores que ajudam a operar o serviço, como:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li><strong className="text-text-primary">AbacatePay</strong> — processamento de pagamentos Pix;</li>
              <li><strong className="text-text-primary">Resend</strong> — envio de e-mails transacionais;</li>
              <li><strong className="text-text-primary">Vercel e Neon</strong> — hospedagem do site e banco de dados;</li>
              <li><strong className="text-text-primary">Railway</strong> — servidor de validação de licenças;</li>
              <li><strong className="text-text-primary">HostGator</strong> — hospedagem da Área de Membros;</li>
              <li><strong className="text-text-primary">WhatsApp</strong> — grupo de suporte e comunidade;</li>
              <li>provedores de análise e publicidade, quando utilizados com base legal adequada.</li>
            </ul>
            <p className="mt-2">
              Alguns desses provedores podem processar dados fora do Brasil. Nesses casos, buscamos salvaguardas
              contratuais e medidas compatíveis com a LGPD.
            </p>
            <p className="mt-2">
              Não vendemos seus dados pessoais.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">6. Cookies</h2>
            <p className="mt-2">
              Usamos cookies e tecnologias semelhantes para manter a sessão, proteger o site e lembrar preferências.
              Cookies de análise e publicidade podem ser adicionados para medir campanhas e melhorar o site; quando a lei
              exigir, você poderá aceitar ou recusar essas ferramentas.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">7. Por quanto tempo guardamos</h2>
            <p className="mt-2">
              Mantemos os dados enquanto forem necessários para prestar o serviço e cumprir obrigações legais. Dados de
              pedidos e fiscais podem ser guardados por até 5 anos. Licenças e credenciais são mantidas enquanto ativas ou
              pelo prazo necessário para suporte e segurança. Depois disso, os dados são eliminados ou anonimizados,
              ressalvadas as hipóteses legais de conservação.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">8. Segurança</h2>
            <p className="mt-2">
              Adotamos medidas técnicas e administrativas para proteger os dados, incluindo HTTPS, senhas armazenadas em
              hash (bcrypt), tokens de acesso hasheados, controle de acesso e validação de licença por hash de hardware.
              Nenhum sistema é 100% imune; se ocorrer incidente relevante, adotaremos as providências legais e
              comunicaremos os titulares afetados quando exigido.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">9. Seus direitos (LGPD)</h2>
            <p className="mt-2">
              Você pode solicitar, a qualquer momento:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              <li>confirmação de que tratamos seus dados;</li>
              <li>acesso aos dados que temos sobre você;</li>
              <li>correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
              <li>portabilidade, quando aplicável;</li>
              <li>informações sobre compartilhamento;</li>
              <li>revogação do consentimento;</li>
              <li>oposição a tratamentos realizados com base em legítimo interesse, quando cabível.</li>
            </ul>
            <p className="mt-2">
              Para exercer seus direitos, envie um e-mail para{' '}
              <a href="mailto:contato@fabricadecortes.com" className="text-brand hover:underline">
                contato@fabricadecortes.com
              </a>
              . Podemos pedir informações para confirmar sua identidade e evitar acesso indevido. Algumas solicitações
              podem ser limitadas por obrigações legais de retenção.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">10. Alterações desta política</h2>
            <p className="mt-2">
              Podemos atualizar esta Política para refletir mudanças no serviço, na legislação ou nos fornecedores. A
              versão vigente é sempre a publicada nesta página, com a data de atualização no topo.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">11. Contato</h2>
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
