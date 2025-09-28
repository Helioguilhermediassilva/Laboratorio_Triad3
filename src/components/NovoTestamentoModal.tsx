import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const testamentoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  dataElaboracao: z.string().min(1, "Data de elaboração é obrigatória"),
  cartorio: z.string().optional(),
  testamenteiro: z.string().min(1, "Testamenteiro é obrigatório"),
  beneficiarios: z.string().min(1, "Pelo menos um beneficiário é obrigatório"),
  bensIncluidos: z.string().min(1, "Pelo menos um bem deve ser incluído"),
  observacoes: z.string().optional(),
});

interface NovoTestamentoModalProps {
  children: React.ReactNode;
  onAdd: (testamento: any) => void;
}

export default function NovoTestamentoModal({ children, onAdd }: NovoTestamentoModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    titulo: "",
    tipo: "",
    dataElaboracao: "",
    cartorio: "",
    testamenteiro: "",
    beneficiarios: "",
    bensIncluidos: "",
    observacoes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        cartorio: formData.cartorio || "-"
      };

      testamentoSchema.parse(data);

      const novoTestamento = {
        id: Date.now(),
        titulo: data.titulo,
        tipo: data.tipo,
        dataElaboracao: data.dataElaboracao,
        ultimaAtualizacao: data.dataElaboracao,
        cartorio: data.cartorio,
        testamenteiro: data.testamenteiro,
        status: "Rascunho",
        beneficiarios: data.beneficiarios.split(',').map(b => b.trim()).filter(b => b),
        bensIncluidos: data.bensIncluidos.split('\n').map(b => b.trim()).filter(b => b),
        observacoes: data.observacoes
      };

      onAdd(novoTestamento);
      setOpen(false);
      setFormData({
        titulo: "",
        tipo: "",
        dataElaboracao: "",
        cartorio: "",
        testamenteiro: "",
        beneficiarios: "",
        bensIncluidos: "",
        observacoes: "",
      });
      setErrors({});

      toast({
        title: "Testamento adicionado!",
        description: "O novo testamento foi criado com sucesso.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Testamento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título do Testamento</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleInputChange("titulo", e.target.value)}
                placeholder="Ex: Testamento Principal"
                className={errors.titulo ? "border-red-500" : ""}
              />
              {errors.titulo && <p className="text-sm text-red-500">{errors.titulo}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Testamento</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => handleInputChange("tipo", value)}
              >
                <SelectTrigger className={errors.tipo ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Testamento Público">Testamento Público</SelectItem>
                  <SelectItem value="Testamento Particular">Testamento Particular</SelectItem>
                  <SelectItem value="Testamento Cerrado">Testamento Cerrado</SelectItem>
                  <SelectItem value="Codicilo">Codicilo</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo && <p className="text-sm text-red-500">{errors.tipo}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataElaboracao">Data de Elaboração</Label>
              <Input
                id="dataElaboracao"
                type="date"
                value={formData.dataElaboracao}
                onChange={(e) => handleInputChange("dataElaboracao", e.target.value)}
                className={errors.dataElaboracao ? "border-red-500" : ""}
              />
              {errors.dataElaboracao && <p className="text-sm text-red-500">{errors.dataElaboracao}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="testamenteiro">Testamenteiro</Label>
              <Input
                id="testamenteiro"
                value={formData.testamenteiro}
                onChange={(e) => handleInputChange("testamenteiro", e.target.value)}
                placeholder="Nome do testamenteiro"
                className={errors.testamenteiro ? "border-red-500" : ""}
              />
              {errors.testamenteiro && <p className="text-sm text-red-500">{errors.testamenteiro}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cartorio">Cartório (Opcional)</Label>
            <Input
              id="cartorio"
              value={formData.cartorio}
              onChange={(e) => handleInputChange("cartorio", e.target.value)}
              placeholder="Ex: 1º Tabelionato de Notas - São Paulo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficiarios">Beneficiários</Label>
            <Textarea
              id="beneficiarios"
              value={formData.beneficiarios}
              onChange={(e) => handleInputChange("beneficiarios", e.target.value)}
              placeholder="Separe os nomes por vírgula&#10;Ex: João Silva, Maria Santos, Pedro Costa"
              rows={3}
              className={errors.beneficiarios ? "border-red-500" : ""}
            />
            {errors.beneficiarios && <p className="text-sm text-red-500">{errors.beneficiarios}</p>}
            <p className="text-xs text-muted-foreground">Separe os nomes por vírgula</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bensIncluidos">Bens Incluídos</Label>
            <Textarea
              id="bensIncluidos"
              value={formData.bensIncluidos}
              onChange={(e) => handleInputChange("bensIncluidos", e.target.value)}
              placeholder="Um bem por linha&#10;Ex:&#10;Apartamento - Rua das Flores, 123&#10;Conta Corrente - Banco do Brasil&#10;Investimentos CDB"
              rows={4}
              className={errors.bensIncluidos ? "border-red-500" : ""}
            />
            {errors.bensIncluidos && <p className="text-sm text-red-500">{errors.bensIncluidos}</p>}
            <p className="text-xs text-muted-foreground">Coloque um bem por linha</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (Opcional)</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
              placeholder="Informações adicionais sobre o testamento..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Testamento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}