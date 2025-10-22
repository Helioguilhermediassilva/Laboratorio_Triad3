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
      [_ in never]: never
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
