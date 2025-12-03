import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddAssetFormProps {
  onSubmit?: (asset: any) => void;
  onCancel?: () => void;
}

export default function AddAssetForm({ onSubmit, onCancel }: AddAssetFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    type: "",
    name: "",
    description: "",
    value: "",
    quantity: "",
    location: "",
    purchaseDate: "",
    document: "",
    notes: "",
    // Campos específicos para aplicações financeiras
    ticker: "",
    purchasePrice: "",
    currentPrice: "",
    broker: "",
    // Campos específicos para imóveis
    address: "",
    area: "",
    // Campos específicos para veículos
    brand: "",
    model: "",
    year: "",
    plate: ""
  });

  const formatCurrency = (value: string): string => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    const formattedValue = (parseFloat(numericValue) / 100).toFixed(2);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(formattedValue));
  };

  const parseCurrencyToNumber = (value: string): number => {
    const numericValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(numericValue) || 0;
  };

  const handleCurrencyChange = (field: string, value: string) => {
    const formatted = formatCurrency(value);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.name || !formData.type) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para adicionar um item.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      let savedData: any = null;

      // Persistir no Supabase baseado na categoria
      if (formData.category === 'aplicacoes') {
        const valorAplicado = parseCurrencyToNumber(formData.purchasePrice) * (parseInt(formData.quantity) || 1);
        const valorAtual = parseCurrencyToNumber(formData.currentPrice || formData.purchasePrice) * (parseInt(formData.quantity) || 1);

        const { data, error } = await supabase
          .from('aplicacoes')
          .insert({
            user_id: user.id,
            nome: formData.name,
            tipo: formData.type,
            instituicao: formData.broker || formData.location || 'N/A',
            valor_aplicado: valorAplicado,
            valor_atual: valorAtual,
            data_aplicacao: formData.purchaseDate || new Date().toISOString().split('T')[0],
            liquidez: 'D+1',
            rentabilidade_tipo: 'Variável',
            taxa_rentabilidade: 0
          })
          .select()
          .single();

        if (error) throw error;
        savedData = data;

      } else if (formData.category === 'imobilizado') {
        const valorNumerico = parseCurrencyToNumber(formData.value);

        const { data, error } = await supabase
          .from('bens_imobilizados')
          .insert({
            user_id: user.id,
            nome: formData.name,
            categoria: formData.type === 'imovel' ? 'Imóvel' : 
                       formData.type === 'veiculo' ? 'Veículo' :
                       formData.type === 'maquina' ? 'Equipamento' :
                       formData.type === 'movel' ? 'Móveis' : 'Outros',
            localizacao: formData.address || formData.location || 'N/A',
            valor_aquisicao: valorNumerico,
            valor_atual: valorNumerico,
            data_aquisicao: formData.purchaseDate || new Date().toISOString().split('T')[0],
            status: 'Ativo',
            descricao: formData.notes || formData.description || ''
          })
          .select()
          .single();

        if (error) throw error;
        savedData = data;

      } else if (formData.category === 'contas-bancarias') {
        const saldoNumerico = parseCurrencyToNumber(formData.value);

        const { data, error } = await supabase
          .from('contas_bancarias')
          .insert({
            user_id: user.id,
            banco: formData.name,
            agencia: formData.location || '',
            numero_conta: formData.document || '',
            tipo_conta: formData.type === 'corrente' ? 'Conta Corrente' :
                        formData.type === 'poupanca' ? 'Poupança' :
                        formData.type === 'salario' ? 'Conta Salário' : 'Conta Digital',
            saldo_atual: saldoNumerico,
            ativo: true
          })
          .select()
          .single();

        if (error) throw error;
        savedData = data;

      } else {
        // Para outras categorias, criar um objeto local por enquanto
        savedData = {
          id: Date.now().toString(),
          ...formData,
          value: parseCurrencyToNumber(formData.value)
        };
      }

      const newAsset = {
        id: savedData?.id || Date.now().toString(),
        category: formData.category,
        type: formData.type,
        name: formData.name,
        description: formData.description,
        value: parseCurrencyToNumber(formData.value) || parseCurrencyToNumber(formData.currentPrice) * (parseInt(formData.quantity) || 1),
        quantity: parseInt(formData.quantity) || 1,
        location: formData.location || formData.broker || formData.address,
        purchaseDate: formData.purchaseDate,
        document: formData.document,
        notes: formData.notes,
        ticker: formData.ticker?.toUpperCase(),
        purchasePrice: parseCurrencyToNumber(formData.purchasePrice),
        currentPrice: parseCurrencyToNumber(formData.currentPrice || formData.purchasePrice),
        broker: formData.broker
      };

      onSubmit?.(newAsset);
      
      toast({
        title: "Sucesso!",
        description: `${formData.category === 'aplicacoes' ? 'Aplicação' : 'Patrimônio'} ${formData.name} adicionado e salvo com sucesso.`,
      });

      // Reset form
      setFormData({
        category: "",
        type: "",
        name: "",
        description: "",
        value: "",
        quantity: "",
        location: "",
        purchaseDate: "",
        document: "",
        notes: "",
        ticker: "",
        purchasePrice: "",
        currentPrice: "",
        broker: "",
        address: "",
        area: "",
        brand: "",
        model: "",
        year: "",
        plate: ""
      });
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o item. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Adicionar Novo Patrimônio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Categoria Principal */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria*</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aplicacoes">Aplicações Financeiras</SelectItem>
                <SelectItem value="imobilizado">Imobilizado</SelectItem>
                <SelectItem value="contas-bancarias">Contas Bancárias</SelectItem>
                <SelectItem value="orcamentos">Orçamentos</SelectItem>
                <SelectItem value="livro-caixa">Livro Caixa</SelectItem>
                <SelectItem value="imposto-renda">Imposto de Renda</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo baseado na categoria */}
          {formData.category && (
            <div className="space-y-2">
              <Label htmlFor="type">Tipo*</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {formData.category === 'aplicacoes' && (
                    <>
                      <SelectItem value="acao">Ação</SelectItem>
                      <SelectItem value="fii">Fundo Imobiliário</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                      <SelectItem value="bdr">BDR</SelectItem>
                      <SelectItem value="tesouro">Tesouro Direto</SelectItem>
                      <SelectItem value="cdb">CDB</SelectItem>
                      <SelectItem value="lci">LCI</SelectItem>
                      <SelectItem value="lca">LCA</SelectItem>
                      <SelectItem value="debenture">Debênture</SelectItem>
                      <SelectItem value="crypto">Criptomoeda</SelectItem>
                    </>
                  )}
                  {formData.category === 'imobilizado' && (
                    <>
                      <SelectItem value="imovel">Imóvel</SelectItem>
                      <SelectItem value="veiculo">Veículo</SelectItem>
                      <SelectItem value="maquina">Máquina/Equipamento</SelectItem>
                      <SelectItem value="movel">Móvel</SelectItem>
                      <SelectItem value="joia">Joia/Artigo Valor</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </>
                  )}
                  {formData.category === 'contas-bancarias' && (
                    <>
                      <SelectItem value="corrente">Conta Corrente</SelectItem>
                      <SelectItem value="poupanca">Poupança</SelectItem>
                      <SelectItem value="salario">Conta Salário</SelectItem>
                      <SelectItem value="digital">Conta Digital</SelectItem>
                    </>
                  )}
                  {formData.category === 'orcamentos' && (
                    <>
                      <SelectItem value="receita">Receita</SelectItem>
                      <SelectItem value="despesa">Despesa</SelectItem>
                    </>
                  )}
                  {formData.category === 'livro-caixa' && (
                    <>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </>
                  )}
                  {formData.category === 'imposto-renda' && (
                    <>
                      <SelectItem value="rendimento">Rendimento</SelectItem>
                      <SelectItem value="deducao">Dedução</SelectItem>
                      <SelectItem value="bem">Bem e Direito</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Campos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome*</Label>
              <Input
                id="name"
                placeholder="Nome do patrimônio"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                placeholder="R$ 0,00"
                value={formData.value}
                onChange={(e) => handleCurrencyChange("value", e.target.value)}
              />
            </div>
          </div>

          {/* Campos específicos para aplicações financeiras */}
          {formData.category === 'aplicacoes' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ticker">Ticker / Código</Label>
                  <Input
                    id="ticker"
                    placeholder="Ex: PETR4, VALE3"
                    value={formData.ticker}
                    onChange={(e) => handleInputChange("ticker", e.target.value)}
                    className="uppercase"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="broker">Corretora</Label>
                  <Input
                    id="broker"
                    placeholder="Ex: XP, Rico, Inter"
                    value={formData.broker}
                    onChange={(e) => handleInputChange("broker", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="100"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Preço de Compra (R$)</Label>
                  <Input
                    id="purchasePrice"
                    placeholder="R$ 0,00"
                    value={formData.purchasePrice}
                    onChange={(e) => handleCurrencyChange("purchasePrice", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currentPrice">Preço Atual (R$)</Label>
                  <Input
                    id="currentPrice"
                    placeholder="R$ 0,00"
                    value={formData.currentPrice}
                    onChange={(e) => handleCurrencyChange("currentPrice", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Campos específicos para imóveis */}
          {formData.category === 'imobilizado' && formData.type === 'imovel' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  placeholder="Endereço completo"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="area">Área (m²)</Label>
                <Input
                  id="area"
                  type="number"
                  placeholder="120"
                  value={formData.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Campos específicos para veículos */}
          {formData.category === 'imobilizado' && formData.type === 'veiculo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  placeholder="Ex: Toyota, Ford"
                  value={formData.brand}
                  onChange={(e) => handleInputChange("brand", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  placeholder="Ex: Corolla, Fiesta"
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="year">Ano</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2020"
                  value={formData.year}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plate">Placa</Label>
                <Input
                  id="plate"
                  placeholder="ABC-1234"
                  value={formData.plate}
                  onChange={(e) => handleInputChange("plate", e.target.value)}
                  className="uppercase"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                placeholder="Onde está localizado"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Data de Aquisição</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange("purchaseDate", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">Documento/Registro</Label>
            <Input
              id="document"
              placeholder="Número do documento, registro, etc."
              value={formData.document}
              onChange={(e) => handleInputChange("document", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações adicionais..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Salvando..." : "Adicionar Patrimônio"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={loading}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
