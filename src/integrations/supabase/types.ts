export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aplicacoes: {
        Row: {
          created_at: string
          data_aplicacao: string
          data_vencimento: string | null
          id: string
          instituicao: string
          liquidez: string | null
          nome: string
          rentabilidade_tipo: string | null
          taxa_rentabilidade: number | null
          tipo: string
          updated_at: string
          user_id: string
          valor_aplicado: number
          valor_atual: number
        }
        Insert: {
          created_at?: string
          data_aplicacao: string
          data_vencimento?: string | null
          id?: string
          instituicao: string
          liquidez?: string | null
          nome: string
          rentabilidade_tipo?: string | null
          taxa_rentabilidade?: number | null
          tipo: string
          updated_at?: string
          user_id: string
          valor_aplicado: number
          valor_atual: number
        }
        Update: {
          created_at?: string
          data_aplicacao?: string
          data_vencimento?: string | null
          id?: string
          instituicao?: string
          liquidez?: string | null
          nome?: string
          rentabilidade_tipo?: string | null
          taxa_rentabilidade?: number | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor_aplicado?: number
          valor_atual?: number
        }
        Relationships: []
      }
      beneficiarios_testamento: {
        Row: {
          cpf: string
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          parentesco: string | null
          percentual_heranca: number | null
          testamento_id: string
        }
        Insert: {
          cpf: string
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          parentesco?: string | null
          percentual_heranca?: number | null
          testamento_id: string
        }
        Update: {
          cpf?: string
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          parentesco?: string | null
          percentual_heranca?: number | null
          testamento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beneficiarios_testamento_testamento_id_fkey"
            columns: ["testamento_id"]
            isOneToOne: false
            referencedRelation: "testamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      bens_direitos_irpf: {
        Row: {
          categoria: string | null
          codigo: string | null
          created_at: string
          declaracao_id: string | null
          discriminacao: string
          id: string
          situacao_ano_anterior: number | null
          situacao_ano_atual: number
          user_id: string
        }
        Insert: {
          categoria?: string | null
          codigo?: string | null
          created_at?: string
          declaracao_id?: string | null
          discriminacao: string
          id?: string
          situacao_ano_anterior?: number | null
          situacao_ano_atual: number
          user_id: string
        }
        Update: {
          categoria?: string | null
          codigo?: string | null
          created_at?: string
          declaracao_id?: string | null
          discriminacao?: string
          id?: string
          situacao_ano_anterior?: number | null
          situacao_ano_atual?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bens_direitos_irpf_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: false
            referencedRelation: "declaracoes_irpf"
            referencedColumns: ["id"]
          },
        ]
      }
      bens_imobilizados: {
        Row: {
          categoria: string
          created_at: string
          data_aquisicao: string
          descricao: string | null
          id: string
          localizacao: string | null
          nome: string
          status: string
          updated_at: string
          user_id: string
          valor_aquisicao: number
          valor_atual: number
        }
        Insert: {
          categoria: string
          created_at?: string
          data_aquisicao: string
          descricao?: string | null
          id?: string
          localizacao?: string | null
          nome: string
          status?: string
          updated_at?: string
          user_id: string
          valor_aquisicao: number
          valor_atual: number
        }
        Update: {
          categoria?: string
          created_at?: string
          data_aquisicao?: string
          descricao?: string | null
          id?: string
          localizacao?: string | null
          nome?: string
          status?: string
          updated_at?: string
          user_id?: string
          valor_aquisicao?: number
          valor_atual?: number
        }
        Relationships: []
      }
      contas_bancarias: {
        Row: {
          agencia: string | null
          ativo: boolean
          banco: string
          created_at: string
          id: string
          limite_credito: number | null
          numero_conta: string
          saldo_atual: number
          tipo_conta: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean
          banco: string
          created_at?: string
          id?: string
          limite_credito?: number | null
          numero_conta: string
          saldo_atual?: number
          tipo_conta: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agencia?: string | null
          ativo?: boolean
          banco?: string
          created_at?: string
          id?: string
          limite_credito?: number | null
          numero_conta?: string
          saldo_atual?: number
          tipo_conta?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      declaracoes_irpf: {
        Row: {
          ano: number
          arquivo_original: string | null
          created_at: string
          dados_brutos: Json | null
          id: string
          prazo_limite: string | null
          recibo: string | null
          status: string
          updated_at: string
          user_id: string
          valor_pagar: number | null
          valor_restituir: number | null
        }
        Insert: {
          ano: number
          arquivo_original?: string | null
          created_at?: string
          dados_brutos?: Json | null
          id?: string
          prazo_limite?: string | null
          recibo?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valor_pagar?: number | null
          valor_restituir?: number | null
        }
        Update: {
          ano?: number
          arquivo_original?: string | null
          created_at?: string
          dados_brutos?: Json | null
          id?: string
          prazo_limite?: string | null
          recibo?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valor_pagar?: number | null
          valor_restituir?: number | null
        }
        Relationships: []
      }
      dividas: {
        Row: {
          created_at: string
          credor: string
          data_contratacao: string
          data_vencimento: string | null
          id: string
          nome: string
          numero_parcelas: number
          parcelas_pagas: number
          saldo_devedor: number
          status: string
          taxa_juros: number | null
          tipo: string
          updated_at: string
          user_id: string
          valor_original: number
          valor_parcela: number
        }
        Insert: {
          created_at?: string
          credor: string
          data_contratacao: string
          data_vencimento?: string | null
          id?: string
          nome: string
          numero_parcelas: number
          parcelas_pagas?: number
          saldo_devedor: number
          status?: string
          taxa_juros?: number | null
          tipo: string
          updated_at?: string
          user_id: string
          valor_original: number
          valor_parcela: number
        }
        Update: {
          created_at?: string
          credor?: string
          data_contratacao?: string
          data_vencimento?: string | null
          id?: string
          nome?: string
          numero_parcelas?: number
          parcelas_pagas?: number
          saldo_devedor?: number
          status?: string
          taxa_juros?: number | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor_original?: number
          valor_parcela?: number
        }
        Relationships: []
      }
      dividas_irpf: {
        Row: {
          created_at: string
          credor: string | null
          declaracao_id: string | null
          discriminacao: string
          id: string
          user_id: string
          valor_ano_anterior: number | null
          valor_ano_atual: number
        }
        Insert: {
          created_at?: string
          credor?: string | null
          declaracao_id?: string | null
          discriminacao: string
          id?: string
          user_id: string
          valor_ano_anterior?: number | null
          valor_ano_atual: number
        }
        Update: {
          created_at?: string
          credor?: string | null
          declaracao_id?: string | null
          discriminacao?: string
          id?: string
          user_id?: string
          valor_ano_anterior?: number | null
          valor_ano_atual?: number
        }
        Relationships: [
          {
            foreignKeyName: "dividas_irpf_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: false
            referencedRelation: "declaracoes_irpf"
            referencedColumns: ["id"]
          },
        ]
      }
      lembretes: {
        Row: {
          categoria: string
          created_at: string
          data_vencimento: string
          descricao: string | null
          id: string
          notificar_dias_antes: number | null
          prioridade: string
          status: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string
          data_vencimento: string
          descricao?: string | null
          id?: string
          notificar_dias_antes?: number | null
          prioridade?: string
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string
          data_vencimento?: string
          descricao?: string | null
          id?: string
          notificar_dias_antes?: number | null
          prioridade?: string
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      metas_financeiras: {
        Row: {
          categoria: string | null
          created_at: string
          data_inicio: string
          data_objetivo: string
          descricao: string | null
          id: string
          status: string
          titulo: string
          updated_at: string
          user_id: string
          valor_atual: number
          valor_objetivo: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data_inicio: string
          data_objetivo: string
          descricao?: string | null
          id?: string
          status?: string
          titulo: string
          updated_at?: string
          user_id: string
          valor_atual?: number
          valor_objetivo: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data_inicio?: string
          data_objetivo?: string
          descricao?: string | null
          id?: string
          status?: string
          titulo?: string
          updated_at?: string
          user_id?: string
          valor_atual?: number
          valor_objetivo?: number
        }
        Relationships: []
      }
      orcamentos: {
        Row: {
          categoria: string
          created_at: string
          id: string
          mes_referencia: string
          tipo: string
          updated_at: string
          user_id: string
          valor_gasto: number
          valor_planejado: number
        }
        Insert: {
          categoria: string
          created_at?: string
          id?: string
          mes_referencia: string
          tipo?: string
          updated_at?: string
          user_id: string
          valor_gasto?: number
          valor_planejado: number
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          mes_referencia?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          valor_gasto?: number
          valor_planejado?: number
        }
        Relationships: []
      }
      planos_previdencia: {
        Row: {
          ativo: boolean
          contribuicao_mensal: number
          created_at: string
          data_inicio: string
          id: string
          idade_resgate: number | null
          instituicao: string
          nome: string
          rentabilidade_acumulada: number | null
          taxa_administracao: number | null
          tipo: string
          updated_at: string
          user_id: string
          valor_acumulado: number
        }
        Insert: {
          ativo?: boolean
          contribuicao_mensal: number
          created_at?: string
          data_inicio: string
          id?: string
          idade_resgate?: number | null
          instituicao: string
          nome: string
          rentabilidade_acumulada?: number | null
          taxa_administracao?: number | null
          tipo: string
          updated_at?: string
          user_id: string
          valor_acumulado?: number
        }
        Update: {
          ativo?: boolean
          contribuicao_mensal?: number
          created_at?: string
          data_inicio?: string
          id?: string
          idade_resgate?: number | null
          instituicao?: string
          nome?: string
          rentabilidade_acumulada?: number | null
          taxa_administracao?: number | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor_acumulado?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          id: string
          nome_completo: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          id: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          id?: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rendimentos_irpf: {
        Row: {
          ano: number
          cnpj: string | null
          contribuicao_previdenciaria: number | null
          created_at: string
          decimo_terceiro: number | null
          declaracao_id: string | null
          fonte_pagadora: string
          id: string
          irrf: number | null
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          ano: number
          cnpj?: string | null
          contribuicao_previdenciaria?: number | null
          created_at?: string
          decimo_terceiro?: number | null
          declaracao_id?: string | null
          fonte_pagadora: string
          id?: string
          irrf?: number | null
          tipo: string
          user_id: string
          valor: number
        }
        Update: {
          ano?: number
          cnpj?: string | null
          contribuicao_previdenciaria?: number | null
          created_at?: string
          decimo_terceiro?: number | null
          declaracao_id?: string | null
          fonte_pagadora?: string
          id?: string
          irrf?: number | null
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "rendimentos_irpf_declaracao_id_fkey"
            columns: ["declaracao_id"]
            isOneToOne: false
            referencedRelation: "declaracoes_irpf"
            referencedColumns: ["id"]
          },
        ]
      }
      testamentos: {
        Row: {
          cartorio: string | null
          created_at: string
          data_elaboracao: string
          documento_url: string | null
          folha_numero: string | null
          id: string
          livro_numero: string | null
          observacoes: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cartorio?: string | null
          created_at?: string
          data_elaboracao: string
          documento_url?: string | null
          folha_numero?: string | null
          id?: string
          livro_numero?: string | null
          observacoes?: string | null
          status?: string
          tipo: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cartorio?: string | null
          created_at?: string
          data_elaboracao?: string
          documento_url?: string | null
          folha_numero?: string | null
          id?: string
          livro_numero?: string | null
          observacoes?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transacoes: {
        Row: {
          categoria: string
          conta: string
          created_at: string
          data: string
          descricao: string
          id: string
          observacoes: string | null
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria: string
          conta: string
          created_at?: string
          data: string
          descricao: string
          id?: string
          observacoes?: string | null
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          categoria?: string
          conta?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_beneficiary: {
        Args: { _beneficiary_id: string }
        Returns: boolean
      }
      can_access_profile: { Args: { _profile_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
