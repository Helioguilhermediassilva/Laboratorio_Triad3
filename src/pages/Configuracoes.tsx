import { User, Bell, Shield, Palette, Database, HelpCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function Configuracoes() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e configurações da conta
          </p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" defaultValue="João Silva" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="joao@exemplo.com" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" defaultValue="***.***.***-**" disabled />
            </div>

            <Button>Salvar Alterações</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Alertas de Preço</div>
                <div className="text-sm text-muted-foreground">
                  Receba notificações quando o preço dos seus ativos mudar significativamente
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Dividendos</div>
                <div className="text-sm text-muted-foreground">
                  Notificações sobre pagamento de dividendos
                </div>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Relatórios Mensais</div>
                <div className="text-sm text-muted-foreground">
                  Resume mensal da performance da carteira
                </div>
              </div>
              <Switch />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Notificações por Email</div>
                <div className="text-sm text-muted-foreground">
                  Receber notificações também por email
                </div>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Alterar Senha</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <Input type="password" placeholder="Senha atual" />
                  <Input type="password" placeholder="Nova senha" />
                </div>
                <Button className="mt-2" variant="outline">
                  Alterar Senha
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Autenticação em Duas Etapas</div>
                  <div className="text-sm text-muted-foreground">
                    Adicione uma camada extra de segurança à sua conta
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Tema</Label>
              <Select defaultValue="light">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Moeda</Label>
              <Select defaultValue="brl">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brl">Real (R$)</SelectItem>
                  <SelectItem value="usd">Dólar ($)</SelectItem>
                  <SelectItem value="eur">Euro (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Exportar Dados</div>
                <div className="text-sm text-muted-foreground">
                  Baixe uma cópia de todos os seus dados
                </div>
              </div>
              <Button variant="outline" size="sm">
                Exportar
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-medium">Backup Automático</div>
                <div className="text-sm text-muted-foreground">
                  Backup automático dos seus dados na nuvem
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Help & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Ajuda & Suporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start">
              Central de Ajuda
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Contatar Suporte
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Política de Privacidade
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Termos de Uso
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}