import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

export default function EditarContratoNamoroModal({ open, onOpenChange, contrato, onSuccess }: EditarContratoNamoroModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ContratoNamoro>();

  useEffect(() => {
    if (contrato && open) {
      reset(contrato);
      setValue("regime_bens", contrato.regime_bens);
      setValue("status", contrato.status);
    }
  }, [contrato, open, reset, setValue]);

  const onSubmit = async (data: ContratoNamoro) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('contratos_namoro')
        .update(data)
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
                <Input id="testemunha_1_cpf" {...register("testemunha_1_cpf")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testemunha_2_nome">Nome Testemunha 2</Label>
                <Input id="testemunha_2_nome" {...register("testemunha_2_nome")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testemunha_2_cpf">CPF Testemunha 2</Label>
                <Input id="testemunha_2_cpf" {...register("testemunha_2_cpf")} />
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
