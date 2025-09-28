import { useState } from "react";
import { Shield, Plus, Eye, Trash2, Calendar, DollarSign, TrendingUp, Clock } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Mock data for pension plans
const mockPrevidencia = [
  {
    id: 1,
    tipo: "PGBL",
    produto: "Brasilprev Exclusivo",
    instituicao: "Banco do Brasil",
    valorAcumulado: 125000,
    aportesMensais: 2500,
    dataContratacao: "15/03/2019",
    proximaContribuicao: "15/02/2024",
    rentabilidadeAno: 12.8,
    taxaAdministracao: 1.2,
    taxaCarregamento: 2.0,
    beneficiarioIdeal: 65,
    idadeAtual: 45,
    status: "Ativo",
    categoria: "PGBL"
  },
  {
    id: 2,
    tipo: "VGBL",
    produto: "Itaú Personalité Prev",
    instituicao: "Itaú Unibanco",
    valorAcumulado: 89500,
    aportesMensais: 1800,
    dataContratacao: "10/08/2020",
    proximaContribuicao: "10/02/2024",
    rentabilidadeAno: 10.5,
    taxaAdministracao: 1.5,
    taxaCarregamento: 1.5,
    beneficiarioIdeal: 60,
    idadeAtual: 45,
    status: "Ativo",
    categoria: "VGBL"
  },
  {
    id: 3,
    tipo: "FAPI",
    produto: "Santander Prev",
    instituicao: "Santander",
    valorAcumulado: 45600,
    aportesMensais: 1200,
    dataContratacao: "22/01/2022",
    proximaContribuicao: "22/02/2024",
    rentabilidadeAno: 9.2,
    taxaAdministracao: 2.0,
    taxaCarregamento: 3.0,
    beneficiarioIdeal: 65,
    idadeAtual: 45,
    status: "Ativo",
    categoria: "FAPI"
  },
  {
    id: 4,
    tipo: "PGBL",
    produto: "Caixa Prev",
    instituicao: "Caixa Econômica",
    valorAcumulado: 15800,
    aportesMensais: 0,
    dataContratacao: "05/06/2021",
    proximaContribuicao: "-",
    rentabilidadeAno: 8.1,
    taxaAdministracao: 1.8,
    taxaCarregamento: 2.5,
    beneficiarioIdeal: 65,
    idadeAtual: 45,
    status: "Suspenso",
    categoria: "PGBL"
  }
];

interface PensionCardProps {
  plano: typeof mockPrevidencia[0];
  onView: (id: number) => void;
  onDelete: (id: number) => void;
}

function PensionCard({ plano, onView, onDelete }: PensionCardProps) {
  const anosParaBeneficio = plano.beneficiarioIdeal - plano.idadeAtual;
  const progressoIdade = (plano.idadeAtual / plano.beneficiarioIdeal) * 100;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Ativo": return "bg-green-500";
      case "Suspenso": return "bg-yellow-500";
      case "Resgatado": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Ativo": return "default";
      case "Suspenso": return "secondary";
      case "Resgatado": return "outline";
      default: return "outline";
    }
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case "PGBL": return "bg-blue-100 text-blue-800";
      case "VGBL": return "bg-green-100 text-green-800";
      case "FAPI": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(plano.status)}`} />
            <div>
              <CardTitle className="text-lg">{plano.produto}</CardTitle>
              <p className="text-sm text-muted-foreground">{plano.instituicao}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Badge className={getCategoryColor(plano.categoria)}>
              {plano.tipo}
            </Badge>
            <Badge variant={getStatusVariant(plano.status)}>
              {plano.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Valor Acumulado</p>
            <p className="font-semibold text-green-600 text-lg">
              {plano.valorAcumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Aporte Mensal</p>
            <p className="font-semibold">
              {plano.aportesMensais > 0 
                ? plano.aportesMensais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : "Suspenso"
              }
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso para benefício</span>
            <span>{plano.idadeAtual} / {plano.beneficiarioIdeal} anos</span>
          </div>
          <Progress value={progressoIdade} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {anosParaBeneficio > 0 ? `${anosParaBeneficio} anos restantes` : "Elegível para benefício"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Rentabilidade (Ano)</p>
            <p className="font-medium text-green-600">+{plano.rentabilidadeAno}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Taxa Admin.</p>
            <p className="font-medium">{plano.taxaAdministracao}% a.a.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Data Contratação</p>
            <p className="font-medium">{plano.dataContratacao}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Próxima Contribuição</p>
            <p className="font-medium">{plano.proximaContribuicao}</p>
          </div>
        </div>

        <div className="flex space-x-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onView(plano.id)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Detalhes
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(plano.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Previdencia() {
  const [planos] = useState(mockPrevidencia);

  const handleView = (id: number) => {
    console.log("Visualizar plano:", id);
  };

  const handleDelete = (id: number) => {
    console.log("Excluir plano:", id);
  };

  const handleAddPlan = () => {
    console.log("Adicionar novo plano");
  };

  // Calculations
  const totalAcumulado = planos.reduce((sum, plano) => sum + plano.valorAcumulado, 0);
  const totalAportesMensais = planos.reduce((sum, plano) => sum + plano.aportesMensais, 0);
  const planosAtivos = planos.filter(p => p.status === "Ativo").length;
  const mediaRentabilidade = planos.reduce((sum, plano) => sum + plano.rentabilidadeAno, 0) / planos.length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Previdência</h1>
            <p className="text-muted-foreground">
              Gerencie seus planos previdenciários e aposentadoria
            </p>
          </div>
          <Button onClick={handleAddPlan}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Acumulado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totalAcumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aportes/Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalAportesMensais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {planosAtivos}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rentab. Média</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{mediaRentabilidade.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pension Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {planos.map((plano) => (
            <PensionCard
              key={plano.id}
              plano={plano}
              onView={handleView}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {planos.length === 0 && (
          <div className="text-center py-12">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">Nenhum plano previdenciário cadastrado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Comece adicionando um novo plano de previdência.
            </p>
            <div className="mt-6">
              <Button onClick={handleAddPlan}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Plano
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}