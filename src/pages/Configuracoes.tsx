import { useState, useEffect } from "react";
import { User, Bell, Shield, Palette, Database, HelpCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Format CPF as user types: 000.000.000-00
const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

// Mask CPF for display: ***.***.***-00
const maskCPF = (cpf: string): string => {
  if (!cpf || cpf.length < 14) return cpf;
  return `***.***.*${cpf.slice(10)}`;
};

export default function Configuracoes() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    nome_completo: "",
    email: "",
    cpf: "",
    telefone: "",
    data_nascimento: ""
  });
  const [showCpf, setShowCpf] = useState(false);
  const [editingCpf, setEditingCpf] = useState(false);
  const [newCpf, setNewCpf] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setProfile(prev => ({ ...prev, email: user.email || "" }));

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (profileData) {
        // Decrypt CPF if exists
        let decryptedCpf = "";
        if (profileData.cpf) {
          const { data: cpfData } = await supabase.rpc('decrypt_cpf', { cpf_encrypted: profileData.cpf });
          decryptedCpf = cpfData || "";
        }

        setProfile({
          nome_completo: profileData.nome_completo || "",
          email: user.email || "",
          cpf: decryptedCpf,
          telefone: profileData.telefone || "",
          data_nascimento: profileData.data_nascimento || ""
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const updateData: any = {
        nome_completo: profile.nome_completo,
        telefone: profile.telefone,
        data_nascimento: profile.data_nascimento || null
      };

      // Encrypt CPF if updating
      if (editingCpf && newCpf) {
        const { data: encryptedCpf, error: encryptError } = await supabase.rpc('encrypt_cpf', { cpf_plain: newCpf });
        if (encryptError) throw new Error("Erro ao criptografar CPF");
        updateData.cpf = encryptedCpf;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      if (editingCpf && newCpf) {
        setProfile(prev => ({ ...prev, cpf: newCpf }));
        setEditingCpf(false);
        setNewCpf("");
      }

      toast({
        title: "Perfil atualizado!",
        description: "Suas alterações foram salvas com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCpf(formatCPF(e.target.value));
  };

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
            {loading ? (
              <div className="text-muted-foreground">Carregando...</div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input 
                      id="name" 
                      value={profile.nome_completo}
                      onChange={(e) => setProfile(prev => ({ ...prev, nome_completo: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={profile.email} disabled />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    {editingCpf ? (
                      <div className="flex gap-2">
                        <Input 
                          id="cpf" 
                          value={newCpf}
                          onChange={handleCpfChange}
                          placeholder="000.000.000-00"
                          maxLength={14}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => { setEditingCpf(false); setNewCpf(""); }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input 
                          id="cpf" 
                          value={profile.cpf ? (showCpf ? profile.cpf : maskCPF(profile.cpf)) : "Não informado"}
                          disabled 
                        />
                        {profile.cpf && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowCpf(!showCpf)}
                          >
                            {showCpf ? "Ocultar" : "Ver"}
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingCpf(true)}
                        >
                          {profile.cpf ? "Editar" : "Adicionar"}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input 
                      id="telefone" 
                      value={profile.telefone}
                      onChange={(e) => setProfile(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input 
                    id="data_nascimento" 
                    type="date"
                    value={profile.data_nascimento}
                    onChange={(e) => setProfile(prev => ({ ...prev, data_nascimento: e.target.value }))}
                  />
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </>
            )}
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