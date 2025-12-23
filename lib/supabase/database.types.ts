export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          cancelled_at: string | null
          client_email: string | null
          client_id: string | null
          client_name: string
          client_notes: string | null
          client_phone: string
          created_at: string
          date: string
          end_time: string
          id: string
          service_currency: string
          service_duration_minutes: number
          service_id: string | null
          service_name: string
          service_price_cents: number
          specialist_display_name: string
          specialist_id: string | null
          specialist_notes: string | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          timezone: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name: string
          client_notes?: string | null
          client_phone: string
          created_at?: string
          date: string
          end_time: string
          id?: string
          service_currency?: string
          service_duration_minutes: number
          service_id?: string | null
          service_name: string
          service_price_cents: number
          specialist_display_name: string
          specialist_id?: string | null
          specialist_notes?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          timezone?: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_notes?: string | null
          client_phone?: string
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          service_currency?: string
          service_duration_minutes?: number
          service_id?: string | null
          service_name?: string
          service_price_cents?: number
          specialist_display_name?: string
          specialist_id?: string | null
          specialist_notes?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "beauty_page_specialists"
            referencedColumns: ["id"]
          },
        ]
      }
      beauty_page_members: {
        Row: {
          beauty_page_id: string
          created_at: string
          id: string
          roles: Database["public"]["Enums"]["beauty_page_member_role"][]
          user_id: string
        }
        Insert: {
          beauty_page_id: string
          created_at?: string
          id?: string
          roles?: Database["public"]["Enums"]["beauty_page_member_role"][]
          user_id: string
        }
        Update: {
          beauty_page_id?: string
          created_at?: string
          id?: string
          roles?: Database["public"]["Enums"]["beauty_page_member_role"][]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beauty_page_members_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beauty_page_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      beauty_page_specialists: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean
          member_id: string
          restrict_to_business_hours: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          member_id: string
          restrict_to_business_hours?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          member_id?: string
          restrict_to_business_hours?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beauty_page_specialists_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "beauty_page_members"
            referencedColumns: ["id"]
          },
        ]
      }
      beauty_page_types: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      beauty_pages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
          type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          owner_id: string
          slug: string
          type_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beauty_pages_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beauty_pages_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "beauty_page_types"
            referencedColumns: ["id"]
          },
        ]
      }
      beauty_page_business_hours: {
        Row: {
          id: string
          beauty_page_id: string
          day_of_week: number
          is_open: boolean
          open_time: string
          close_time: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          beauty_page_id: string
          day_of_week: number
          is_open?: boolean
          open_time?: string
          close_time?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          beauty_page_id?: string
          day_of_week?: number
          is_open?: boolean
          open_time?: string
          close_time?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beauty_page_business_hours_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      beauty_page_special_hours: {
        Row: {
          id: string
          beauty_page_id: string
          date: string
          name: string | null
          is_open: boolean
          open_time: string | null
          close_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          beauty_page_id: string
          date: string
          name?: string | null
          is_open?: boolean
          open_time?: string | null
          close_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          beauty_page_id?: string
          date?: string
          name?: string | null
          is_open?: boolean
          open_time?: string | null
          close_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beauty_page_special_hours_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          beauty_page_id: string
          created_at: string
          email: string
          id: string
          invited_by: string
          roles: Database["public"]["Enums"]["beauty_page_member_role"][]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string
        }
        Insert: {
          beauty_page_id: string
          created_at?: string
          email: string
          id?: string
          invited_by: string
          roles?: Database["public"]["Enums"]["beauty_page_member_role"][]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
        }
        Update: {
          beauty_page_id?: string
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          roles?: Database["public"]["Enums"]["beauty_page_member_role"][]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          preferred_locale: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          preferred_locale?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          preferred_locale?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_groups: {
        Row: {
          beauty_page_id: string
          created_at: string
          display_order: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          beauty_page_id: string
          created_at?: string
          display_order?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          beauty_page_id?: string
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_groups_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          service_group_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          service_group_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          service_group_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_service_group_id_fkey"
            columns: ["service_group_id"]
            isOneToOne: false
            referencedRelation: "service_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_service_assignments: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          member_id: string
          price_cents: number
          service_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          id?: string
          member_id: string
          price_cents: number
          service_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          member_id?: string
          price_cents?: number
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_service_assignments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "beauty_page_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialist_service_assignments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      working_day_breaks: {
        Row: {
          created_at: string
          end_time: string
          id: string
          start_time: string
          working_day_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          start_time: string
          working_day_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          working_day_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_day_breaks_working_day_id_fkey"
            columns: ["working_day_id"]
            isOneToOne: false
            referencedRelation: "working_days"
            referencedColumns: ["id"]
          },
        ]
      }
      working_days: {
        Row: {
          created_at: string
          date: string
          end_time: string
          id: string
          specialist_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time: string
          id?: string
          specialist_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          specialist_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_days_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "beauty_page_specialists"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { invitation_id: string }; Returns: boolean }
      decline_invitation: { Args: { invitation_id: string }; Returns: boolean }
      get_beauty_page_id_from_specialist: {
        Args: { spec_id: string }
        Returns: string
      }
      get_invitation_by_token: {
        Args: { invite_token: string }
        Returns: {
          beauty_page_id: string
          beauty_page_name: string
          beauty_page_slug: string
          created_at: string
          email: string
          id: string
          invited_by_name: string
          roles: Database["public"]["Enums"]["beauty_page_member_role"][]
          status: Database["public"]["Enums"]["invitation_status"]
        }[]
      }
      get_specialist_id_from_working_day: {
        Args: { wd_id: string }
        Returns: string
      }
      is_beauty_page_admin: { Args: { page_id: string }; Returns: boolean }
      is_beauty_page_owner: { Args: { page_id: string }; Returns: boolean }
      is_own_specialist: { Args: { spec_id: string }; Returns: boolean }
    }
    Enums: {
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      beauty_page_member_role: "admin" | "specialist"
      invitation_status: "pending" | "accepted" | "declined"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      appointment_status: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      beauty_page_member_role: ["admin", "specialist"],
      invitation_status: ["pending", "accepted", "declined"],
    },
  },
} as const

