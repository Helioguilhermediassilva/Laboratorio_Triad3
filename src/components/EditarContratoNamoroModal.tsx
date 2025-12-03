import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ContratoNamoro {
  id: string;
  titulo: string;
  parte_1_nome: string;
  parte_1_cpf: string;
  parte_1_endereco?: string;
  parte_2_nome: string;
  parte_2_cpf: string;
  parte_2_endereco?: string;
  regime_bens: string;
  data_inicio: string;
  deveres_parte_1?: string;
  deveres_parte_2?: string;
  direitos_parte_1?: string;
  direitos_parte_2?: string;
  clausulas_adicionais?: string;
  testemunha_1_nome?: string;
  testemunha_1_cpf?: string;
  testemunha_2_nome?: string;
  testemunha_2_cpf?: string;
  status: string;
}

interface EditarContratoNamoroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato: ContratoNamoro;
  onSuccess: () => void;
}

// CPF validation schema
const cpfSchema = z.string()
  .min(14, "CPF deve ter 11 dígitos")
  .max(14, "CPF inválido")
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Formato de CPF inválido");

const optionalCpfSchema = z.string()
  .optional()
  .refine(
    (val) => !val || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(val),
    "Formato de CPF inválido"
  );

// Format CPF as user types: 000.000.000-00
const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export default function EditarContratoNamoroModal({ open, onOpenChange, contrato, onSuccess }: EditarContratoNamoroModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ContratoNamoro>();

  const handleCPFChange = (field: keyof ContratoNamoro) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setValue(field, formatted);
  };

  useEffect(() => {
    const loadDecryptedData = async () => {
      if (contrato && open) {
        // Decrypt CPF data before displaying
        const [cpf1Result, cpf2Result, testemunha1Result, testemunha2Result] = await Promise.all([
          supabase.rpc('decrypt_cpf', { cpf_encrypted: contrato.parte_1_cpf }),
          supabase.rpc('decrypt_cpf', { cpf_encrypted: contrato.parte_2_cpf }),
          contrato.testemunha_1_cpf ? supabase.rpc('decrypt_cpf', { cpf_encrypted: contrato.testemunha_1_cpf }) : Promise.resolve({ data: null }),
          contrato.testemunha_2_cpf ? supabase.rpc('decrypt_cpf', { cpf_encrypted: contrato.testemunha_2_cpf }) : Promise.resolve({ data: null })
        ]);

        reset({
          ...contrato,
          parte_1_cpf: cpf1Result.data || '',
          parte_2_cpf: cpf2Result.data || '',
          testemunha_1_cpf: testemunha1Result.data || '',
          testemunha_2_cpf: testemunha2Result.data || ''
        });
        setValue("regime_bens", contrato.regime_bens);
        setValue("status", contrato.status);
      }
    };
    loadDecryptedData();
  }, [contrato, open, reset, setValue]);

  const onSubmit = async (data: ContratoNamoro) => {
    try {
      setLoading(true);

      // Validate CPFs client-side
      try {
        cpfSchema.parse(data.parte_1_cpf);
        cpfSchema.parse(data.parte_2_cpf);
        if (data.testemunha_1_cpf) optionalCpfSchema.parse(data.testemunha_1_cpf);
        if (data.testemunha_2_cpf) optionalCpfSchema.parse(data.testemunha_2_cpf);
      } catch (validationError: any) {
        toast({
          title: "Erro de validação",
          description: validationError.errors?.[0]?.message || "CPF inválido",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Encrypt CPF data before updating
      const { data: encryptedCpf1, error: encryptError1 } = await supabase.rpc('encrypt_cpf', { cpf_plain: data.parte_1_cpf });
      const { data: encryptedCpf2, error: encryptError2 } = await supabase.rpc('encrypt_cpf', { cpf_plain: data.parte_2_cpf });
      
      if (encryptError1 || encryptError2) throw new Error("Erro ao criptografar CPF");

      const updateData: any = {
        ...data,
        parte_1_cpf: encryptedCpf1,
        parte_2_cpf: encryptedCpf2
      };

      // Encrypt witness CPFs if provided
      if (data.testemunha_1_cpf) {
        const { data: encryptedTestemunha1, error: errorT1 } = await supabase.rpc('encrypt_cpf', { cpf_plain: data.testemunha_1_cpf });
        if (errorT1) throw new Error("Erro ao criptografar CPF da testemunha 1");
        updateData.testemunha_1_cpf = encryptedTestemunha1;
      }

      if (data.testemunha_2_cpf) {
        const { data: encryptedTestemunha2, error: errorT2 } = await supabase.rpc('encrypt_cpf', { cpf_plain: data.testemunha_2_cpf });
        if (errorT2) throw new Error("Erro ao criptografar CPF da testemunha 2");
        updateData.testemunha_2_cpf = encryptedTestemunha2;
      }

      const { error } = await supabase
        .from('contratos_namoro')
        .update(updateData)
        .eq('id', contrato.id);

      if (error) throw error;

      toast({
        title: "Contrato atualizado!",
        description: "As alterações foram salvas com sucesso"
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar contrato",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Contrato de Namoro</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold">Informações do Contrato</h3>
            
            <div className="space-y-2">
              <Label htmlFor="titulo">Título do Contrato *</Label>
              <Input
                id="titulo"
                {...register("titulo", { required: "Título é obrigatório" })}
                placeholder="Ex: Contrato de Namoro - João e Maria"
              />
              {errors.titulo && <p className="text-sm text-destructive">{errors.titulo.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de Início *</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  {...register("data_inicio", { required: "Data é obrigatória" })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regime_bens">Regime de Bens *</Label>
                <Select onValueChange={(value) => setValue("regime_bens", value)} defaultValue={contrato.regime_bens}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Separação Total de Bens">Separação Total de Bens</SelectItem>
                    <SelectItem value="Comunhão Parcial de Bens">Comunhão Parcial de Bens</SelectItem>
                    <SelectItem value="Comunhão Universal de Bens">Comunhão Universal de Bens</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select onValueChange={(value) => setValue("status", value)} defaultValue={contrato.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vigente">Vigente</SelectItem>
                    <SelectItem value="Rescindido">Rescindido</SelectItem>
                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Parte 1 */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Parte 1</h3>
            
            <div className="space-y-2">
              <Label htmlFor="parte_1_nome">Nome Completo *</Label>
              <Input
                id="parte_1_nome"
                {...register("parte_1_nome", { required: "Nome é obrigatório" })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parte_1_cpf">CPF *</Label>
                <Input
                  id="parte_1_cpf"
                  {...register("parte_1_cpf", { required: "CPF é obrigatório" })}
                  placeholder="000.000.000-00"
                  onChange={handleCPFChange("parte_1_cpf")}
                  maxLength={14}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parte_1_endereco">Endereço</Label>
                <Input id="parte_1_endereco" {...register("parte_1_endereco")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deveres_parte_1">Deveres</Label>
                <Textarea id="deveres_parte_1" {...register("deveres_parte_1")} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direitos_parte_1">Direitos</Label>
                <Textarea id="direitos_parte_1" {...register("direitos_parte_1")} rows={3} />
              </div>
            </div>
          </div>

          {/* Parte 2 */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Parte 2</h3>
            
            <div className="space-y-2">
              <Label htmlFor="parte_2_nome">Nome Completo *</Label>
              <Input
                id="parte_2_nome"
                {...register("parte_2_nome", { required: "Nome é obrigatório" })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parte_2_cpf">CPF *</Label>
                <Input
                  id="parte_2_cpf"
                  {...register("parte_2_cpf", { required: "CPF é obrigatório" })}
                  placeholder="000.000.000-00"
                  onChange={handleCPFChange("parte_2_cpf")}
                  maxLength={14}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parte_2_endereco">Endereço</Label>
                <Input id="parte_2_endereco" {...register("parte_2_endereco")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deveres_parte_2">Deveres</Label>
                <Textarea id="deveres_parte_2" {...register("deveres_parte_2")} rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direitos_parte_2">Direitos</Label>
                <Textarea id="direitos_parte_2" {...register("direitos_parte_2")} rows={3} />
              </div>
            </div>
          </div>

          {/* Testemunhas */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Testemunhas</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testemunha_1_nome">Nome Testemunha 1</Label>
                <Input id="testemunha_1_nome" {...register("testemunha_1_nome")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testemunha_1_cpf">CPF Testemunha 1</Label>
                <Input 
                  id="testemunha_1_cpf" 
                  {...register("testemunha_1_cpf")} 
                  placeholder="000.000.000-00"
                  onChange={handleCPFChange("testemunha_1_cpf")}
                  maxLength={14}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testemunha_2_nome">Nome Testemunha 2</Label>
                <Input id="testemunha_2_nome" {...register("testemunha_2_nome")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testemunha_2_cpf">CPF Testemunha 2</Label>
                <Input 
                  id="testemunha_2_cpf" 
                  {...register("testemunha_2_cpf")} 
                  placeholder="000.000.000-00"
                  onChange={handleCPFChange("testemunha_2_cpf")}
                  maxLength={14}
                />
              </div>
            </div>
          </div>

          {/* Cláusulas */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="clausulas_adicionais">Cláusulas Adicionais</Label>
              <Textarea id="clausulas_adicionais" {...register("clausulas_adicionais")} rows={4} />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
