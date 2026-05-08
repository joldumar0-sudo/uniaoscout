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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agrupamentos: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          nome: string
          numero: number
          paroquia: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          numero: number
          paroquia?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          numero?: number
          paroquia?: string | null
        }
        Relationships: []
      }
      alcateia_posts: {
        Row: {
          agrupamento_id: string | null
          conteudo: string
          created_at: string
          created_by: string | null
          id: string
          tipo: string
          titulo: string
        }
        Insert: {
          agrupamento_id?: string | null
          conteudo: string
          created_at?: string
          created_by?: string | null
          id?: string
          tipo: string
          titulo: string
        }
        Update: {
          agrupamento_id?: string | null
          conteudo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "alcateia_posts_agrupamento_id_fkey"
            columns: ["agrupamento_id"]
            isOneToOne: false
            referencedRelation: "agrupamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          agrupamento_id: string | null
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          local: string | null
          scope: string
          titulo: string
          updated_at: string
        }
        Insert: {
          agrupamento_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          local?: string | null
          scope: string
          titulo: string
          updated_at?: string
        }
        Update: {
          agrupamento_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          local?: string | null
          scope?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_agrupamento_id_fkey"
            columns: ["agrupamento_id"]
            isOneToOne: false
            referencedRelation: "agrupamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_divergences: {
        Row: {
          agrupamento_id: string | null
          created_at: string
          created_by: string | null
          descricao: string
          equipamento_id: string | null
          id: string
          status: string
        }
        Insert: {
          agrupamento_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao: string
          equipamento_id?: string | null
          id?: string
          status?: string
        }
        Update: {
          agrupamento_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string
          equipamento_id?: string | null
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_divergences_agrupamento_id_fkey"
            columns: ["agrupamento_id"]
            isOneToOne: false
            referencedRelation: "agrupamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_divergences_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          agrupamento_id: string | null
          content: string
          created_at: string
          id: string
          scope: string
          user_id: string
        }
        Insert: {
          agrupamento_id?: string | null
          content: string
          created_at?: string
          id?: string
          scope?: string
          user_id: string
        }
        Update: {
          agrupamento_id?: string | null
          content?: string
          created_at?: string
          id?: string
          scope?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_agrupamento_id_fkey"
            columns: ["agrupamento_id"]
            isOneToOne: false
            referencedRelation: "agrupamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          agrupamento_id: string | null
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          uploaded_by: string | null
        }
        Insert: {
          agrupamento_id?: string | null
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Update: {
          agrupamento_id?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_agrupamento_id_fkey"
            columns: ["agrupamento_id"]
            isOneToOne: false
            referencedRelation: "agrupamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          conteudo: string
          created_at: string
          created_by: string | null
          id: string
          numero: number
          titulo: string
          updated_at: string
        }
        Insert: {
          conteudo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          numero: number
          titulo: string
          updated_at?: string
        }
        Update: {
          conteudo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          numero?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      nominations: {
        Row: {
          agrupamento_id: string | null
          cargo: Database["public"]["Enums"]["cargo"]
          id: string
          nominated_at: string
          nominated_by: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          agrupamento_id?: string | null
          cargo: Database["public"]["Enums"]["cargo"]
          id?: string
          nominated_at?: string
          nominated_by?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          agrupamento_id?: string | null
          cargo?: Database["public"]["Enums"]["cargo"]
          id?: string
          nominated_at?: string
          nominated_by?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nominations_agrupamento_id_fkey"
            columns: ["agrupamento_id"]
            isOneToOne: false
            referencedRelation: "agrupamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominations_user_id_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          agrupamento_id: string | null
          caption: string | null
          created_at: string
          file_path: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          agrupamento_id?: string | null
          caption?: string | null
          created_at?: string
          file_path: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          agrupamento_id?: string | null
          caption?: string | null
          created_at?: string
          file_path?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photos_agrupamento_id_fkey"
            columns: ["agrupamento_id"]
            isOneToOne: false
            referencedRelation: "agrupamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agrupamento_id: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          agrupamento_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          agrupamento_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agrupamento_id_fkey"
            columns: ["agrupamento_id"]
            isOneToOne: false
            referencedRelation: "agrupamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_agrupamento: {
        Args: { _ag_id: string; _user_id: string }
        Returns: boolean
      }
      can_upload_media: {
        Args: { _ag_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_agrupamento: {
        Args: { _ag_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_provincial_admin: { Args: { _user_id: string }; Returns: boolean }
      user_agrupamento_id: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "member"
      cargo:
        | "padre"
        | "coord_provincial"
        | "adj_coord_provincial"
        | "secretaria_provincial"
        | "tesoureiro_provincial"
        | "chefe_campo_provincial"
        | "balu_provincial"
        | "akela_provincial"
        | "pai_provincial"
        | "mae_provincial"
        | "conselheiro_provincial"
        | "responsavel_agrupamento"
        | "adj_responsavel_agrupamento"
        | "secretaria_agrupamento"
        | "tesoureiro_agrupamento"
        | "chefe_campo_agrupamento"
        | "balu_agrupamento"
        | "akela_agrupamento"
        | "assistente_agrupamento"
        | "pai_agrupamento"
        | "mae_agrupamento"
        | "conselheiro_agrupamento"
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
    Enums: {
      app_role: ["admin", "member"],
      cargo: [
        "padre",
        "coord_provincial",
        "adj_coord_provincial",
        "secretaria_provincial",
        "tesoureiro_provincial",
        "chefe_campo_provincial",
        "balu_provincial",
        "akela_provincial",
        "pai_provincial",
        "mae_provincial",
        "conselheiro_provincial",
        "responsavel_agrupamento",
        "adj_responsavel_agrupamento",
        "secretaria_agrupamento",
        "tesoureiro_agrupamento",
        "chefe_campo_agrupamento",
        "balu_agrupamento",
        "akela_agrupamento",
        "assistente_agrupamento",
        "pai_agrupamento",
        "mae_agrupamento",
        "conselheiro_agrupamento",
      ],
    },
  },
} as const
