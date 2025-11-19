import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

interface Beneficiario {
  nome: string;
  cpf: string;
  parentesco: string;
  percentual_heranca: string;
  bens_incluidos: string;
  observacoes: string;
}

const testamentoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  tipo: z.string().min(1, "Tipo é obrigatório"),
  dataElaboracao: z.string().min(1, "Data de elaboração é obrigatória"),
  estadoCivil: z.string().min(1, "Estado civil é obrigatório"),
  regimeBens: z.string().optional(),
  nomeConjuge: z.string().optional(),
  cartorio: z.string().optional(),
  observacoes: z.string().optional(),
}).refine((data) => {
  // Se for casado ou união estável, regime de bens é obrigatório
  if (data.estadoCivil === "Casado(a)" || data.estadoCivil === "União Estável") {
    return !!data.regimeBens;
  }
  return true;
}, {
  message: "Regime de bens é obrigatório para casados ou em união estável",
  path: ["regimeBens"],
});

const beneficiarioSchema = z.object({
  nome: z.string().min(1, "Nome do beneficiário é obrigatório"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos"),
  parentesco: z.string().min(1, "Parentesco é obrigatório"),
  percentual_heranca: z.string().min(1, "Percentual é obrigatório"),
  bens_incluidos: z.string().min(1, "Bens incluídos são obrigatórios"),
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
    estadoCivil: "",
    regimeBens: "",
    nomeConjuge: "",
    cartorio: "",
    observacoes: "",
  });
  const [beneficiarios, setBeneficiarios] = useState<Beneficiario[]>([
    {
      nome: "",
      cpf: "",
      parentesco: "",
      percentual_heranca: "",
      bens_incluidos: "",
      observacoes: "",
    }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [beneficiarioErrors, setBeneficiarioErrors] = useState<Record<number, Record<string, string>>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        cartorio: formData.cartorio || null
      };

      // Validate testamento data
      testamentoSchema.parse(data);

      // Validate beneficiarios
      const newBeneficiarioErrors: Record<number, Record<string, string>> = {};
      let hasBeneficiarioErrors = false;

      beneficiarios.forEach((ben, index) => {
        try {
          beneficiarioSchema.parse(ben);
        } catch (error) {
          if (error instanceof z.ZodError) {
            const benErrors: Record<string, string> = {};
            error.errors.forEach((err) => {
              if (err.path[0]) {
                benErrors[err.path[0] as string] = err.message;
              }
            });
            newBeneficiarioErrors[index] = benErrors;
            hasBeneficiarioErrors = true;
          }
        }
      });

      if (hasBeneficiarioErrors) {
        setBeneficiarioErrors(newBeneficiarioErrors);
        toast({
          title: "Erro de validação",
          description: "Por favor, corrija os erros nos beneficiários.",
          variant: "destructive",
        });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado.",
          variant: "destructive",
        });
        return;
      }

      // Insert testamento
      const { data: testamentoData, error: testamentoError } = await supabase
        .from('testamentos')
        .insert({
          user_id: user.id,
          titulo: data.titulo,
          tipo: data.tipo,
          data_elaboracao: data.dataElaboracao,
          cartorio: data.cartorio,
          estado_civil: data.estadoCivil,
          regime_bens: data.regimeBens || null,
          nome_conjuge: data.nomeConjuge || null,
          observacoes: data.observacoes,
          status: 'Rascunho',
        })
        .select()
        .single();

      if (testamentoError) {
        throw testamentoError;
      }

      // Insert beneficiarios
      const beneficiariosToInsert = beneficiarios.map(ben => ({
        testamento_id: testamentoData.id,
        nome: ben.nome,
        cpf: ben.cpf,
        parentesco: ben.parentesco,
        percentual_heranca: parseFloat(ben.percentual_heranca),
        observacoes: `Bens: ${ben.bens_incluidos}\n\n${ben.observacoes || ''}`.trim(),
      }));

      const { error: beneficiariosError } = await supabase
        .from('beneficiarios_testamento')
        .insert(beneficiariosToInsert);

      if (beneficiariosError) {
        throw beneficiariosError;
      }

      onAdd(testamentoData);
      setOpen(false);
      setFormData({
        titulo: "",
        tipo: "",
        dataElaboracao: "",
        estadoCivil: "",
        regimeBens: "",
        nomeConjuge: "",
        cartorio: "",
        observacoes: "",
      });
      setBeneficiarios([{
        nome: "",
        cpf: "",
        parentesco: "",
        percentual_heranca: "",
        bens_incluidos: "",
        observacoes: "",
      }]);
      setErrors({});
      setBeneficiarioErrors({});

      toast({
        title: "Testamento criado!",
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
      } else {
        toast({
          title: "Erro ao criar testamento",
          description: "Ocorreu um erro ao salvar o testamento.",
          variant: "destructive",
        });
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleBeneficiarioChange = (index: number, field: keyof Beneficiario, value: string) => {
    const newBeneficiarios = [...beneficiarios];
    newBeneficiarios[index] = { ...newBeneficiarios[index], [field]: value };
    setBeneficiarios(newBeneficiarios);

    // Clear error for this field
    if (beneficiarioErrors[index]?.[field]) {
      const newErrors = { ...beneficiarioErrors };
      delete newErrors[index][field];
      if (Object.keys(newErrors[index]).length === 0) {
        delete newErrors[index];
      }
      setBeneficiarioErrors(newErrors);
    }
  };

  const addBeneficiario = () => {
    setBeneficiarios([...beneficiarios, {
      nome: "",
      cpf: "",
      parentesco: "",
      percentual_heranca: "",
      bens_incluidos: "",
      observacoes: "",
    }]);
  };

  const removeBeneficiario = (index: number) => {
    if (beneficiarios.length > 1) {
      const newBeneficiarios = beneficiarios.filter((_, i) => i !== index);
      setBeneficiarios(newBeneficiarios);
      
      // Remove errors for this beneficiario
      const newErrors = { ...beneficiarioErrors };
      delete newErrors[index];
      setBeneficiarioErrors(newErrors);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Testamento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações do Testamento</h3>
            
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
                <Label htmlFor="cartorio">Cartório (Opcional)</Label>
                <Input
                  id="cartorio"
                  value={formData.cartorio}
                  onChange={(e) => handleInputChange("cartorio", e.target.value)}
                  placeholder="Ex: 1º Tabelionato de Notas"
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-sm">Situação Civil do Testador</h4>
              
              <div className="space-y-2">
                <Label htmlFor="estadoCivil">Estado Civil</Label>
                <Select
                  value={formData.estadoCivil}
                  onValueChange={(value) => {
                    handleInputChange("estadoCivil", value);
                    // Limpar campos de cônjuge se não for casado/união estável
                    if (value !== "Casado(a)" && value !== "União Estável") {
                      handleInputChange("regimeBens", "");
                      handleInputChange("nomeConjuge", "");
                    }
                  }}
                >
                  <SelectTrigger className={errors.estadoCivil ? "border-red-500" : ""}>
                    <SelectValue placeholder="Selecione o estado civil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                    <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                    <SelectItem value="União Estável">União Estável</SelectItem>
                    <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                    <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.estadoCivil && <p className="text-sm text-red-500">{errors.estadoCivil}</p>}
              </div>

              {(formData.estadoCivil === "Casado(a)" || formData.estadoCivil === "União Estável") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="regimeBens">Regime de Bens</Label>
                    <Select
                      value={formData.regimeBens}
                      onValueChange={(value) => handleInputChange("regimeBens", value)}
                    >
                      <SelectTrigger className={errors.regimeBens ? "border-red-500" : ""}>
                        <SelectValue placeholder="Selecione o regime de bens" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Comunhão Universal de Bens">
                          Comunhão Universal de Bens
                        </SelectItem>
                        <SelectItem value="Comunhão Parcial de Bens">
                          Comunhão Parcial de Bens
                        </SelectItem>
                        <SelectItem value="Participação Final nos Aquestos">
                          Participação Final nos Aquestos
                        </SelectItem>
                        <SelectItem value="Separação de Bens (Convencional)">
                          Separação de Bens (Convencional)
                        </SelectItem>
                        <SelectItem value="Separação de Bens (Obrigatória/Legal)">
                          Separação de Bens (Obrigatória/Legal)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.regimeBens && <p className="text-sm text-red-500">{errors.regimeBens}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nomeConjuge">
                      Nome do(a) {formData.estadoCivil === "Casado(a)" ? "Cônjuge" : "Companheiro(a)"} (Opcional)
                    </Label>
                    <Input
                      id="nomeConjuge"
                      value={formData.nomeConjuge}
                      onChange={(e) => handleInputChange("nomeConjuge", e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações Gerais (Opcional)</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange("observacoes", e.target.value)}
                placeholder="Observações adicionais sobre o testamento"
                rows={3}
              />
            </div>
          </div>

          {/* Beneficiários */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Beneficiários</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBeneficiario}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Beneficiário
              </Button>
            </div>

            {beneficiarios.map((beneficiario, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                {beneficiarios.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeBeneficiario(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}

                <h4 className="font-medium text-sm text-muted-foreground">
                  Beneficiário {index + 1}
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`nome-${index}`}>Nome Completo</Label>
                    <Input
                      id={`nome-${index}`}
                      value={beneficiario.nome}
                      onChange={(e) => handleBeneficiarioChange(index, "nome", e.target.value)}
                      placeholder="Nome do beneficiário"
                      className={beneficiarioErrors[index]?.nome ? "border-red-500" : ""}
                    />
                    {beneficiarioErrors[index]?.nome && (
                      <p className="text-sm text-red-500">{beneficiarioErrors[index].nome}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`cpf-${index}`}>CPF</Label>
                    <Input
                      id={`cpf-${index}`}
                      value={beneficiario.cpf}
                      onChange={(e) => handleBeneficiarioChange(index, "cpf", e.target.value)}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={beneficiarioErrors[index]?.cpf ? "border-red-500" : ""}
                    />
                    {beneficiarioErrors[index]?.cpf && (
                      <p className="text-sm text-red-500">{beneficiarioErrors[index].cpf}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`parentesco-${index}`}>Parentesco</Label>
                    <Input
                      id={`parentesco-${index}`}
                      value={beneficiario.parentesco}
                      onChange={(e) => handleBeneficiarioChange(index, "parentesco", e.target.value)}
                      placeholder="Ex: Filho, Cônjuge, Irmão"
                      className={beneficiarioErrors[index]?.parentesco ? "border-red-500" : ""}
                    />
                    {beneficiarioErrors[index]?.parentesco && (
                      <p className="text-sm text-red-500">{beneficiarioErrors[index].parentesco}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`percentual-${index}`}>Percentual da Herança (%)</Label>
                    <Input
                      id={`percentual-${index}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={beneficiario.percentual_heranca}
                      onChange={(e) => handleBeneficiarioChange(index, "percentual_heranca", e.target.value)}
                      placeholder="Ex: 50"
                      className={beneficiarioErrors[index]?.percentual_heranca ? "border-red-500" : ""}
                    />
                    {beneficiarioErrors[index]?.percentual_heranca && (
                      <p className="text-sm text-red-500">{beneficiarioErrors[index].percentual_heranca}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`bens-${index}`}>Bens Incluídos</Label>
                  <Textarea
                    id={`bens-${index}`}
                    value={beneficiario.bens_incluidos}
                    onChange={(e) => handleBeneficiarioChange(index, "bens_incluidos", e.target.value)}
                    placeholder="Descreva os bens destinados a este beneficiário"
                    rows={3}
                    className={beneficiarioErrors[index]?.bens_incluidos ? "border-red-500" : ""}
                  />
                  {beneficiarioErrors[index]?.bens_incluidos && (
                    <p className="text-sm text-red-500">{beneficiarioErrors[index].bens_incluidos}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`obs-${index}`}>Observações (Opcional)</Label>
                  <Textarea
                    id={`obs-${index}`}
                    value={beneficiario.observacoes}
                    onChange={(e) => handleBeneficiarioChange(index, "observacoes", e.target.value)}
                    placeholder="Observações específicas sobre este beneficiário"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
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