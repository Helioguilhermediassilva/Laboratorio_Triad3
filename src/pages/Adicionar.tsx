import Layout from "@/components/Layout";
import AddAssetForm from "@/components/AddAssetForm";
import { useToast } from "@/hooks/use-toast";

export default function Adicionar() {
  const { toast } = useToast();

  const handleAddAsset = (newAsset: any) => {
    // In a real app, this would save to a database
    console.log("New asset added:", newAsset);
    
    toast({
      title: "Ativo adicionado!",
      description: `${newAsset.ticker} foi adicionado à sua carteira com sucesso.`,
    });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Adicionar Novo Ativo
          </h1>
          <p className="text-muted-foreground">
            Adicione um novo ativo financeiro à sua carteira de investimentos
          </p>
        </div>

        <AddAssetForm onSubmit={handleAddAsset} />
      </div>
    </Layout>
  );
}