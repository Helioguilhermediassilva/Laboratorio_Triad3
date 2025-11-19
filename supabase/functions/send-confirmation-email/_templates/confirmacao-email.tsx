import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface ConfirmacaoEmailProps {
  supabase_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
  user_email: string;
}

export const ConfirmacaoEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: ConfirmacaoEmailProps) => {
  const confirmUrl = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
  
  return (
    <Html>
      <Head />
      <Preview>Confirme seu cadastro na TRIAD3</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <div style={logo}>
              <span style={logoText}>T3</span>
            </div>
          </Section>
          
          <Heading style={h1}>Bem-vindo à TRIAD3!</Heading>
          
          <Text style={text}>
            Olá! Obrigado por se cadastrar na TRIAD3, sua plataforma completa de gestão financeira pessoal.
          </Text>
          
          <Text style={text}>
            Para começar a usar sua conta e ter acesso a todas as funcionalidades, você precisa confirmar seu email.
          </Text>
          
          <Section style={buttonContainer}>
            <Link href={confirmUrl} target="_blank" style={button}>
              Confirmar meu email
            </Link>
          </Section>
          
          <Text style={text}>
            Ou copie e cole este link no seu navegador:
          </Text>
          
          <Text style={linkText}>{confirmUrl}</Text>
          
          <Hr style={hr} />
          
          <Text style={text}>
            Você também pode usar este código de confirmação:
          </Text>
          
          <code style={code}>{token}</code>
          
          <Hr style={hr} />
          
          <Text style={footerText}>
            Se você não criou uma conta na TRIAD3, pode ignorar este email com segurança.
          </Text>
          
          <Text style={footerText}>
            Este link de confirmação é válido por 24 horas.
          </Text>
          
          <Hr style={hr} />
          
          <Section style={footerSection}>
            <Text style={footer}>
              <strong>TRIAD3</strong> - Gestão Financeira Pessoal Inteligente
            </Text>
            <Text style={footer}>
              Patrimônio • Investimentos • Planejamento Fiscal
            </Text>
            <Text style={footerSmall}>
              Este é um email automático, por favor não responda.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ConfirmacaoEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const logoSection = {
  padding: '32px 0',
  textAlign: 'center' as const,
};

const logo = {
  display: 'inline-block',
  width: '60px',
  height: '60px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto',
};

const logoText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
};

const h1 = {
  color: '#1a1a1a',
  fontSize: '32px',
  fontWeight: '700',
  margin: '40px 0',
  padding: '0 40px',
  lineHeight: '1.3',
  textAlign: 'center' as const,
};

const text = {
  color: '#484848',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
  margin: '16px 0',
};

const buttonContainer = {
  padding: '27px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#667eea',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '16px 40px',
  transition: 'background-color 0.3s ease',
};

const linkText = {
  color: '#667eea',
  fontSize: '14px',
  padding: '0 40px',
  wordBreak: 'break-all' as const,
  margin: '8px 0',
};

const code = {
  display: 'inline-block',
  padding: '16px 24px',
  backgroundColor: '#f4f4f4',
  borderRadius: '8px',
  border: '1px solid #e0e0e0',
  color: '#333',
  fontSize: '20px',
  fontWeight: '600',
  letterSpacing: '2px',
  fontFamily: 'monospace',
  margin: '0 40px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 40px',
};

const footerText = {
  color: '#8898aa',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 40px',
  margin: '8px 0',
};

const footerSection = {
  padding: '24px 40px',
  textAlign: 'center' as const,
  backgroundColor: '#f8f9fa',
  borderTop: '1px solid #e6ebf1',
  marginTop: '32px',
};

const footer = {
  color: '#484848',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '4px 0',
};

const footerSmall = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '20px',
  marginTop: '16px',
};
