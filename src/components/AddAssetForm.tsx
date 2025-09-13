import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface AddAssetFormProps {
  onSubmit?: (asset: any) => void;
  onCancel?: () => void;
}

export default function AddAssetForm({ onSubmit, onCancel }: AddAssetFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    ticker: "",
    name: "",
    type: "",
    quantity: "",
    purchasePrice: "",
    currentPrice: "",
    broker: "",
    purchaseDate: "",
    notes: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.ticker || !formData.name || !formData.type || !formData.quantity || !formData.purchasePrice) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const newAsset = {
      id: Date.now().toString(),
      ticker: formData.ticker.toUpperCase(),
      name: formData.name,
      type: formData.type,
      quantity: parseInt(formData.quantity),
      purchasePrice: parseFloat(formData.purchasePrice),
      currentPrice: parseFloat(formData.currentPrice) || parseFloat(formData.purchasePrice),
      broker: formData.broker,
      purchaseDate: formData.purchaseDate,
      notes: formData.notes,
      totalValue: parseInt(formData.quantity) * (parseFloat(formData.currentPrice) || parseFloat(formData.purchasePrice)),
      profitLoss: (parseFloat(formData.currentPrice) || parseFloat(formData.purchasePrice)) - parseFloat(formData.purchasePrice)
    };

    onSubmit?.(newAsset);
    
    toast({
      title: "Sucesso!",
      description: `Ativo ${formData.ticker} adicionado com sucesso.`,
    });

    // Reset form
    setFormData({
      ticker: "",
      name: "",
      type: "",
      quantity: "",
      purchasePrice: "",
      currentPrice: "",
      broker: "",
      purchaseDate: "",
      notes: ""
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          Adicionar Novo Ativo Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker / Código*</Label>
              <Input
                id="ticker"
                placeholder="Ex: PETR4, VALE3"
                value={formData.ticker}
                onChange={(e) => handleInputChange("ticker", e.target.value)}
                className="uppercase"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Ativo*</Label>
              <Input
                id="name"
                placeholder="Ex: Petrobras PN"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Ativo*</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
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
                </SelectContent>
              </Select>
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
              <Label htmlFor="quantity">Quantidade*</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="100"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Preço de Compra (R$)*</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                placeholder="25.50"
                value={formData.purchasePrice}
                onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPrice">Preço Atual (R$)</Label>
              <Input
                id="currentPrice"
                type="number"
                step="0.01"
                placeholder="28.75"
                value={formData.currentPrice}
                onChange={(e) => handleInputChange("currentPrice", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Data da Compra</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => handleInputChange("purchaseDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Notas sobre o investimento..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button type="submit" className="flex-1">
              Adicionar Ativo
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}