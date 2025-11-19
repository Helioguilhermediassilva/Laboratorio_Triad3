import { Resend } from 'npm:resend@4.0.0';

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();
    
    console.log(`Sending welcome email to: ${email}`);

    const { data, error } = await resend.emails.send({
      from: 'TRIAD3 <onboarding@resend.dev>',
      to: [email],
      subject: 'Bem-vindo à TRIAD3! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bem-vindo à TRIAD3</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Bem-vindo à TRIAD3! 🎉</h1>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                          Olá${name ? ` ${name}` : ''}!
                        </p>
                        
                        <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                          Estamos muito felizes em ter você conosco! Sua conta foi criada com sucesso e você já pode começar a usar todos os recursos da plataforma TRIAD3.
                        </p>
                        
                        <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                          Comece a organizar suas finanças, investimentos e muito mais de forma inteligente e prática.
                        </p>
                        
                        <!-- CTA Button -->
                        <table role="presentation" style="margin: 0 auto;">
                          <tr>
                            <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                              <a href="https://a3ecaad1-d88b-4a54-9deb-7320f2915a01.lovableproject.com/" 
                                 style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">
                                Acessar Plataforma
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                          Se você não criou esta conta, por favor ignore este email.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px 40px; background-color: #f9f9f9; border-radius: 0 0 12px 12px; text-align: center;">
                        <p style="margin: 0; color: #999999; font-size: 12px;">
                          TRIAD3 © 2025 - Gestão Financeira Inteligente
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in send-welcome-email function:', error);
    
    return new Response(
      JSON.stringify({
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'An unknown error occurred',
        },
      }),
      {
        status: error.code === 401 ? 401 : 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
