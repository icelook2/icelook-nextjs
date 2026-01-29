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
      appointment_bundles: {
        Row: {
          appointment_id: string
          bundle_id: string | null
          bundle_name: string
          created_at: string | null
          discount_type: string
          discount_value: number
          discounted_total_cents: number
          id: string
          original_total_cents: number
        }
        Insert: {
          appointment_id: string
          bundle_id?: string | null
          bundle_name: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          discounted_total_cents: number
          id?: string
          original_total_cents: number
        }
        Update: {
          appointment_id?: string
          bundle_id?: string | null
          bundle_name?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          discounted_total_cents?: number
          id?: string
          original_total_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointment_bundles_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_bundles_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "service_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
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
          completed_at: string | null
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
        }
        Insert: {
          beauty_page_id: string
          cancelled_at?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name: string
          client_notes?: string | null
          client_phone: string
          completed_at?: string | null
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
        }
        Update: {
          beauty_page_id?: string
          cancelled_at?: string | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string
          client_notes?: string | null
          client_phone?: string
          completed_at?: string | null
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
      beauty_page_clients: {
        Row: {
          beauty_page_id: string
          blocked_at: string | null
          blocked_until: string | null
          client_id: string
          created_at: string
          id: string
          no_show_count: number
          notes: string | null
          updated_at: string
        }
        Insert: {
          beauty_page_id: string
          blocked_at?: string | null
          blocked_until?: string | null
          client_id: string
          created_at?: string
          id?: string
          no_show_count?: number
          notes?: string | null
          updated_at?: string
        }
        Update: {
          beauty_page_id?: string
          blocked_at?: string | null
          blocked_until?: string | null
          client_id?: string
          created_at?: string
          id?: string
          no_show_count?: number
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beauty_page_clients_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beauty_page_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          slot_interval_minutes: number
          slug: string
          slug_changed_at: string | null
          telegram_url: string | null
          timezone: string
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
          slot_interval_minutes?: number
          slug: string
          slug_changed_at?: string | null
          telegram_url?: string | null
          timezone?: string
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
          slot_interval_minutes?: number
          slug?: string
          slug_changed_at?: string | null
          telegram_url?: string | null
          timezone?: string
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
        ]
      }
      blocked_clients: {
        Row: {
          beauty_page_id: string
          blocked_by: string
          client_email: string | null
          client_id: string | null
          client_phone: string | null
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          beauty_page_id: string
          blocked_by: string
          client_email?: string | null
          client_id?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          beauty_page_id?: string
          blocked_by?: string
          client_email?: string | null
          client_id?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_clients_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_clients_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_restriction_defaults: {
        Row: {
          booking_cooldown_seconds: number
          created_at: string
          id: string
          max_bookings_per_day: number
          max_bookings_per_hour: number
          max_future_appointments: number
          no_show_strikes_for_temp_block: number
          temp_block_duration_days: number
          updated_at: string
        }
        Insert: {
          booking_cooldown_seconds?: number
          created_at?: string
          id?: string
          max_bookings_per_day?: number
          max_bookings_per_hour?: number
          max_future_appointments?: number
          no_show_strikes_for_temp_block?: number
          temp_block_duration_days?: number
          updated_at?: string
        }
        Update: {
          booking_cooldown_seconds?: number
          created_at?: string
          id?: string
          max_bookings_per_day?: number
          max_bookings_per_hour?: number
          max_future_appointments?: number
          no_show_strikes_for_temp_block?: number
          temp_block_duration_days?: number
          updated_at?: string
        }
        Relationships: []
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
      client_no_shows: {
        Row: {
          beauty_page_id: string
          blocked_at: string | null
          blocked_until: string | null
          client_email: string | null
          client_id: string | null
          client_phone: string | null
          created_at: string
          id: string
          is_blocked: boolean
          last_no_show_appointment_id: string | null
          last_no_show_at: string | null
          no_show_count: number
          updated_at: string
        }
        Insert: {
          beauty_page_id: string
          blocked_at?: string | null
          blocked_until?: string | null
          client_email?: string | null
          client_id?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          is_blocked?: boolean
          last_no_show_appointment_id?: string | null
          last_no_show_at?: string | null
          no_show_count?: number
          updated_at?: string
        }
        Update: {
          beauty_page_id?: string
          blocked_at?: string | null
          blocked_until?: string | null
          client_email?: string | null
          client_id?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          is_blocked?: boolean
          last_no_show_appointment_id?: string | null
          last_no_show_at?: string | null
          no_show_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_no_shows_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_no_shows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_no_shows_last_no_show_appointment_id_fkey"
            columns: ["last_no_show_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consent_type: string
          created_at: string
          domain: string
          given_at: string
          id: string
          policy_version: string
          preferences: Json
          subject_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          consent_type?: string
          created_at?: string
          domain: string
          given_at?: string
          id?: string
          policy_version?: string
          preferences?: Json
          subject_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent_type?: string
          created_at?: string
          domain?: string
          given_at?: string
          id?: string
          policy_version?: string
          preferences?: Json
          subject_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      policy_notification_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          policy_version_id: string
          sent_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          policy_version_id: string
          sent_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          policy_version_id?: string
          sent_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_notification_queue_policy_version_id_fkey"
            columns: ["policy_version_id"]
            isOneToOne: false
            referencedRelation: "policy_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_translations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          locale: string
          policy_version_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          locale: string
          policy_version_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          locale?: string
          policy_version_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_translations_policy_version_id_fkey"
            columns: ["policy_version_id"]
            isOneToOne: false
            referencedRelation: "policy_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_versions: {
        Row: {
          created_at: string | null
          effective_date: string
          id: string
          is_current: boolean | null
          policy_type: string
          summary_of_changes: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          effective_date: string
          id?: string
          is_current?: boolean | null
          policy_type: string
          summary_of_changes?: string | null
          version: string
        }
        Update: {
          created_at?: string | null
          effective_date?: string
          id?: string
          is_current?: boolean | null
          policy_type?: string
          summary_of_changes?: string | null
          version?: string
        }
        Relationships: []
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
      promotions: {
        Row: {
          beauty_page_id: string
          created_at: string
          discount_percentage: number
          discounted_price_cents: number
          ends_at: string | null
          id: string
          original_price_cents: number
          recurring_days: number[] | null
          recurring_start_time: string | null
          recurring_valid_until: string | null
          service_id: string
          slot_date: string | null
          slot_end_time: string | null
          slot_start_time: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["promotion_status"]
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at: string
        }
        Insert: {
          beauty_page_id: string
          created_at?: string
          discount_percentage: number
          discounted_price_cents: number
          ends_at?: string | null
          id?: string
          original_price_cents: number
          recurring_days?: number[] | null
          recurring_start_time?: string | null
          recurring_valid_until?: string | null
          service_id: string
          slot_date?: string | null
          slot_end_time?: string | null
          slot_start_time?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["promotion_status"]
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string
        }
        Update: {
          beauty_page_id?: string
          created_at?: string
          discount_percentage?: number
          discounted_price_cents?: number
          ends_at?: string | null
          id?: string
          original_price_cents?: number
          recurring_days?: number[] | null
          recurring_start_time?: string | null
          recurring_valid_until?: string | null
          service_id?: string
          slot_date?: string | null
          slot_end_time?: string | null
          slot_start_time?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["promotion_status"]
          type?: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_usage: {
        Row: {
          amount_used: number
          appointment_id: string
          auto_deducted: boolean
          created_at: string
          id: string
          resource_id: string
          unit_cost_cents: number
        }
        Insert: {
          amount_used: number
          appointment_id: string
          auto_deducted?: boolean
          created_at?: string
          id?: string
          resource_id: string
          unit_cost_cents: number
        }
        Update: {
          amount_used?: number
          appointment_id?: string
          auto_deducted?: boolean
          created_at?: string
          id?: string
          resource_id?: string
          unit_cost_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "resource_usage_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_usage_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          beauty_page_id: string
          cost_per_unit_cents: number
          created_at: string
          current_stock: number
          display_order: number
          id: string
          is_active: boolean
          low_stock_threshold: number | null
          name: string
          unit: string
          updated_at: string
        }
        Insert: {
          beauty_page_id: string
          cost_per_unit_cents?: number
          created_at?: string
          current_stock?: number
          display_order?: number
          id?: string
          is_active?: boolean
          low_stock_threshold?: number | null
          name: string
          unit: string
          updated_at?: string
        }
        Update: {
          beauty_page_id?: string
          cost_per_unit_cents?: number
          created_at?: string
          current_stock?: number
          display_order?: number
          id?: string
          is_active?: boolean
          low_stock_threshold?: number | null
          name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      review_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          review_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          review_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          review_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          appointment_id: string | null
          beauty_page_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_id: string
          specialist_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          beauty_page_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_id: string
          specialist_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          beauty_page_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string
          specialist_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bundle_items: {
        Row: {
          bundle_id: string
          created_at: string | null
          display_order: number
          id: string
          service_id: string
        }
        Insert: {
          bundle_id: string
          created_at?: string | null
          display_order?: number
          id?: string
          service_id: string
        }
        Update: {
          bundle_id?: string
          created_at?: string | null
          display_order?: number
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "service_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bundle_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bundles: {
        Row: {
          beauty_page_id: string
          booked_count: number
          created_at: string | null
          description: string | null
          discount_percentage: number
          discount_type: string
          discount_value: number
          display_order: number
          id: string
          is_active: boolean
          max_quantity: number | null
          name: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          beauty_page_id: string
          booked_count?: number
          created_at?: string | null
          description?: string | null
          discount_percentage?: number
          discount_type?: string
          discount_value?: number
          display_order?: number
          id?: string
          is_active?: boolean
          max_quantity?: number | null
          name: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          beauty_page_id?: string
          booked_count?: number
          created_at?: string | null
          description?: string | null
          discount_percentage?: number
          discount_type?: string
          discount_value?: number
          display_order?: number
          id?: string
          is_active?: boolean
          max_quantity?: number | null
          name?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_bundles_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
        ]
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
      service_resources: {
        Row: {
          created_at: string
          default_amount: number
          id: string
          resource_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          default_amount: number
          id?: string
          resource_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          default_amount?: number
          id?: string
          resource_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_resources_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
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
          is_hidden: boolean
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
          is_hidden?: boolean
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
          is_hidden?: boolean
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
      slug_history: {
        Row: {
          beauty_page_id: string
          changed_at: string
          id: string
          new_slug: string
          old_slug: string
          redirect_until: string
          reserved_until: string
        }
        Insert: {
          beauty_page_id: string
          changed_at?: string
          id?: string
          new_slug: string
          old_slug: string
          redirect_until: string
          reserved_until: string
        }
        Update: {
          beauty_page_id?: string
          changed_at?: string
          id?: string
          new_slug?: string
          old_slug?: string
          redirect_until?: string
          reserved_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "slug_history_beauty_page_id_fkey"
            columns: ["beauty_page_id"]
            isOneToOne: false
            referencedRelation: "beauty_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_booking_limits: {
        Row: {
          booking_cooldown_seconds: number | null
          client_email: string | null
          client_phone: string | null
          created_at: string
          id: string
          max_bookings_per_day: number | null
          max_bookings_per_hour: number | null
          max_future_appointments: number | null
          notes: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_cooldown_seconds?: number | null
          client_email?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          max_bookings_per_day?: number | null
          max_bookings_per_hour?: number | null
          max_future_appointments?: number | null
          notes?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_cooldown_seconds?: number | null
          client_email?: string | null
          client_phone?: string | null
          created_at?: string
          id?: string
          max_bookings_per_day?: number | null
          max_bookings_per_hour?: number | null
          max_future_appointments?: number | null
          notes?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_booking_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_policy_consents: {
        Row: {
          consented_at: string | null
          id: string
          ip_address: unknown
          policy_version_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          consented_at?: string | null
          id?: string
          ip_address?: unknown
          policy_version_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          consented_at?: string | null
          id?: string
          ip_address?: unknown
          policy_version_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_policy_consents_policy_version_id_fkey"
            columns: ["policy_version_id"]
            isOneToOne: false
            referencedRelation: "policy_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      working_day_breaks: {
        Row: {
          completed_at: string | null
          created_at: string
          end_time: string
          id: string
          start_time: string
          working_day_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          end_time: string
          id?: string
          start_time: string
          working_day_id: string
        }
        Update: {
          completed_at?: string | null
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
          slot_interval_minutes: number
          start_time: string
          updated_at: string
        }
        Insert: {
          beauty_page_id: string
          created_at?: string
          date: string
          end_time: string
          id?: string
          slot_interval_minutes?: number
          start_time: string
          updated_at?: string
        }
        Update: {
          beauty_page_id?: string
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          slot_interval_minutes?: number
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
      add_resource_stock: {
        Args: { p_amount: number; p_resource_id: string }
        Returns: boolean
      }
      block_client: {
        Args: {
          p_beauty_page_id: string
          p_blocked_until?: string
          p_client_id: string
        }
        Returns: boolean
      }
      cleanup_expired_slug_history: { Args: never; Returns: number }
      deduct_resource_stock: {
        Args: { p_amount: number; p_resource_id: string }
        Returns: boolean
      }
      expire_old_promotions: { Args: never; Returns: undefined }
      get_beauty_page_clients: {
        Args: {
          p_beauty_page_id: string
          p_include_blocked?: boolean
          p_limit?: number
          p_offset?: number
          p_search?: string
        }
        Returns: {
          avatar_url: string
          blocked_at: string
          blocked_until: string
          client_id: string
          created_at: string
          email: string
          first_visit_at: string
          full_name: string
          last_visit_at: string
          no_show_count: number
          notes: string
          phone: string
          total_spent_cents: number
          total_visits: number
        }[]
      }
      get_beauty_page_for_viewer:
        | { Args: { p_nickname: string }; Returns: Json }
        | { Args: { p_nickname: string; p_viewer_id?: string }; Returns: Json }
      get_beauty_page_id_from_working_day: {
        Args: { wd_id: string }
        Returns: string
      }
      get_beauty_page_rating_stats: {
        Args: { bp_id: string }
        Returns: {
          average_rating: number
          rating_distribution: Json
          total_reviews: number
        }[]
      }
      get_blocked_clients: {
        Args: { p_beauty_page_id: string }
        Returns: {
          avatar_url: string
          blocked_at: string
          blocked_until: string
          client_id: string
          email: string
          full_name: string
          no_show_count: number
          notes: string
          phone: string
        }[]
      }
      get_calendar_dates: {
        Args: {
          p_beauty_page_id: string
          p_end_date: string
          p_start_date: string
        }
        Returns: Json
      }
      get_next_resource_display_order: {
        Args: { p_beauty_page_id: string }
        Returns: number
      }
      get_specialist_rating_stats: {
        Args: { spec_id: string }
        Returns: {
          average_rating: number
          rating_distribution: Json
          total_reviews: number
        }[]
      }
      is_client_blocked: {
        Args: { p_beauty_page_id: string; p_client_id: string }
        Returns: boolean
      }
      is_slug_available: { Args: { check_slug: string }; Returns: boolean }
      is_user_banned_from_beauty_page: {
        Args: { p_beauty_page_id: string; p_user_id: string }
        Returns: boolean
      }
      mark_day_as_off: {
        Args: {
          p_beauty_page_id: string
          p_changes: Json
          p_user_id: string
          p_working_day_id: string
        }
        Returns: Json
      }
      queue_policy_notifications: {
        Args: { p_policy_version_id: string }
        Returns: number
      }
      set_current_policy_version: {
        Args: { p_policy_version_id: string }
        Returns: undefined
      }
      unblock_client: {
        Args: { p_beauty_page_id: string; p_client_id: string }
        Returns: boolean
      }
      update_client_notes: {
        Args: { p_beauty_page_id: string; p_client_id: string; p_notes: string }
        Returns: boolean
      }
    }
    Enums: {
      appointment_status:
        | "pending"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      promotion_status: "active" | "booked" | "expired" | "inactive"
      promotion_type: "sale" | "slot" | "time"
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
      promotion_status: ["active", "booked", "expired", "inactive"],
      promotion_type: ["sale", "slot", "time"],
    },
  },
} as const

