import { useState, useEffect } from "react";
import { Search, Filter, Home, Car, Wrench, MapPin, Plus } from "lucide-react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import AdicionarBemModal from "@/components/AdicionarBemModal";
import VisualizarBemModal from "@/components/VisualizarBemModal";
import EditarBemModal from "@/components/EditarBemModal";
import { supabase } from "@/integrations/supabase/client";

const ImobilizadoCard = ({ 
  item, 
  onVisualizar, 
  onEditar 
}: { 
  item: any;
  onVisualizar: (item: any) => void;
  onEditar: (item: any) => void;
}) => {
  const getIcon = () => {
    switch (item.categoria) {
      case "Imóvel": return <Home className="h-5 w-5" />;
      case "Veículo": return <Car className="h-5 w-5" />;
      case "Equipamento": return <Wrench className="h-5 w-5" />;
      default: return <Home className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Próprio": return "bg-green-100 text-green-800";
      case "Financiado": return "bg-blue-100 text-blue-800";
      case "Alugado": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">{item.nome}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {item.endereco}
              </div>
            </div>
          </div>
          <Badge className={getStatusColor(item.status)}>
            {item.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Valor Estimado</span>
            <span className="font-semibold text-lg">
              {item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Categoria</span>
            <Badge variant="outline">{item.categoria}</Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Condição</span>
            <span className="text-sm">{item.condicao}</span>
          </div>
          
          {item.observacoes && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">{item.observacoes}</p>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onVisualizar(item)}
            >
              Visualizar
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={() => onEditar(item)}
            >
              Editar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Imobilizado() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adicionarBemOpen, setAdicionarBemOpen] = useState(false);
  const [visualizarBemOpen, setVisualizarBemOpen] = useState(false);
  const [editarBemOpen, setEditarBemOpen] = useState(false);
  const [bemSelecionado, setBemSelecionado] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBens();
  }, []);

  const loadBens = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca bens da tabela principal
      const { data: bensImobilizados, error: bensError } = await supabase
        .from('bens_imobilizados')
        .select('*')
        .eq('user_id', user.id);

      // Busca bens da declaração de IRPF
      const { data: bensDireitosIRPF, error: irpfError } = await supabase
        .from('bens_direitos_irpf')
        .select('*')
        .eq('user_id', user.id);

      if (bensError || irpfError) {
        console.error('Error loading bens:', bensError || irpfError);
        setLoading(false);
        return;
      }

      // Combina e formata os dados
      const bensCombinados = [
        ...(bensImobilizados || []).map(b => ({
          id: b.id,
          nome: b.nome,
          categoria: b.categoria,
          endereco: b.localizacao || 'Não informado',
          valor: Number(b.valor_atual),
          dataAquisicao: b.data_aquisicao,
          status: b.status,
          condicao: 'Boa',
          observacoes: b.descricao
        })),
        ...(bensDireitosIRPF || []).map(b => ({
          id: b.id,
          nome: b.discriminacao.substring(0, 50),
          categoria: b.categoria || 'Outro',
          endereco: 'Importado da declaração IRPF',
          valor: Number(b.situacao_ano_atual),
          dataAquisicao: new Date().toISOString().split('T')[0],
          status: 'Próprio',
          condicao: 'Boa',
          observacoes: b.discriminacao
        }))
      ];

      setItems(bensCombinados);
      setLoading(false);
    } catch (error) {
      console.error('Error loading bens:', error);
      setLoading(false);
    }
  };

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.endereco.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.categoria === categoryFilter;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });

  const totalValue = items.reduce((sum, item) => sum + item.valor, 0);

  const handleBemAdicionado = (novoBem: any) => {
    setItems(prev => [...prev, novoBem]);
    toast({
      title: "Bem adicionado!",
      description: "O bem foi adicionado ao patrimônio com sucesso."
    });
  };

  const handleVisualizarBem = (bem: any) => {
    setBemSelecionado(bem);
    setVisualizarBemOpen(true);
  };

  const handleEditarBem = (bem: any) => {
    setBemSelecionado(bem);
    setEditarBemOpen(true);
  };

  const handleBemEditado = (bemEditado: any) => {
    setItems(prev => 
      prev.map(item => 
        item.id === bemEditado.id ? bemEditado : item
      )
    );
    toast({
      title: "Bem atualizado!",
      description: "As alterações foram salvas com sucesso."
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Patrimônio Imobilizado
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus bens imóveis, veículos e equipamentos
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Total do Imobilizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Itens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {items.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Maior Bem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                Casa de Praia
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                R$ 850.000
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome ou endereço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Imóvel">Imóveis</SelectItem>
                  <SelectItem value="Veículo">Veículos</SelectItem>
                  <SelectItem value="Equipamento">Equipamentos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Próprio">Próprio</SelectItem>
                  <SelectItem value="Financiado">Financiado</SelectItem>
                  <SelectItem value="Alugado">Alugado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Items Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Bens ({filteredItems.length})
            </h2>
            <Button onClick={() => setAdicionarBemOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Bem
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredItems.map((item) => (
              <ImobilizadoCard 
                key={item.id} 
                item={item}
                onVisualizar={handleVisualizarBem}
                onEditar={handleEditarBem}
              />
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg mb-2">
                Nenhum bem encontrado
              </div>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros ou adicionar novos bens ao patrimônio
              </p>
            </div>
          )}
        </div>

        {/* Modals */}
        <AdicionarBemModal 
          open={adicionarBemOpen}
          onOpenChange={setAdicionarBemOpen}
          onBemAdicionado={handleBemAdicionado}
        />
        
        <VisualizarBemModal 
          open={visualizarBemOpen}
          onOpenChange={setVisualizarBemOpen}
          bem={bemSelecionado}
        />
        
        <EditarBemModal 
          open={editarBemOpen}
          onOpenChange={setEditarBemOpen}
          bem={bemSelecionado}
          onBemEditado={handleBemEditado}
        />
      </div>
    </Layout>
  );
}