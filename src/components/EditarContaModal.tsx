import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EditarContaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conta: any;
  onContaEditada: (conta: any) => void;
}

const bancosDisponiveis = [
  "Itaú", "Banco do Brasil", "Bradesco", "Santander", "Caixa Econômica Federal",
  "Nubank", "Inter", "XP Investimentos", "BTG Pactual", "Rico", "C6 Bank",
  "Banco Original", "Banco PAN", "Sicredi", "Sicoob", "Banrisul", "Outro"
];

const tiposConta = [
  { value: "Corrente", label: "Conta Corrente" },
  { value: "Poupança", label: "Poupança" },
  { value: "Investimento", label: "Conta Investimento" },
  { value: "Salário", label: "Conta Salário" }
];

const coresDisponiveis = [
  "#FF6B35", "#8A2BE2", "#000000", "#FF8C00", "#32CD32", 
  "#FF1493", "#00CED1", "#FFD700", "#DC143C", "#4B0082"
];

export default function EditarContaModal({
  open,
  onOpenChange,
  conta,
  onContaEditada
}: EditarContaModalProps) {
  const [banco, setBanco] = useState("");
  const [nome, setNome] = useState("");
  const [agencia, setAgencia] = useState("");
  const [numero, setNumero] = useState("");
  const [tipo, setTipo] = useState("");
  const [saldo, setSaldo] = useState("");
  const [limite, setLimite] = useState("");
  const [cor, setCor] = useState("");
  const { toast } = useToast();

  // Populate form with existing data when conta changes
  useEffect(() => {
    if (conta) {
      setBanco(conta.banco || "");
      setNome(conta.nome || "");
      setAgencia(conta.agencia || "");
      setNumero(conta.numero || "");
      setTipo(conta.tipo || "");
      setSaldo(conta.saldo ? formatCurrency(conta.saldo.toString()) : "");
      setLimite(conta.limite ? formatCurrency(conta.limite.toString()) : "");
      setCor(conta.cor || coresDisponiveis[0]);
    }
  }, [conta]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!banco || !nome || !agencia || !numero || !tipo) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const saldoNum = parseFloat(saldo.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const limiteNum = parseFloat(limite.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

    const contaEditada = {
      ...conta,
      banco,
      nome,
      agencia,
      numero,
      tipo,
      saldo: saldoNum,
      limite: limiteNum,
      cor
    };

    onContaEditada(contaEditada);
    
    toast({
      title: "Conta atualizada!",
      description: "Os dados da conta foram atualizados com sucesso."
    });

    onOpenChange(false);
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return "";
    
    const formattedValue = (parseFloat(numericValue) / 100).toFixed(2);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(formattedValue));
  };

  if (!conta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Conta Bancária
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="banco">Banco *</Label>
              <Select value={banco} onValueChange={setBanco} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o banco" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  {bancosDisponiveis.map(bancoItem => (
                    <SelectItem key={bancoItem} value={bancoItem}>{bancoItem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Conta *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Conta Corrente"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agencia">Agência *</Label>
              <Input
                id="agencia"
                value={agencia}
                onChange={(e) => setAgencia(e.target.value)}
                placeholder="Ex: 0001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero">Número da Conta *</Label>
              <Input
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex: 12345-6"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Conta *</Label>
            <Select value={tipo} onValueChange={setTipo} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                {tiposConta.map(tipoItem => (
                  <SelectItem key={tipoItem.value} value={tipoItem.value}>
                    {tipoItem.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="saldo">Saldo Atual</Label>
              <Input
                id="saldo"
                value={saldo}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value);
                  setSaldo(formatted);
                }}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limite">Limite Disponível</Label>
              <Input
                id="limite"
                value={limite}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value);
                  setLimite(formatted);
                }}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor do Cartão</Label>
            <div className="flex gap-2 flex-wrap">
              {coresDisponiveis.map(corItem => (
                <button
                  key={corItem}
                  type="button"
                  className={`w-10 h-10 rounded-lg border-2 ${
                    cor === corItem ? 'border-foreground scale-110' : 'border-gray-300'
                  } transition-all`}
                  style={{ backgroundColor: corItem }}
                  onClick={() => setCor(corItem)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              <Edit className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}