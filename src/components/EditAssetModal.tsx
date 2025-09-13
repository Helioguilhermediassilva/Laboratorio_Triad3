import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface Asset {
  id: string;
  name: string;
  category: string;
  location: string;
  value: number;
  purchaseDate: string;
  status: "active" | "maintenance" | "inactive";
  condition: "excellent" | "good" | "fair" | "poor";
  ticker?: string;
  quantity?: number;
  currentPrice?: number;
}

interface EditAssetModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAsset: Asset) => void;
}

export default function EditAssetModal({ asset, isOpen, onClose, onSave }: EditAssetModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Asset | null>(null);

  // Initialize form data when asset changes
  if (asset && (!formData || formData.id !== asset.id)) {
    setFormData({ ...asset });
  }

  if (!asset || !formData) return null;

  const handleInputChange = (field: keyof Asset, value: string | number) => {
    setFormData(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  };

  const handleSave = () => {
    if (!formData) return;

    // Basic validation
    if (!formData.name.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome/Ticker é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!formData.location.trim()) {
      toast({
        title: "Erro de validação", 
        description: "Localização/Corretora é obrigatória",
        variant: "destructive"
      });
      return;
    }

    if (formData.value <= 0) {
      toast({
        title: "Erro de validação",
        description: "Valor deve ser maior que zero",
        variant: "destructive"
      });
      return;
    }

    // Financial asset validation
    const isFinancialAsset = formData.ticker && formData.quantity && formData.currentPrice;
    if (isFinancialAsset) {
      if (formData.quantity! <= 0) {
        toast({
          title: "Erro de validação",
          description: "Quantidade deve ser maior que zero",
          variant: "destructive"
        });
        return;
      }

      if (formData.currentPrice! <= 0) {
        toast({
          title: "Erro de validação",
          description: "Preço atual deve ser maior que zero",
          variant: "destructive"
        });
        return;
      }
    }

    onSave(formData);
    toast({
      title: "Ativo atualizado",
      description: "As alterações foram salvas com sucesso"
    });
    onClose();
  };

  const isFinancialAsset = formData.ticker && formData.category !== "Físico";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Editar Ativo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome/Ticker *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ex: PETR4, Apartamento Centro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ação">Ação</SelectItem>
                      <SelectItem value="FII">Fundo Imobiliário</SelectItem>
                      <SelectItem value="ETF">ETF</SelectItem>
                      <SelectItem value="Renda Fixa">Renda Fixa</SelectItem>
                      <SelectItem value="Criptomoeda">Criptomoeda</SelectItem>
                      <SelectItem value="Físico">Bem Físico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Localização/Corretora *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Ex: XP Investimentos, Casa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Data de Compra *</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange("purchaseDate", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes Financeiros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isFinancialAsset ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ticker">Ticker</Label>
                    <Input
                      id="ticker"
                      value={formData.ticker || ""}
                      onChange={(e) => handleInputChange("ticker", e.target.value)}
                      placeholder="Ex: PETR4"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity || ""}
                        onChange={(e) => handleInputChange("quantity", parseFloat(e.target.value) || 0)}
                        placeholder="100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currentPrice">Preço Atual (R$)</Label>
                      <Input
                        id="currentPrice"
                        type="number"
                        step="0.01"
                        value={formData.currentPrice || ""}
                        onChange={(e) => handleInputChange("currentPrice", parseFloat(e.target.value) || 0)}
                        placeholder="35.84"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="value">Valor Atual (R$) *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => handleInputChange("value", parseFloat(e.target.value) || 0)}
                    placeholder="100000.00"
                  />
                </div>
              )}

              {isFinancialAsset && (
                <div className="space-y-2">
                  <Label>Valor Total Calculado</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-semibold">
                      {((formData.quantity || 0) * (formData.currentPrice || 0)).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formData.quantity || 0} × R$ {(formData.currentPrice || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status and Condition */}
          <Card>
            <CardHeader>
              <CardTitle>Status e Condição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condition">Condição</Label>
                  <Select value={formData.condition} onValueChange={(value: any) => handleInputChange("condition", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excelente</SelectItem>
                      <SelectItem value="good">Boa</SelectItem>
                      <SelectItem value="fair">Regular</SelectItem>
                      <SelectItem value="poor">Ruim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleSave} className="flex-1">
              Salvar Alterações
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}