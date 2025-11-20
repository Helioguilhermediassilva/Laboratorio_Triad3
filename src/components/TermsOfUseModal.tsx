import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsOfUseModalProps {
  open: boolean;
  onAccept: () => void;
}

export default function TermsOfUseModal({ open, onAccept }: TermsOfUseModalProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <Dialog open={open} modal>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Termos de Uso do App Triad3 Patrimonial</DialogTitle>
          <DialogDescription>
            Por favor, leia e aceite os termos de uso para continuar
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-2"><strong>Partes:</strong> Tríade Patrimonial Informática e Sistemas S/A, pessoa jurídica de direito privado, inscrita no CNPJ sob nº. 63.340.270/0001-61, com sede na Rua São Sebastião do Paraiso, nº. 411, andar 2, bairro Itapoã, Belo Horizonte, Minas Gerais, Brasil, CEP 31.710-080, e</p>
              <p>Você (usuário pessoa física ou jurídica)</p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">1. Aceitação dos Termos</h3>
              <p>Bem-vindo ao aplicativo Triad3 Patrimonial ("App"). Ao acessar ou usar o App, você ("Usuário") concorda em cumprir e estar vinculado a estes Termos de Uso ("Termos"). Se você não concordar com estes Termos, por favor não utilize o App.</p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">2. Sobre o App</h3>
              <p>O App Triad3 Patrimonial é plataforma digital criada para apoiar o ensino, a gamificação e o acompanhamento dos conceitos da "Tríade Patrimonial" — contemplando princípios gerais de contabilidade, gestão de patrimônio, imposto de renda e aposentadoria, assim como conceitos de violência patrimonial e elaboração de testamento, conforme proposta do Usuário (instrutor/autor). O App disponibiliza funcionalidades como: cadastro, inventário do patrimônio, acompanhamento de progresso educacional, e integração com princípios judaicos de prosperidade (o "Serviço").</p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">3. Cadastro e Acesso</h3>
              <p className="mb-2"><strong>3.1.</strong> Para utilizar o App é necessário realizar cadastro e fornecer informações corretas, completas e atualizadas.</p>
              <p className="mb-2"><strong>3.2.</strong> Você é responsável por manter em sigilo seus dados de acesso (login, senha). Você concorda em notificar imediatamente o desenvolvedor/empresa em caso de uso não autorizado.</p>
              <p className="mb-2"><strong>3.3.</strong> Você declara que tem idade mínima exigida para usar o App conforme legislação aplicável.</p>
              <p><strong>3.4.</strong> Para utilização do App é necessário o acesso a rede de internet.</p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">4. Licença de Uso</h3>
              <p>Concedemos a você uma licença limitada, não-exclusiva, intransferível e revogável para usar o App conforme estes Termos. Você concorda em não: (i) copiar, modificar ou distribuir o App; (ii) criar obras derivadas; (iii) reverter engenharia, desmontar ou descompilar o App; (iv) usar o App para fins ilegais ou não autorizados.</p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">5. Conteúdo do App</h3>
              <p className="mb-2"><strong>5.1.</strong> Todo o conteúdo disponibilizado no App (logomarcas, logotipos, textos, vídeos, imagens, áudios, gamificações, cartões, PDFs) pertence ao autor/empresa desenvolvedora ou seus licenciantes, estando protegido por direitos autorais e outras leis de propriedade intelectual.</p>
              <p className="mb-2"><strong>5.2.</strong> Você reconhece que não adquire qualquer direito sobre esse conteúdo além da licença de uso descrita.</p>
              <p><strong>5.3.</strong> Você poderá ter a possibilidade de submeter conteúdo (por exemplo feedback, comentários). Ao submeter, você concede ao desenvolvedor do App uma licença livre, mundial, irrevogável, sublicenciável para usar, reproduzir, modificar, adaptar, publicar, traduzir, distribuir esse conteúdo.</p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">6. Mensagens, Notificações e Comunicações</h3>
              <p>Você autoriza que o App envie notificações, e-mails ou mensagens push pelo celular para informá-lo sobre atualizações, conteúdos, ofertas ou lembretes de uso. Você pode desativar essas notificações conforme funcionalidade do seu dispositivo.</p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">7. Pagamentos, Assinaturas e Cancelamento</h3>
              <p className="mb-2"><strong>7.1.</strong> Se o App oferecer funcionalidades pagas ou assinatura ("Premium"), as condições de pagamento, renovação automática, políticas de cancelamento serão informadas no momento da contratação.</p>
              <p className="mb-2"><strong>7.2.</strong> Você poderá cancelar sua assinatura via mecanismo fornecido pelo App ou pela loja de apps correspondente.</p>
              <p><strong>7.3.</strong> Nós nos reservamos o direito de alterar preços e condições, mediante prévia comunicação.</p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">8. Uso Aceitável</h3>
              <p className="mb-2">Você concorda em usar o App de forma compatível com leis, regulamentos e estes Termos. Você não poderá:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>usar o App para finalidades abusivas, ilegais ou que violem direitos de terceiros;</li>
                <li>transmitir vírus, malware ou conteúdo ofensivo;</li>
                <li>interferir ou prejudicar funcionamento do App ou servidores;</li>
                <li>criar contas múltiplas de forma fraudulenta.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">9. Privacidade e Proteção de Dados</h3>
              <p>Sua privacidade é importante para nós. O tratamento de seus dados pessoais será regido por nossa Política de Privacidade, que acompanha este documento ou está disponível no App/site. Por favor, leia-a atentamente.</p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">10. Limitação de Responsabilidade</h3>
              <p>Na máxima extensão permitida por lei, o desenvolvedor do App não será responsável por danos indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes do uso ou da impossibilidade de usar o App. O App é fornecido "como está", sem garantias de qualquer tipo, expressas ou implícitas. O Aplicativo é uma ferramenta e não se propõe sua funcionalidade como um meio de obter quaisquer vantagens financeiras e/ou patrimoniais, sua função é meramente educativa.</p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">11. Alterações nos Termos</h3>
              <p>Reservamo-nos o direito de modificar ou substituir estes Termos a qualquer momento. Avisaremos mediante publicação de nova versão no App ou via e-mail. O uso continuado do App após as alterações implicará aceitação dos novos Termos.</p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">12. Rescisão</h3>
              <p>Podemos suspender ou encerrar seu acesso ao App ou cancelar sua conta a nosso critério, sem aviso prévio, se você violar estes Termos ou por outros motivos. Mesmo após rescisão, as cláusulas referentes à propriedade intelectual, limitação de responsabilidade, etc., continuarão em vigor.</p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">13. Disposições Gerais</h3>
              <p className="mb-2"><strong>13.1.</strong> Estes Termos constituem o acordo completo entre você e o desenvolvedor do App em relação ao uso do App e substituem quaisquer termos anteriores.</p>
              <p className="mb-2"><strong>13.2.</strong> Se qualquer disposição destes Termos for considerada inválida ou inexequível, tal disposição será aplicada na máxima extensão possível e as demais permanecerão em pleno vigor.</p>
              <p className="mb-2"><strong>13.3.</strong> O fato de não exercermos algum direito ou disposições dos Termos não constitui renúncia de tal direito.</p>
              <p><strong>13.4.</strong> A eventual cessão ou transferência destes Termos depende de nossa prévia anuência.</p>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-2">14. Legislação Aplicável e Foro</h3>
              <p>Estes Termos serão regidos e interpretados de acordo com as leis da República Federativa do Brasil. Para dirimir controvérsias oriundas destes Termos, as partes elegem o foro da comarca de Belo Horizonte, Estado de Minas Gerais, com renúncia de qualquer outro, por mais privilegiado que seja.</p>
            </div>

            <div className="mt-6 pt-4 border-t">
              <p><strong>Versão:</strong> 1.0</p>
              <p><strong>Data de Vigência:</strong> 01 de novembro 2025</p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex flex-col sm:flex-col gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(checked === true)}
            />
            <Label 
              htmlFor="terms" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Li e concordo com os Termos de Uso do App Triad3 Patrimonial
            </Label>
          </div>
          <Button 
            onClick={onAccept} 
            disabled={!accepted}
            className="w-full"
          >
            Aceitar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
