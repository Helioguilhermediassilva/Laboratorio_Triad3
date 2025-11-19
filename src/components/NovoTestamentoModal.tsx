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

interface PartilhaBem {
  beneficiario_nome: string;
  percentual: string;
}

interface Bem {
  descricao: string;
  valor_estimado: string;
  tipo_bem: string; // "Comum" ou "Particular"
  partilhas: PartilhaBem[];
}

interface Beneficiario {
  nome: string;
  cpf: string;
  parentesco: string;
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

const partilhaBemSchema = z.object({
  beneficiario_nome: z.string().min(1, "Beneficiário é obrigatório"),
  percentual: z.string().min(1, "Percentual é obrigatório"),
});

const bemSchema = z.object({
  descricao: z.string().min(1, "Descrição do bem é obrigatória"),
  valor_estimado: z.string().optional(),
  tipo_bem: z.string().min(1, "Tipo do bem é obrigatório"),
  partilhas: z.array(partilhaBemSchema).min(1, "Pelo menos um beneficiário deve receber este bem"),
});

const beneficiarioSchema = z.object({
  nome: z.string().min(1, "Nome do beneficiário é obrigatório"),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos"),
  parentesco: z.string().min(1, "Parentesco é obrigatório"),
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
      observacoes: "",
    }
  ]);
  const [bens, setBens] = useState<Bem[]>([
    {
      descricao: "",
      valor_estimado: "",
      tipo_bem: "",
      partilhas: [{ beneficiario_nome: "", percentual: "" }]
    }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [beneficiarioErrors, setBeneficiarioErrors] = useState<Record<number, Record<string, string>>>({});
  const [bemErrors, setBemErrors] = useState<Record<number, Record<string, string>>>({});

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

      // Validate bens
      const newBemErrors: Record<number, Record<string, string>> = {};
      let hasBemErrors = false;

      bens.forEach((bem, index) => {
        try {
          bemSchema.parse(bem);
          
          // Validar soma de percentuais
          const totalPercentual = bem.partilhas.reduce((sum, p) => sum + parseFloat(p.percentual || "0"), 0);
          const maxPercentual = bem.tipo_bem === "Comum" && (formData.estadoCivil === "Casado(a)" || formData.estadoCivil === "União Estável") 
            ? 50 // Se for bem comum, apenas 50% disponível
            : 100; // Se for particular, 100% disponível
          
          if (totalPercentual > maxPercentual) {
            newBemErrors[index] = { 
              partilhas: `A soma dos percentuais (${totalPercentual}%) excede o disponível para partilha (${maxPercentual}%)` 
            };
            hasBemErrors = true;
          }
        } catch (error) {
          if (error instanceof z.ZodError) {
            const benErrs: Record<string, string> = {};
            error.errors.forEach((err) => {
              if (err.path[0]) {
                benErrs[err.path[0] as string] = err.message;
              }
            });
            newBemErrors[index] = benErrs;
            hasBemErrors = true;
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

      if (hasBemErrors) {
        setBemErrors(newBemErrors);
        toast({
          title: "Erro de validação dos bens",
          description: "Por favor, corrija os erros na partilha dos bens.",
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
        percentual_heranca: 0, // Será calculado com base nos bens
        observacoes: ben.observacoes || null,
      }));

      const { error: beneficiariosError } = await supabase
        .from('beneficiarios_testamento')
        .insert(beneficiariosToInsert);

      if (beneficiariosError) {
        throw beneficiariosError;
      }

      // Formatar bens para salvar nas observações do testamento
      const bensFormatados = bens.map((bem, idx) => {
        const partilhasText = bem.partilhas
          .map(p => `  - ${p.beneficiario_nome}: ${p.percentual}%`)
          .join('\n');
        
        const percentualConjuge = bem.tipo_bem === "Comum" && formData.nomeConjuge 
          ? `\n  - ${formData.nomeConjuge} (Cônjuge): 50% (meação)`
          : '';
        
        return `Bem ${idx + 1}: ${bem.descricao}
Tipo: ${bem.tipo_bem}
${bem.valor_estimado ? `Valor Estimado: R$ ${bem.valor_estimado}` : ''}
Partilha:${percentualConjuge}
${partilhasText}`;
      }).join('\n\n');

      // Atualizar observações do testamento com os bens
      const observacoesCompletas = `${data.observacoes ? data.observacoes + '\n\n' : ''}BENS E PARTILHAS:\n\n${bensFormatados}`;
      
      await supabase
        .from('testamentos')
        .update({ observacoes: observacoesCompletas })
        .eq('id', testamentoData.id);

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
        observacoes: "",
      }]);
      setBens([{
        descricao: "",
        valor_estimado: "",
        tipo_bem: "",
        partilhas: [{ beneficiario_nome: "", percentual: "" }]
      }]);
      setErrors({});
      setBeneficiarioErrors({});
      setBemErrors({});

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
      observacoes: "",
    }]);
  };

  const addBem = () => {
    setBens([...bens, {
      descricao: "",
      valor_estimado: "",
      tipo_bem: "",
      partilhas: [{ beneficiario_nome: "", percentual: "" }]
    }]);
  };

  const removeBem = (bemIndex: number) => {
    if (bens.length > 1) {
      setBens(bens.filter((_, i) => i !== bemIndex));
      
      // Remove errors for this bem
      const newErrors = { ...bemErrors };
      delete newErrors[bemIndex];
      setBemErrors(newErrors);
    }
  };

  const handleBemChange = (bemIndex: number, field: keyof Bem, value: string) => {
    const newBens = [...bens];
    newBens[bemIndex] = { ...newBens[bemIndex], [field]: value };
    setBens(newBens);

    // Clear error
    if (bemErrors[bemIndex]?.[field]) {
      const newErrors = { ...bemErrors };
      delete newErrors[bemIndex][field];
      if (Object.keys(newErrors[bemIndex]).length === 0) {
        delete newErrors[bemIndex];
      }
      setBemErrors(newErrors);
    }
  };

  const handlePartilhaChange = (bemIndex: number, partilhaIndex: number, field: keyof PartilhaBem, value: string) => {
    const newBens = [...bens];
    newBens[bemIndex].partilhas[partilhaIndex] = {
      ...newBens[bemIndex].partilhas[partilhaIndex],
      [field]: value
    };
    setBens(newBens);
  };

  const addPartilha = (bemIndex: number) => {
    const newBens = [...bens];
    newBens[bemIndex].partilhas.push({ beneficiario_nome: "", percentual: "" });
    setBens(newBens);
  };

  const removePartilha = (bemIndex: number, partilhaIndex: number) => {
    const newBens = [...bens];
    if (newBens[bemIndex].partilhas.length > 1) {
      newBens[bemIndex].partilhas = newBens[bemIndex].partilhas.filter((_, i) => i !== partilhaIndex);
      setBens(newBens);
    }
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

          {/* Bens e Partilhas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Bens e Partilhas</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBem}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Bem
              </Button>
            </div>

            {bens.map((bem, bemIndex) => (
              <div key={bemIndex} className="border-2 rounded-lg p-4 space-y-4 relative bg-muted/20">
                {bens.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeBem(bemIndex)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}

                <h4 className="font-medium text-sm text-muted-foreground">
                  Bem {bemIndex + 1}
                </h4>

                <div className="space-y-2">
                  <Label htmlFor={`bem-desc-${bemIndex}`}>Descrição do Bem</Label>
                  <Textarea
                    id={`bem-desc-${bemIndex}`}
                    value={bem.descricao}
                    onChange={(e) => handleBemChange(bemIndex, "descricao", e.target.value)}
                    placeholder="Ex: Imóvel residencial localizado na Rua X, nº 123, Bairro Y, Cidade Z"
                    rows={3}
                    className={bemErrors[bemIndex]?.descricao ? "border-red-500" : ""}
                  />
                  {bemErrors[bemIndex]?.descricao && (
                    <p className="text-sm text-red-500">{bemErrors[bemIndex].descricao}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`bem-valor-${bemIndex}`}>Valor Estimado (Opcional)</Label>
                    <Input
                      id={`bem-valor-${bemIndex}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={bem.valor_estimado}
                      onChange={(e) => handleBemChange(bemIndex, "valor_estimado", e.target.value)}
                      placeholder="Ex: 500000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`bem-tipo-${bemIndex}`}>Tipo do Bem</Label>
                    <Select
                      value={bem.tipo_bem}
                      onValueChange={(value) => handleBemChange(bemIndex, "tipo_bem", value)}
                    >
                      <SelectTrigger className={bemErrors[bemIndex]?.tipo_bem ? "border-red-500" : ""}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Comum">Comum (do casal)</SelectItem>
                        <SelectItem value="Particular">Particular</SelectItem>
                      </SelectContent>
                    </Select>
                    {bemErrors[bemIndex]?.tipo_bem && (
                      <p className="text-sm text-red-500">{bemErrors[bemIndex].tipo_bem}</p>
                    )}
                  </div>
                </div>

                {bem.tipo_bem === "Comum" && formData.nomeConjuge && (
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded p-3 text-sm">
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      Meação: {formData.nomeConjuge} tem direito a 50% deste bem (comunhão de bens)
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      Você pode partilhar os outros 50% entre os beneficiários abaixo
                    </p>
                  </div>
                )}

                {/* Partilhas */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      Partilha entre Beneficiários
                      {bem.tipo_bem === "Comum" && formData.nomeConjuge && (
                        <span className="text-muted-foreground ml-2">(máximo 50%)</span>
                      )}
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addPartilha(bemIndex)}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Adicionar Beneficiário
                    </Button>
                  </div>

                  {bem.partilhas.map((partilha, partilhaIndex) => (
                    <div key={partilhaIndex} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Select
                          value={partilha.beneficiario_nome}
                          onValueChange={(value) => handlePartilhaChange(bemIndex, partilhaIndex, "beneficiario_nome", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o beneficiário" />
                          </SelectTrigger>
                          <SelectContent>
                            {beneficiarios.map((ben, idx) => (
                              <SelectItem key={idx} value={ben.nome || `beneficiario-${idx}`}>
                                {ben.nome || `Beneficiário ${idx + 1}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="w-32">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={partilha.percentual}
                          onChange={(e) => handlePartilhaChange(bemIndex, partilhaIndex, "percentual", e.target.value)}
                          placeholder="%"
                        />
                      </div>

                      {bem.partilhas.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0"
                          onClick={() => removePartilha(bemIndex, partilhaIndex)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {bemErrors[bemIndex]?.partilhas && (
                    <p className="text-sm text-red-500">{bemErrors[bemIndex].partilhas}</p>
                  )}
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