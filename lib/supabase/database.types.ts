export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  pgbouncer: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_auth: {
        Args: { p_usename: string };
        Returns: {
          password: string;
          username: string;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      appointments: {
        Row: {
          beauty_page_id: string | null;
          cancelled_at: string | null;
          client_email: string | null;
          client_id: string | null;
          client_name: string;
          client_notes: string | null;
          client_phone: string;
          created_at: string;
          date: string;
          end_time: string;
          id: string;
          service_currency: string;
          service_duration_minutes: number;
          service_id: string | null;
          service_name: string;
          service_price_cents: number;
          specialist_display_name: string;
          specialist_id: string | null;
          specialist_notes: string | null;
          start_time: string;
          status: Database["public"]["Enums"]["appointment_status"];
          timezone: string;
          updated_at: string;
        };
        Insert: {
          beauty_page_id?: string | null;
          cancelled_at?: string | null;
          client_email?: string | null;
          client_id?: string | null;
          client_name: string;
          client_notes?: string | null;
          client_phone: string;
          created_at?: string;
          date: string;
          end_time: string;
          id?: string;
          service_currency?: string;
          service_duration_minutes: number;
          service_id?: string | null;
          service_name: string;
          service_price_cents: number;
          specialist_display_name: string;
          specialist_id?: string | null;
          specialist_notes?: string | null;
          start_time: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          beauty_page_id?: string | null;
          cancelled_at?: string | null;
          client_email?: string | null;
          client_id?: string | null;
          client_name?: string;
          client_notes?: string | null;
          client_phone?: string;
          created_at?: string;
          date?: string;
          end_time?: string;
          id?: string;
          service_currency?: string;
          service_duration_minutes?: number;
          service_id?: string | null;
          service_name?: string;
          service_price_cents?: number;
          specialist_display_name?: string;
          specialist_id?: string | null;
          specialist_notes?: string | null;
          start_time?: string;
          status?: Database["public"]["Enums"]["appointment_status"];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_beauty_page_id_fkey";
            columns: ["beauty_page_id"];
            referencedRelation: "beauty_pages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_client_id_fkey";
            columns: ["client_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_service_id_fkey";
            columns: ["service_id"];
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_specialist_id_fkey";
            columns: ["specialist_id"];
            referencedRelation: "beauty_page_specialists";
            referencedColumns: ["id"];
          },
        ];
      };
      beauty_page_members: {
        Row: {
          beauty_page_id: string;
          created_at: string;
          id: string;
          roles: Database["public"]["Enums"]["beauty_page_member_role"][];
          user_id: string;
        };
        Insert: {
          beauty_page_id: string;
          created_at?: string;
          id?: string;
          roles?: Database["public"]["Enums"]["beauty_page_member_role"][];
          user_id: string;
        };
        Update: {
          beauty_page_id?: string;
          created_at?: string;
          id?: string;
          roles?: Database["public"]["Enums"]["beauty_page_member_role"][];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "beauty_page_members_beauty_page_id_fkey";
            columns: ["beauty_page_id"];
            referencedRelation: "beauty_pages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "beauty_page_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      beauty_page_specialists: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          is_active: boolean;
          member_id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_active?: boolean;
          member_id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_active?: boolean;
          member_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "beauty_page_specialists_member_id_fkey";
            columns: ["member_id"];
            referencedRelation: "beauty_page_members";
            referencedColumns: ["id"];
          },
        ];
      };
      beauty_page_types: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      beauty_pages: {
        Row: {
          address: string | null;
          city: string | null;
          country_code: string | null;
          created_at: string;
          description: string | null;
          email: string | null;
          facebook_url: string | null;
          id: string;
          instagram_url: string | null;
          is_active: boolean;
          is_verified: boolean;
          logo_url: string | null;
          name: string;
          owner_id: string;
          phone: string | null;
          postal_code: string | null;
          slug: string;
          type_id: string;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          country_code?: string | null;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          facebook_url?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_active?: boolean;
          is_verified?: boolean;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          phone?: string | null;
          postal_code?: string | null;
          slug: string;
          type_id: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          country_code?: string | null;
          created_at?: string;
          description?: string | null;
          email?: string | null;
          facebook_url?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_active?: boolean;
          is_verified?: boolean;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          phone?: string | null;
          postal_code?: string | null;
          slug?: string;
          type_id?: string;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "beauty_pages_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "beauty_pages_type_id_fkey";
            columns: ["type_id"];
            referencedRelation: "beauty_page_types";
            referencedColumns: ["id"];
          },
        ];
      };
      cancellation_policies: {
        Row: {
          beauty_page_id: string;
          block_duration_days: number;
          created_at: string;
          id: string;
          is_enabled: boolean;
          max_cancellations: number;
          no_show_multiplier: number;
          period_days: number;
          updated_at: string;
        };
        Insert: {
          beauty_page_id: string;
          block_duration_days?: number;
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          max_cancellations?: number;
          no_show_multiplier?: number;
          period_days?: number;
          updated_at?: string;
        };
        Update: {
          beauty_page_id?: string;
          block_duration_days?: number;
          created_at?: string;
          id?: string;
          is_enabled?: boolean;
          max_cancellations?: number;
          no_show_multiplier?: number;
          period_days?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cancellation_policies_beauty_page_id_fkey";
            columns: ["beauty_page_id"];
            referencedRelation: "beauty_pages";
            referencedColumns: ["id"];
          },
        ];
      };
      invitations: {
        Row: {
          beauty_page_id: string;
          created_at: string;
          email: string;
          id: string;
          invited_by: string;
          roles: Database["public"]["Enums"]["beauty_page_member_role"][];
          status: Database["public"]["Enums"]["invitation_status"];
          token: string;
          updated_at: string;
        };
        Insert: {
          beauty_page_id: string;
          created_at?: string;
          email: string;
          id?: string;
          invited_by: string;
          roles?: Database["public"]["Enums"]["beauty_page_member_role"][];
          status?: Database["public"]["Enums"]["invitation_status"];
          token?: string;
          updated_at?: string;
        };
        Update: {
          beauty_page_id?: string;
          created_at?: string;
          email?: string;
          id?: string;
          invited_by?: string;
          roles?: Database["public"]["Enums"]["beauty_page_member_role"][];
          status?: Database["public"]["Enums"]["invitation_status"];
          token?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_beauty_page_id_fkey";
            columns: ["beauty_page_id"];
            referencedRelation: "beauty_pages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_invited_by_fkey";
            columns: ["invited_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          preferred_locale: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          preferred_locale?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          preferred_locale?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      review_replies: {
        Row: {
          author_id: string;
          content: string;
          created_at: string;
          id: string;
          review_id: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          content: string;
          created_at?: string;
          id?: string;
          review_id: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          review_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_replies_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_replies_review_id_fkey";
            columns: ["review_id"];
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          appointment_id: string | null;
          comment: string | null;
          created_at: string;
          id: string;
          rating: number;
          reviewer_id: string;
          specialist_id: string;
          updated_at: string;
        };
        Insert: {
          appointment_id?: string | null;
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating: number;
          reviewer_id: string;
          specialist_id: string;
          updated_at?: string;
        };
        Update: {
          appointment_id?: string | null;
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating?: number;
          reviewer_id?: string;
          specialist_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey";
            columns: ["appointment_id"];
            referencedRelation: "appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_specialist_id_fkey";
            columns: ["specialist_id"];
            referencedRelation: "beauty_page_specialists";
            referencedColumns: ["id"];
          },
        ];
      };
      service_groups: {
        Row: {
          beauty_page_id: string;
          created_at: string;
          display_order: number;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          beauty_page_id: string;
          created_at?: string;
          display_order?: number;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          beauty_page_id?: string;
          created_at?: string;
          display_order?: number;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "service_groups_beauty_page_id_fkey";
            columns: ["beauty_page_id"];
            referencedRelation: "beauty_pages";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          created_at: string;
          display_order: number;
          id: string;
          name: string;
          service_group_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          id?: string;
          name: string;
          service_group_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          id?: string;
          name?: string;
          service_group_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_service_group_id_fkey";
            columns: ["service_group_id"];
            referencedRelation: "service_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      specialist_label_assignments: {
        Row: {
          created_at: string;
          id: string;
          label_id: string;
          specialist_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          label_id: string;
          specialist_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          label_id?: string;
          specialist_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "specialist_label_assignments_label_id_fkey";
            columns: ["label_id"];
            referencedRelation: "specialist_labels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "specialist_label_assignments_specialist_id_fkey";
            columns: ["specialist_id"];
            referencedRelation: "beauty_page_specialists";
            referencedColumns: ["id"];
          },
        ];
      };
      specialist_labels: {
        Row: {
          beauty_page_id: string;
          color: string | null;
          created_at: string;
          id: string;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          beauty_page_id: string;
          color?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          beauty_page_id?: string;
          color?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "specialist_labels_beauty_page_id_fkey";
            columns: ["beauty_page_id"];
            referencedRelation: "beauty_pages";
            referencedColumns: ["id"];
          },
        ];
      };
      specialist_service_assignments: {
        Row: {
          created_at: string;
          duration_minutes: number;
          id: string;
          member_id: string;
          price_cents: number;
          service_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          duration_minutes: number;
          id?: string;
          member_id: string;
          price_cents: number;
          service_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          member_id?: string;
          price_cents?: number;
          service_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "specialist_service_assignments_member_id_fkey";
            columns: ["member_id"];
            referencedRelation: "beauty_page_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "specialist_service_assignments_service_id_fkey";
            columns: ["service_id"];
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      working_day_breaks: {
        Row: {
          created_at: string;
          end_time: string;
          id: string;
          start_time: string;
          working_day_id: string;
        };
        Insert: {
          created_at?: string;
          end_time: string;
          id?: string;
          start_time: string;
          working_day_id: string;
        };
        Update: {
          created_at?: string;
          end_time?: string;
          id?: string;
          start_time?: string;
          working_day_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "working_day_breaks_working_day_id_fkey";
            columns: ["working_day_id"];
            referencedRelation: "working_days";
            referencedColumns: ["id"];
          },
        ];
      };
      working_days: {
        Row: {
          created_at: string;
          date: string;
          end_time: string;
          id: string;
          specialist_id: string;
          start_time: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          date: string;
          end_time: string;
          id?: string;
          specialist_id: string;
          start_time: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          end_time?: string;
          id?: string;
          specialist_id?: string;
          start_time?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "working_days_specialist_id_fkey";
            columns: ["specialist_id"];
            referencedRelation: "beauty_page_specialists";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invitation: { Args: { invitation_id: string }; Returns: boolean };
      decline_invitation: { Args: { invitation_id: string }; Returns: boolean };
      get_beauty_page_id_from_specialist: {
        Args: { spec_id: string };
        Returns: string;
      };
      get_invitation_by_token: {
        Args: { invite_token: string };
        Returns: {
          beauty_page_id: string;
          beauty_page_name: string;
          beauty_page_slug: string;
          created_at: string;
          email: string;
          id: string;
          invited_by_name: string;
          roles: Database["public"]["Enums"]["beauty_page_member_role"][];
          status: Database["public"]["Enums"]["invitation_status"];
        }[];
      };
      get_specialist_id_from_working_day: {
        Args: { wd_id: string };
        Returns: string;
      };
      get_specialist_rating_stats: {
        Args: { spec_id: string };
        Returns: {
          average_rating: number;
          rating_distribution: Json;
          total_reviews: number;
        }[];
      };
      is_beauty_page_admin: { Args: { page_id: string }; Returns: boolean };
      is_beauty_page_owner: { Args: { page_id: string }; Returns: boolean };
      is_own_specialist: { Args: { spec_id: string }; Returns: boolean };
    };
    Enums: {
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show";
      beauty_page_member_role: "admin" | "specialist";
      invitation_status: "pending" | "accepted" | "declined";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
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
} as const;
