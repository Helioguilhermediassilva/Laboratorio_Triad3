import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Target, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NovaMetaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMetaAdicionada: (meta: any) => void;
}

const tiposMetaComuns = [
  "Reserva de Emergência",
  "Viagem",
  "Carro",
  "Casa Própria",
  "Aposentadoria",
  "Educação",
  "Investimento",
  "Reforma",
  "Casamento",
  "Outros"
];

export default function NovaMetaModal({
  open,
  onOpenChange,
  onMetaAdicionada
}: NovaMetaModalProps) {
  const [nome, setNome] = useState("");
  const [valorMeta, setValorMeta] = useState("");
  const [valorAtual, setValorAtual] = useState("");
  const [prazo, setPrazo] = useState<Date>();
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valorMensal, setValorMensal] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !valorMeta || !prazo) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome, valor da meta e prazo.",
        variant: "destructive"
      });
      return;
    }

    const valorMetaNum = parseFloat(valorMeta.replace(/[^\d,]/g, '').replace(',', '.'));
    const valorAtualNum = parseFloat(valorAtual.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const valorMensalNum = parseFloat(valorMensal.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

    if (valorMetaNum <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor da meta deve ser maior que zero.",
        variant: "destructive"
      });
      return;
    }

    if (valorAtualNum > valorMetaNum) {
      toast({
        title: "Valor atual inválido",
        description: "O valor atual não pode ser maior que a meta.",
        variant: "destructive"
      });
      return;
    }

    const novaMeta = {
      id: Date.now().toString(),
      nome,
      valorMeta: valorMetaNum,
      valorAtual: valorAtualNum,
      prazo: format(prazo, "MMM yyyy", { locale: ptBR }),
      dataLimite: format(prazo, 'yyyy-MM-dd'),
      categoria: categoria || "Outros",
      descricao,
      valorMensal: valorMensalNum,
      dataCriacao: new Date().toISOString(),
      status: "ativa"
    };

    onMetaAdicionada(novaMeta);
    
    toast({
      title: "Meta criada!",
      description: "A meta foi criada com sucesso."
    });

    // Reset form
    setNome("");
    setValorMeta("");
    setValorAtual("");
    setPrazo(undefined);
    setCategoria("");
    setDescricao("");
    setValorMensal("");
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

  const calcularValorMensalSugerido = () => {
    if (!valorMeta || !valorAtual || !prazo) return;

    const valorMetaNum = parseFloat(valorMeta.replace(/[^\d,]/g, '').replace(',', '.'));
    const valorAtualNum = parseFloat(valorAtual.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const valorRestante = valorMetaNum - valorAtualNum;
    
    const hoje = new Date();
    const mesesRestantes = (prazo.getFullYear() - hoje.getFullYear()) * 12 + (prazo.getMonth() - hoje.getMonth());
    
    if (mesesRestantes > 0 && valorRestante > 0) {
      const valorMensalSugerido = valorRestante / mesesRestantes;
      setValorMensal(formatCurrency(valorMensalSugerido.toString()));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Nova Meta Financeira
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Meta *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Reserva de Emergência"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {tiposMetaComuns.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorMeta">Valor da Meta *</Label>
              <Input
                id="valorMeta"
                value={valorMeta}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value);
                  setValorMeta(formatted);
                }}
                placeholder="R$ 0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorAtual">Valor Atual</Label>
              <Input
                id="valorAtual"
                value={valorAtual}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value);
                  setValorAtual(formatted);
                }}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prazo para Atingir *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {prazo ? (
                      format(prazo, "MMM yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione o prazo</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={prazo}
                    onSelect={setPrazo}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorMensal">
                Valor Mensal Sugerido
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-auto p-1 text-xs"
                  onClick={calcularValorMensalSugerido}
                >
                  Calcular
                </Button>
              </Label>
              <Input
                id="valorMensal"
                value={valorMensal}
                onChange={(e) => {
                  const formatted = formatCurrency(e.target.value);
                  setValorMensal(formatted);
                }}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (opcional)</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva sua meta e como pretende alcançá-la..."
              rows={3}
            />
          </div>

          {/* Resumo da Meta */}
          {valorMeta && valorAtual && prazo && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Resumo da Meta
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Valor a alcançar:</span>
                  <div className="font-medium">
                    {(() => {
                      const meta = parseFloat(valorMeta.replace(/[^\d,]/g, '').replace(',', '.'));
                      const atual = parseFloat(valorAtual.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
                      const restante = meta - atual;
                      return restante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    })()}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Progresso atual:</span>
                  <div className="font-medium">
                    {(() => {
                      const meta = parseFloat(valorMeta.replace(/[^\d,]/g, '').replace(',', '.'));
                      const atual = parseFloat(valorAtual.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
                      const percentual = (atual / meta) * 100;
                      return `${percentual.toFixed(1)}%`;
                    })()}
                  </div>
                </div>
              </div>
            </div>
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
              <Target className="h-4 w-4 mr-2" />
              Criar Meta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}