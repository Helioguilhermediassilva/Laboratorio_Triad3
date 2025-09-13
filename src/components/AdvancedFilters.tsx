import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface AdvancedFiltersProps {
  onApplyFilters: (filters: FilterCriteria) => void;
  onClearFilters: () => void;
}

export interface FilterCriteria {
  category: string;
  broker: string;
  minValue: string;
  maxValue: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  condition: string;
}

const initialFilters: FilterCriteria = {
  category: "all",
  broker: "all", 
  minValue: "",
  maxValue: "",
  dateFrom: "",
  dateTo: "",
  status: "all",
  condition: "all"
};

export default function AdvancedFilters({ onApplyFilters, onClearFilters }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterCriteria>(initialFilters);

  const handleInputChange = (field: keyof FilterCriteria, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const handleClear = () => {
    setFilters(initialFilters);
    onClearFilters();
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Filtros Avançados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asset Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria do Ativo</Label>
            <Select value={filters.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="Ação">Ações</SelectItem>
                <SelectItem value="FII">Fundos Imobiliários</SelectItem>
                <SelectItem value="ETF">ETFs</SelectItem>
                <SelectItem value="Renda Fixa">Renda Fixa</SelectItem>
                <SelectItem value="Criptomoeda">Criptomoedas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Broker */}
          <div className="space-y-2">
            <Label htmlFor="broker">Corretora</Label>
            <Select value={filters.broker} onValueChange={(value) => handleInputChange("broker", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a corretora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as corretoras</SelectItem>
                <SelectItem value="XP Investimentos">XP Investimentos</SelectItem>
                <SelectItem value="Rico Investimentos">Rico Investimentos</SelectItem>
                <SelectItem value="Inter Investimentos">Inter Investimentos</SelectItem>
                <SelectItem value="BTG Pactual">BTG Pactual</SelectItem>
                <SelectItem value="Nubank">Nubank</SelectItem>
                <SelectItem value="Clear">Clear</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Value Range */}
        <div>
          <Label className="text-base font-medium mb-4 block">Faixa de Valor</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minValue">Valor Mínimo (R$)</Label>
              <Input
                id="minValue"
                type="number"
                placeholder="0"
                value={filters.minValue}
                onChange={(e) => handleInputChange("minValue", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxValue">Valor Máximo (R$)</Label>
              <Input
                id="maxValue"
                type="number"
                placeholder="Sem limite"
                value={filters.maxValue}
                onChange={(e) => handleInputChange("maxValue", e.target.value)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Date Range */}
        <div>
          <Label className="text-base font-medium mb-4 block">Período de Compra</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Data Inicial</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleInputChange("dateFrom", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Data Final</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleInputChange("dateTo", e.target.value)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Status and Condition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={filters.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="condition">Condição</Label>
            <Select value={filters.condition} onValueChange={(value) => handleInputChange("condition", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a condição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as condições</SelectItem>
                <SelectItem value="excellent">Excelente</SelectItem>
                <SelectItem value="good">Boa</SelectItem>
                <SelectItem value="fair">Regular</SelectItem>
                <SelectItem value="poor">Ruim</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button onClick={handleApply} className="flex-1">
            Aplicar Filtros
          </Button>
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}