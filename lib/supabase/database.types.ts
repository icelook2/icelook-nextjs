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
      appointment_services: {
        Row: {
          appointment_id: string
          created_at: string
          duration_minutes: number
          id: string
          price_cents: number
          service_id: string | null
          service_name: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          duration_minutes: number
          id?: string
          price_cents: number
          service_id?: string | null
          service_name: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          price_cents?: number
          service_id?: string | null
          service_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          beauty_page_id: string
          cancelled_at: string | null
          client_email: string | null
          client_id: string | null
          client_name: string
          client_notes: string | null
          client_phone: string
          created_at: string
          creator_display_name: string
          creator_notes: string | null
          date: string
          end_time: string
          id: string
          service_currency: string
          service_duration_minutes: number
          service_id: string | null
          service_name: string
          service_price_cents: number
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          timezone: string
          updated_at: string
          visit_preferences: Json | null
        }
        Insert: {
          beauty_page_id: string
          cancelled_at?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name: string
          client_notes?: string | null
          client_phone: string
          created_at?: string
          creator_display_name: string
          creator_notes?: string | null
          date: string
          end_time: string
          id?: string
          service_currency?: string
          service_duration_minutes: number
          service_id?: string | null
          service_name: string
          service_price_cents: number
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          timezone?: string
          updated_at?: string
          visit_preferences?: Json | null
        }
        Update: {
          beauty_page_id?: string
          cancelled_at?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_notes?: string | null
          client_phone?: string
          created_at?: string
          creator_display_name?: string
          creator_notes?: string | null
          date?: string
          end_time?: string
          id?: string
          service_currency?: string
          service_duration_minutes?: number
          service_id?: string | null
          service_name?: string
          service_price_cents?: number
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          timezone?: string
          updated_at?: string
          visit_preferences?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
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
          address: string | null
          auto_confirm_bookings: boolean
          avatar_url: string | null
          bio: string | null
          cancellation_notice_hours: number
          city: string | null
          country_code: string | null
          created_at: string
          currency: string
          description: string | null
          display_name: string | null
          email: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          is_active: boolean
          is_verified: boolean
          logo_url: string | null
          max_days_ahead: number
          min_booking_notice_hours: number
          name: string
          owner_id: string
          phone: string | null
          postal_code: string | null
          slug: string
          timezone: string
          type_id: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          address?: string | null
          auto_confirm_bookings?: boolean
          avatar_url?: string | null
          bio?: string | null
          cancellation_notice_hours?: number
          city?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          display_name?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          is_verified?: boolean
          logo_url?: string | null
          max_days_ahead?: number
          min_booking_notice_hours?: number
          name: string
          owner_id: string
          phone?: string | null
          postal_code?: string | null
          slug: string
          timezone?: string
          type_id: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          address?: string | null
          auto_confirm_bookings?: boolean
          avatar_url?: string | null
          bio?: string | null
          cancellation_notice_hours?: number
          city?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          display_name?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean
          is_verified?: boolean
          logo_url?: string | null
          max_days_ahead?: number
          min_booking_notice_hours?: number
          name?: string
          owner_id?: string
          phone?: string | null
          postal_code?: string | null
          slug?: string
          timezone?: string
          type_id?: string
          updated_at?: string
          website_url?: string | null
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
      business_hours: {
        Row: {
          beauty_page_id: string
          close_time: string | null
          created_at: string
          day_of_week: number
          id: string
          is_open: boolean
          open_time: string | null
          updated_at: string
        }
        Insert: {
          beauty_page_id: string
          close_time?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          is_open?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Update: {
          beauty_page_id?: string
          close_time?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          is_open?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_policies: {
        Row: {
          allow_cancellation: boolean
          beauty_page_id: string
          cancellation_fee_percentage: number
          cancellation_notice_hours: number
          created_at: string
          id: string
          policy_text: string | null
          updated_at: string
        }
        Insert: {
          allow_cancellation?: boolean
          beauty_page_id: string
          cancellation_fee_percentage?: number
          cancellation_notice_hours?: number
          created_at?: string
          id?: string
          policy_text?: string | null
          updated_at?: string
        }
        Update: {
          allow_cancellation?: boolean
          beauty_page_id?: string
          cancellation_fee_percentage?: number
          cancellation_notice_hours?: number
          created_at?: string
          id?: string
          policy_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_policies_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: true
            referencedRelation: "beauty_pages"
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
          visit_preferences: Json | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          preferred_locale?: string | null
          updated_at?: string | null
          visit_preferences?: Json | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          preferred_locale?: string | null
          updated_at?: string | null
          visit_preferences?: Json | null
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
          duration_minutes: number
          id: string
          name: string
          price_cents: number
          service_group_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          duration_minutes: number
          id?: string
          name: string
          price_cents: number
          service_group_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          duration_minutes?: number
          id?: string
          name?: string
          price_cents?: number
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
          beauty_page_id: string
          created_at: string
          date: string
          end_time: string
          id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          beauty_page_id: string
          created_at?: string
          date: string
          end_time: string
          id?: string
          start_time: string
          updated_at?: string
        }
        Update: {
          beauty_page_id?: string
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "working_days_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_beauty_page_id_from_working_day: {
        Args: { wd_id: string }
        Returns: string
      }
    }
    Enums: {
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
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
    },
  },
} as const

