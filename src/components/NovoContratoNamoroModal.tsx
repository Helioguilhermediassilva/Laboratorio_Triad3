import { useState } from "react";
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

interface NovoContratoNamoroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// CPF validation schema
const cpfSchema = z.string()
  .min(11, "CPF deve ter 11 dígitos")
  .max(14, "CPF inválido")
  .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "Formato de CPF inválido");

const optionalCpfSchema = z.string()
  .optional()
  .refine(
    (val) => !val || /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(val),
    "Formato de CPF inválido"
  );

interface ContratoFormData {
  titulo: string;
  data_inicio: string;
  regime_bens: string;
  parte_1_nome: string;
  parte_1_cpf: string;
  parte_1_endereco: string;
  deveres_parte_1: string;
  direitos_parte_1: string;
  parte_2_nome: string;
  parte_2_cpf: string;
  parte_2_endereco: string;
  deveres_parte_2: string;
  direitos_parte_2: string;
  clausulas_adicionais: string;
  testemunha_1_nome: string;
  testemunha_1_cpf: string;
  testemunha_2_nome: string;
  testemunha_2_cpf: string;
}

export default function NovoContratoNamoroModal({ open, onOpenChange, onSuccess }: NovoContratoNamoroModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ContratoFormData>();

  const onSubmit = async (data: ContratoFormData) => {
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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from('contratos_namoro').insert([{
        user_id: user.id,
        ...data
      }]);

      if (error) throw error;

      toast({
        title: "Contrato criado!",
        description: "O contrato de namoro foi criado com sucesso"
      });

      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Erro ao criar contrato",
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
          <DialogTitle>Novo Contrato de Namoro</DialogTitle>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de Início do Namoro *</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  {...register("data_inicio", { required: "Data é obrigatória" })}
                />
                {errors.data_inicio && <p className="text-sm text-destructive">{errors.data_inicio.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="regime_bens">Regime de Bens *</Label>
                <Select onValueChange={(value) => setValue("regime_bens", value)}>
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
            </div>
          </div>

          {/* Parte 1 */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Parte 1 (Primeira Pessoa)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="parte_1_nome">Nome Completo *</Label>
              <Input
                id="parte_1_nome"
                {...register("parte_1_nome", { required: "Nome é obrigatório" })}
                placeholder="Nome completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parte_1_cpf">CPF *</Label>
                <Input
                  id="parte_1_cpf"
                  {...register("parte_1_cpf", { required: "CPF é obrigatório" })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parte_1_endereco">Endereço</Label>
                <Input
                  id="parte_1_endereco"
                  {...register("parte_1_endereco")}
                  placeholder="Endereço completo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deveres_parte_1">Deveres</Label>
              <Textarea
                id="deveres_parte_1"
                {...register("deveres_parte_1")}
                placeholder="Liste os deveres acordados"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direitos_parte_1">Direitos</Label>
              <Textarea
                id="direitos_parte_1"
                {...register("direitos_parte_1")}
                placeholder="Liste os direitos acordados"
                rows={3}
              />
            </div>
          </div>

          {/* Parte 2 */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Parte 2 (Segunda Pessoa)</h3>
            
            <div className="space-y-2">
              <Label htmlFor="parte_2_nome">Nome Completo *</Label>
              <Input
                id="parte_2_nome"
                {...register("parte_2_nome", { required: "Nome é obrigatório" })}
                placeholder="Nome completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parte_2_cpf">CPF *</Label>
                <Input
                  id="parte_2_cpf"
                  {...register("parte_2_cpf", { required: "CPF é obrigatório" })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parte_2_endereco">Endereço</Label>
                <Input
                  id="parte_2_endereco"
                  {...register("parte_2_endereco")}
                  placeholder="Endereço completo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deveres_parte_2">Deveres</Label>
              <Textarea
                id="deveres_parte_2"
                {...register("deveres_parte_2")}
                placeholder="Liste os deveres acordados"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="direitos_parte_2">Direitos</Label>
              <Textarea
                id="direitos_parte_2"
                {...register("direitos_parte_2")}
                placeholder="Liste os direitos acordados"
                rows={3}
              />
            </div>
          </div>

          {/* Testemunhas */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Testemunhas (Opcional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testemunha_1_nome">Nome Testemunha 1</Label>
                <Input
                  id="testemunha_1_nome"
                  {...register("testemunha_1_nome")}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testemunha_1_cpf">CPF Testemunha 1</Label>
                <Input
                  id="testemunha_1_cpf"
                  {...register("testemunha_1_cpf")}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testemunha_2_nome">Nome Testemunha 2</Label>
                <Input
                  id="testemunha_2_nome"
                  {...register("testemunha_2_nome")}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testemunha_2_cpf">CPF Testemunha 2</Label>
                <Input
                  id="testemunha_2_cpf"
                  {...register("testemunha_2_cpf")}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
          </div>

          {/* Cláusulas Adicionais */}
          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="clausulas_adicionais">Cláusulas Adicionais</Label>
              <Textarea
                id="clausulas_adicionais"
                {...register("clausulas_adicionais")}
                placeholder="Adicione outras cláusulas que julgar necessárias"
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Contrato"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
