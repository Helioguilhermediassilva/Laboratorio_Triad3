import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const testamentoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  dataElaboracao: z.string().min(1, "Data de elaboração é obrigatória"),
  estadoCivil: z.string().min(1, "Estado civil é obrigatório"),
  regimeBens: z.string().optional(),
  nomeConjuge: z.string().optional(),
  cartorio: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.string().min(1, "Status é obrigatório"),
});

interface EditarTestamentoModalProps {
  children: React.ReactNode;
  testamento: any;
  onEdit: (testamento: any) => void;
}

export default function EditarTestamentoModal({ children, testamento, onEdit }: EditarTestamentoModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    titulo: "",
    tipo: "",
    dataElaboracao: "",
    estadoCivil: "",
    regimeBens: "",
    nomeConjuge: "",
    cartorio: "",
    observacoes: "",
    status: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (testamento && open) {
      setFormData({
        titulo: testamento.titulo || "",
        tipo: testamento.tipo || "",
        dataElaboracao: testamento.data_elaboracao || "",
        estadoCivil: testamento.estado_civil || "",
        regimeBens: testamento.regime_bens || "",
        nomeConjuge: testamento.nome_conjuge || "",
        cartorio: testamento.cartorio || "",
        observacoes: testamento.observacoes || "",
        status: testamento.status || "Vigente",
      });
    }
  }, [testamento, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = {
        ...formData,
        cartorio: formData.cartorio || null
      };

      testamentoSchema.parse(data);

      const { error } = await supabase
        .from('testamentos')
        .update({
          titulo: data.titulo,
          tipo: data.tipo,
          data_elaboracao: data.dataElaboracao,
          cartorio: data.cartorio,
          estado_civil: data.estadoCivil,
          regime_bens: data.regimeBens || null,
          nome_conjuge: data.nomeConjuge || null,
          observacoes: data.observacoes,
          status: data.status,
        })
        .eq('id', testamento.id);

      if (error) {
        throw error;
      }

      onEdit(testamento);
      setOpen(false);
      setErrors({});

      toast({
        title: "Testamento atualizado!",
        description: "As alterações foram salvas com sucesso.",
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
      } else {
        console.error("Error updating testamento:", error);
        toast({
          title: "Erro ao atualizar",
          description: "Ocorreu um erro ao salvar as alterações.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const showRegimeBens = formData.estadoCivil === "Casado(a)" || formData.estadoCivil === "União Estável";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Testamento</DialogTitle>
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
                  <SelectItem value="Público">Testamento Público</SelectItem>
                  <SelectItem value="Particular">Testamento Particular</SelectItem>
                  <SelectItem value="Cerrado">Testamento Cerrado</SelectItem>
                  <SelectItem value="Vital">Testamento Vital</SelectItem>
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
              <Label htmlFor="cartorio">Cartório</Label>
              <Input
                id="cartorio"
                value={formData.cartorio}
                onChange={(e) => handleInputChange("cartorio", e.target.value)}
                placeholder="Ex: 1º Tabelionato de Notas"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estadoCivil">Estado Civil</Label>
              <Select
                value={formData.estadoCivil}
                onValueChange={(value) => handleInputChange("estadoCivil", value)}
              >
                <SelectTrigger className={errors.estadoCivil ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecione o estado civil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                  <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                  <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                  <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                  <SelectItem value="União Estável">União Estável</SelectItem>
                </SelectContent>
              </Select>
              {errors.estadoCivil && <p className="text-sm text-red-500">{errors.estadoCivil}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vigente">Vigente</SelectItem>
                  <SelectItem value="Revogado">Revogado</SelectItem>
                  <SelectItem value="Modificado">Modificado</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
            </div>
          </div>

          {showRegimeBens && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regimeBens">Regime de Bens</Label>
                <Select
                  value={formData.regimeBens}
                  onValueChange={(value) => handleInputChange("regimeBens", value)}
                >
                  <SelectTrigger className={errors.regimeBens ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione o regime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Comunhão Universal de Bens">Comunhão Universal de Bens</SelectItem>
                    <SelectItem value="Comunhão Parcial de Bens">Comunhão Parcial de Bens</SelectItem>
                    <SelectItem value="Separação de Bens (Convencional)">Separação de Bens (Convencional)</SelectItem>
                    <SelectItem value="Separação de Bens (Obrigatória/Legal)">Separação de Bens (Obrigatória/Legal)</SelectItem>
                    <SelectItem value="Participação Final nos Aquestos">Participação Final nos Aquestos</SelectItem>
                  </SelectContent>
                </Select>
                {errors.regimeBens && <p className="text-sm text-red-500">{errors.regimeBens}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nomeConjuge">Nome do Cônjuge</Label>
                <Input
                  id="nomeConjuge"
                  value={formData.nomeConjuge}
                  onChange={(e) => handleInputChange("nomeConjuge", e.target.value)}
                  placeholder="Nome do cônjuge"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleInputChange("observacoes", e.target.value)}
              placeholder="Informações adicionais sobre o testamento..."
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
