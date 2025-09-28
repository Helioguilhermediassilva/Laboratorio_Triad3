import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EditarBemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bem: any;
  onBemEditado: (bem: any) => void;
}

export default function EditarBemModal({
  open,
  onOpenChange,
  bem,
  onBemEditado
}: EditarBemModalProps) {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [endereco, setEndereco] = useState("");
  const [valor, setValor] = useState("");
  const [dataAquisicao, setDataAquisicao] = useState<Date>();
  const [status, setStatus] = useState("");
  const [condicao, setCondicao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const { toast } = useToast();

  // Populate form with existing data when bem changes
  useEffect(() => {
    if (bem) {
      setNome(bem.nome || "");
      setCategoria(bem.categoria || "");
      setEndereco(bem.endereco || "");
      setValor(bem.valor ? formatCurrency(bem.valor.toString()) : "");
      setDataAquisicao(bem.dataAquisicao ? new Date(bem.dataAquisicao) : undefined);
      setStatus(bem.status || "");
      setCondicao(bem.condicao || "");
      setObservacoes(bem.observacoes || "");
    }
  }, [bem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !categoria || !endereco || !valor || !dataAquisicao || !status || !condicao) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const bemEditado = {
      ...bem,
      nome,
      categoria,
      endereco,
      valor: parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.')),
      dataAquisicao: format(dataAquisicao, 'yyyy-MM-dd'),
      status,
      condicao,
      observacoes
    };

    onBemEditado(bemEditado);
    
    toast({
      title: "Bem atualizado!",
      description: "As alterações foram salvas com sucesso."
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

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatCurrency(inputValue);
    setValor(formattedValue);
  };

  if (!bem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Bem
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Bem *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Apartamento Centro"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select value={categoria} onValueChange={setCategoria} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Imóvel">Imóvel</SelectItem>
                  <SelectItem value="Veículo">Veículo</SelectItem>
                  <SelectItem value="Equipamento">Equipamento</SelectItem>
                  <SelectItem value="Móveis">Móveis</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço/Localização *</Label>
            <Input
              id="endereco"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Ex: Rua das Flores, 123 - Centro"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor Estimado *</Label>
              <Input
                id="valor"
                value={valor}
                onChange={handleValorChange}
                placeholder="R$ 0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Aquisição *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataAquisicao ? (
                      format(dataAquisicao, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataAquisicao}
                    onSelect={setDataAquisicao}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={setStatus} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Próprio">Próprio</SelectItem>
                  <SelectItem value="Financiado">Financiado</SelectItem>
                  <SelectItem value="Alugado">Alugado</SelectItem>
                  <SelectItem value="Comodato">Comodato</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condicao">Condição *</Label>
              <Select value={condicao} onValueChange={setCondicao} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a condição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excelente">Excelente</SelectItem>
                  <SelectItem value="Boa">Boa</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Precisa Reforma">Precisa Reforma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Informações adicionais sobre o bem..."
              rows={3}
            />
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