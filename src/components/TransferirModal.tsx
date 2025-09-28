import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, Send, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TransferirModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contaOrigem?: any;
  contas: any[];
}

const tiposTransferencia = [
  { value: "pix", label: "PIX", taxa: 0 },
  { value: "ted", label: "TED", taxa: 15.90 },
  { value: "doc", label: "DOC", taxa: 12.50 },
  { value: "transferencia", label: "Transferência entre contas", taxa: 0 }
];

export default function TransferirModal({
  open,
  onOpenChange,
  contaOrigem,
  contas
}: TransferirModalProps) {
  const [contaOrigemId, setContaOrigemId] = useState(contaOrigem?.id || "");
  const [contaDestinoId, setContaDestinoId] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("pix");
  const [descricao, setDescricao] = useState("");
  const [chavePixDestino, setChavePixDestino] = useState("");
  const [agenciaDestino, setAgenciaDestino] = useState("");
  const [contaDestino, setContaDestino] = useState("");
  const [nomeDestino, setNomeDestino] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contaOrigemId || !valor || !tipo) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const valorNum = parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.'));
    
    if (valorNum <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser maior que zero.",
        variant: "destructive"
      });
      return;
    }

    const contaOrigem = contas.find(conta => conta.id === contaOrigemId);
    
    if (valorNum > contaOrigem.saldo + contaOrigem.limite) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não possui saldo suficiente para esta transferência.",
        variant: "destructive"
      });
      return;
    }

    if (tipo === "pix" && !chavePixDestino) {
      toast({
        title: "Chave PIX obrigatória",
        description: "Para transferência PIX, informe a chave do destinatário.",
        variant: "destructive"
      });
      return;
    }

    if (tipo !== "pix" && tipo !== "transferencia" && (!agenciaDestino || !contaDestino || !nomeDestino)) {
      toast({
        title: "Dados do destinatário",
        description: "Para TED/DOC, informe todos os dados bancários do destinatário.",
        variant: "destructive"
      });
      return;
    }

    const tipoTransf = tiposTransferencia.find(t => t.value === tipo);
    const valorComTaxa = valorNum + (tipoTransf?.taxa || 0);

    toast({
      title: "Transferência realizada!",
      description: `${tipoTransf?.label} de ${formatCurrency(valorNum)} realizada com sucesso.`
    });

    // Reset form
    setContaOrigemId(contaOrigem?.id || "");
    setContaDestinoId("");
    setValor("");
    setTipo("pix");
    setDescricao("");
    setChavePixDestino("");
    setAgenciaDestino("");
    setContaDestino("");
    setNomeDestino("");
    onOpenChange(false);
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' 
      ? parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0
      : value;
    
    return numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = inputValue.replace(/[^\d]/g, '');
    if (!numericValue) {
      setValor("");
      return;
    }
    
    const formattedValue = (parseFloat(numericValue) / 100).toFixed(2);
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(formattedValue));
    
    setValor(formatted);
  };

  const contaOrigemSelecionada = contas.find(conta => conta.id === contaOrigemId);
  const tipoSelecionado = tiposTransferencia.find(t => t.value === tipo);
  const valorNum = parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  const valorComTaxa = valorNum + (tipoSelecionado?.taxa || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Nova Transferência
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Conta Origem */}
          <div className="space-y-2">
            <Label>Conta de Origem *</Label>
            <Select value={contaOrigemId} onValueChange={setContaOrigemId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta de origem" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                {contas.map(conta => (
                  <SelectItem key={conta.id} value={conta.id}>
                    {conta.banco} - {conta.nome} (Saldo: {formatCurrency(conta.saldo)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Transferência */}
          <div className="space-y-2">
            <Label>Tipo de Transferência *</Label>
            <Select value={tipo} onValueChange={setTipo} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                {tiposTransferencia.map(tipoItem => (
                  <SelectItem key={tipoItem.value} value={tipoItem.value}>
                    {tipoItem.label} {tipoItem.taxa > 0 && `(Taxa: ${formatCurrency(tipoItem.taxa)})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor *</Label>
            <Input
              id="valor"
              value={valor}
              onChange={handleValorChange}
              placeholder="R$ 0,00"
              required
            />
          </div>

          {/* Dados do Destinatário */}
          {tipo === "pix" && (
            <div className="space-y-2">
              <Label htmlFor="chavePixDestino">Chave PIX do Destinatário *</Label>
              <Input
                id="chavePixDestino"
                value={chavePixDestino}
                onChange={(e) => setChavePixDestino(e.target.value)}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                required
              />
            </div>
          )}

          {tipo === "transferencia" && (
            <div className="space-y-2">
              <Label>Conta de Destino *</Label>
              <Select value={contaDestinoId} onValueChange={setContaDestinoId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta de destino" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  {contas.filter(conta => conta.id !== contaOrigemId).map(conta => (
                    <SelectItem key={conta.id} value={conta.id}>
                      {conta.banco} - {conta.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(tipo === "ted" || tipo === "doc") && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="agenciaDestino">Agência *</Label>
                  <Input
                    id="agenciaDestino"
                    value={agenciaDestino}
                    onChange={(e) => setAgenciaDestino(e.target.value)}
                    placeholder="Ex: 0001"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contaDestino">Conta *</Label>
                  <Input
                    id="contaDestino"
                    value={contaDestino}
                    onChange={(e) => setContaDestino(e.target.value)}
                    placeholder="Ex: 12345-6"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomeDestino">Nome do Destinatário *</Label>
                <Input
                  id="nomeDestino"
                  value={nomeDestino}
                  onChange={(e) => setNomeDestino(e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>
            </div>
          )}

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Motivo da transferência..."
              rows={2}
            />
          </div>

          {/* Resumo */}
          {valor && contaOrigemSelecionada && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Resumo da Transferência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Valor:</span>
                  <span className="font-medium">{formatCurrency(valorNum)}</span>
                </div>
                {tipoSelecionado?.taxa && tipoSelecionado.taxa > 0 && (
                  <div className="flex justify-between">
                    <span>Taxa:</span>
                    <span className="font-medium">{formatCurrency(tipoSelecionado.taxa)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(valorComTaxa)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Saldo após transferência:</span>
                  <span>{formatCurrency(contaOrigemSelecionada.saldo - valorComTaxa)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <Send className="h-4 w-4 mr-2" />
              Realizar Transferência
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}