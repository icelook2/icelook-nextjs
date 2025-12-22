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
 public: {
 Tables: {
 appointment_services: {
 Row: {
 appointment_id: string;
 created_at: string;
 id: string;
 position: number;
 service_currency: string;
 service_duration_minutes: number;
 service_id: string | null;
 service_name: string;
 service_price: number;
 };
 Insert: {
 appointment_id: string;
 created_at?: string;
 id?: string;
 position?: number;
 service_currency: string;
 service_duration_minutes: number;
 service_id?: string | null;
 service_name: string;
 service_price: number;
 };
 Update: {
 appointment_id?: string;
 created_at?: string;
 id?: string;
 position?: number;
 service_currency?: string;
 service_duration_minutes?: number;
 service_id?: string | null;
 service_name?: string;
 service_price?: number;
 };
 Relationships: [
 {
 foreignKeyName: "appointment_services_appointment_id_fkey";
 columns: ["appointment_id"];
 referencedRelation: "appointments";
 referencedColumns: ["id"];
 },
 {
 foreignKeyName: "appointment_services_service_id_fkey";
 columns: ["service_id"];
 referencedRelation: "services";
 referencedColumns: ["id"];
 },
 ];
 };
 appointment_status_history: {
 Row: {
 appointment_id: string;
 changed_by: string | null;
 created_at: string;
 id: string;
 new_status: string;
 old_status: string | null;
 reason: string | null;
 };
 Insert: {
 appointment_id: string;
 changed_by?: string | null;
 created_at?: string;
 id?: string;
 new_status: string;
 old_status?: string | null;
 reason?: string | null;
 };
 Update: {
 appointment_id?: string;
 changed_by?: string | null;
 created_at?: string;
 id?: string;
 new_status?: string;
 old_status?: string | null;
 reason?: string | null;
 };
 Relationships: [
 {
 foreignKeyName: "appointment_status_history_appointment_id_fkey";
 columns: ["appointment_id"];
 referencedRelation: "appointments";
 referencedColumns: ["id"];
 },
 {
 foreignKeyName: "appointment_status_history_changed_by_fkey";
 columns: ["changed_by"];
 referencedRelation: "profiles";
 referencedColumns: ["id"];
 },
 ];
 };
 appointments: {
 Row: {
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
 service_price: number;
 specialist_display_name: string;
 specialist_id: string | null;
 specialist_notes: string | null;
 specialist_username: string;
 start_time: string;
 status: string;
 timezone: string;
 total_duration_minutes: number | null;
 total_price: number | null;
 updated_at: string;
 };
 Insert: {
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
 service_currency: string;
 service_duration_minutes: number;
 service_id?: string | null;
 service_name: string;
 service_price: number;
 specialist_display_name: string;
 specialist_id?: string | null;
 specialist_notes?: string | null;
 specialist_username: string;
 start_time: string;
 status?: string;
 timezone: string;
 total_duration_minutes?: number | null;
 total_price?: number | null;
 updated_at?: string;
 };
 Update: {
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
 service_price?: number;
 specialist_display_name?: string;
 specialist_id?: string | null;
 specialist_notes?: string | null;
 specialist_username?: string;
 start_time?: string;
 status?: string;
 timezone?: string;
 total_duration_minutes?: number | null;
 total_price?: number | null;
 updated_at?: string;
 };
 Relationships: [
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
 referencedRelation: "specialists";
 referencedColumns: ["id"];
 },
 ];
 };
 organization_contacts: {
 Row: {
 created_at: string;
 email: string | null;
 facebook: string | null;
 id: string;
 instagram: string | null;
 organization_id: string;
 phone: string | null;
 telegram: string | null;
 updated_at: string;
 viber: string | null;
 website: string | null;
 whatsapp: string | null;
 };
 Insert: {
 created_at?: string;
 email?: string | null;
 facebook?: string | null;
 id?: string;
 instagram?: string | null;
 organization_id: string;
 phone?: string | null;
 telegram?: string | null;
 updated_at?: string;
 viber?: string | null;
 website?: string | null;
 whatsapp?: string | null;
 };
 Update: {
 created_at?: string;
 email?: string | null;
 facebook?: string | null;
 id?: string;
 instagram?: string | null;
 organization_id?: string;
 phone?: string | null;
 telegram?: string | null;
 updated_at?: string;
 viber?: string | null;
 website?: string | null;
 whatsapp?: string | null;
 };
 Relationships: [
 {
 foreignKeyName: "organization_contacts_organization_id_fkey";
 columns: ["organization_id"];
 referencedRelation: "organizations";
 referencedColumns: ["id"];
 },
 ];
 };
 organization_members: {
 Row: {
 created_at: string;
 id: string;
 organization_id: string;
 role: string;
 updated_at: string;
 user_id: string;
 };
 Insert: {
 created_at?: string;
 id?: string;
 organization_id: string;
 role?: string;
 updated_at?: string;
 user_id: string;
 };
 Update: {
 created_at?: string;
 id?: string;
 organization_id?: string;
 role?: string;
 updated_at?: string;
 user_id?: string;
 };
 Relationships: [
 {
 foreignKeyName: "organization_members_organization_id_fkey";
 columns: ["organization_id"];
 referencedRelation: "organizations";
 referencedColumns: ["id"];
 },
 {
 foreignKeyName: "organization_members_user_id_fkey";
 columns: ["user_id"];
 referencedRelation: "profiles";
 referencedColumns: ["id"];
 },
 ];
 };
 organizations: {
 Row: {
 created_at: string;
 description: string | null;
 id: string;
 is_active: boolean;
 logo_url: string | null;
 name: string;
 owner_id: string;
 slug: string;
 updated_at: string;
 };
 Insert: {
 created_at?: string;
 description?: string | null;
 id?: string;
 is_active?: boolean;
 logo_url?: string | null;
 name: string;
 owner_id: string;
 slug: string;
 updated_at?: string;
 };
 Update: {
 created_at?: string;
 description?: string | null;
 id?: string;
 is_active?: boolean;
 logo_url?: string | null;
 name?: string;
 owner_id?: string;
 slug?: string;
 updated_at?: string;
 };
 Relationships: [
 {
 foreignKeyName: "organizations_owner_id_fkey";
 columns: ["owner_id"];
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
 salon_contacts: {
 Row: {
 created_at: string;
 email: string | null;
 facebook: string | null;
 id: string;
 instagram: string | null;
 phone: string | null;
 salon_id: string;
 telegram: string | null;
 updated_at: string;
 viber: string | null;
 website: string | null;
 whatsapp: string | null;
 };
 Insert: {
 created_at?: string;
 email?: string | null;
 facebook?: string | null;
 id?: string;
 instagram?: string | null;
 phone?: string | null;
 salon_id: string;
 telegram?: string | null;
 updated_at?: string;
 viber?: string | null;
 website?: string | null;
 whatsapp?: string | null;
 };
 Update: {
 created_at?: string;
 email?: string | null;
 facebook?: string | null;
 id?: string;
 instagram?: string | null;
 phone?: string | null;
 salon_id?: string;
 telegram?: string | null;
 updated_at?: string;
 viber?: string | null;
 website?: string | null;
 whatsapp?: string | null;
 };
 Relationships: [
 {
 foreignKeyName: "salon_contacts_salon_id_fkey";
 columns: ["salon_id"];
 referencedRelation: "salons";
 referencedColumns: ["id"];
 },
 ];
 };
 salon_members: {
 Row: {
 created_at: string;
 id: string;
 role: string;
 salon_id: string;
 specialist_id: string | null;
 updated_at: string;
 user_id: string;
 };
 Insert: {
 created_at?: string;
 id?: string;
 role?: string;
 salon_id: string;
 specialist_id?: string | null;
 updated_at?: string;
 user_id: string;
 };
 Update: {
 created_at?: string;
 id?: string;
 role?: string;
 salon_id?: string;
 specialist_id?: string | null;
 updated_at?: string;
 user_id?: string;
 };
 Relationships: [
 {
 foreignKeyName: "salon_members_salon_id_fkey";
 columns: ["salon_id"];
 referencedRelation: "salons";
 referencedColumns: ["id"];
 },
 {
 foreignKeyName: "salon_members_specialist_id_fkey";
 columns: ["specialist_id"];
 referencedRelation: "specialists";
 referencedColumns: ["id"];
 },
 {
 foreignKeyName: "salon_members_user_id_fkey";
 columns: ["user_id"];
 referencedRelation: "profiles";
 referencedColumns: ["id"];
 },
 ];
 };
 salons: {
 Row: {
 address_line1: string | null;
 address_line2: string | null;
 city: string | null;
 country: string | null;
 cover_image_url: string | null;
 created_at: string;
 description: string | null;
 id: string;
 is_active: boolean;
 latitude: number | null;
 logo_url: string | null;
 longitude: number | null;
 name: string;
 organization_id: string | null;
 owner_id: string | null;
 postal_code: string | null;
 slug: string;
 state: string | null;
 updated_at: string;
 };
 Insert: {
 address_line1?: string | null;
 address_line2?: string | null;
 city?: string | null;
 country?: string | null;
 cover_image_url?: string | null;
 created_at?: string;
 description?: string | null;
 id?: string;
 is_active?: boolean;
 latitude?: number | null;
 logo_url?: string | null;
 longitude?: number | null;
 name: string;
 organization_id?: string | null;
 owner_id?: string | null;
 postal_code?: string | null;
 slug: string;
 state?: string | null;
 updated_at?: string;
 };
 Update: {
 address_line1?: string | null;
 address_line2?: string | null;
 city?: string | null;
 country?: string | null;
 cover_image_url?: string | null;
 created_at?: string;
 description?: string | null;
 id?: string;
 is_active?: boolean;
 latitude?: number | null;
 logo_url?: string | null;
 longitude?: number | null;
 name?: string;
 organization_id?: string | null;
 owner_id?: string | null;
 postal_code?: string | null;
 slug?: string;
 state?: string | null;
 updated_at?: string;
 };
 Relationships: [
 {
 foreignKeyName: "salons_organization_id_fkey";
 columns: ["organization_id"];
 referencedRelation: "organizations";
 referencedColumns: ["id"];
 },
 {
 foreignKeyName: "salons_owner_id_fkey";
 columns: ["owner_id"];
 referencedRelation: "profiles";
 referencedColumns: ["id"];
 },
 ];
 };
 service_groups: {
 Row: {
 created_at: string;
 id: string;
 is_default: boolean;
 name: string;
 specialist_id: string;
 };
 Insert: {
 created_at?: string;
 id?: string;
 is_default?: boolean;
 name: string;
 specialist_id: string;
 };
 Update: {
 created_at?: string;
 id?: string;
 is_default?: boolean;
 name?: string;
 specialist_id?: string;
 };
 Relationships: [
 {
 foreignKeyName: "service_groups_specialist_id_fkey";
 columns: ["specialist_id"];
 referencedRelation: "specialists";
 referencedColumns: ["id"];
 },
 ];
 };
 services: {
 Row: {
 created_at: string;
 currency: string;
 duration_minutes: number;
 id: string;
 is_active: boolean;
 name: string;
 price: number;
 service_group_id: string;
 updated_at: string;
 };
 Insert: {
 created_at?: string;
 currency: string;
 duration_minutes: number;
 id?: string;
 is_active?: boolean;
 name: string;
 price: number;
 service_group_id: string;
 updated_at?: string;
 };
 Update: {
 created_at?: string;
 currency?: string;
 duration_minutes?: number;
 id?: string;
 is_active?: boolean;
 name?: string;
 price?: number;
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
 specialist_booking_settings: {
 Row: {
 allow_client_cancellation: boolean;
 auto_confirm: boolean;
 cancellation_notice_hours: number;
 created_at: string;
 max_booking_days_ahead: number;
 min_booking_notice_hours: number;
 specialist_id: string;
 updated_at: string;
 };
 Insert: {
 allow_client_cancellation?: boolean;
 auto_confirm?: boolean;
 cancellation_notice_hours?: number;
 created_at?: string;
 max_booking_days_ahead?: number;
 min_booking_notice_hours?: number;
 specialist_id: string;
 updated_at?: string;
 };
 Update: {
 allow_client_cancellation?: boolean;
 auto_confirm?: boolean;
 cancellation_notice_hours?: number;
 created_at?: string;
 max_booking_days_ahead?: number;
 min_booking_notice_hours?: number;
 specialist_id?: string;
 updated_at?: string;
 };
 Relationships: [
 {
 foreignKeyName: "specialist_booking_settings_specialist_id_fkey";
 columns: ["specialist_id"];
 referencedRelation: "specialists";
 referencedColumns: ["id"];
 },
 ];
 };
 specialist_contacts: {
 Row: {
 created_at: string;
 id: string;
 instagram: string | null;
 phone: string | null;
 specialist_id: string;
 telegram: string | null;
 updated_at: string;
 viber: string | null;
 whatsapp: string | null;
 };
 Insert: {
 created_at?: string;
 id?: string;
 instagram?: string | null;
 phone?: string | null;
 specialist_id: string;
 telegram?: string | null;
 updated_at?: string;
 viber?: string | null;
 whatsapp?: string | null;
 };
 Update: {
 created_at?: string;
 id?: string;
 instagram?: string | null;
 phone?: string | null;
 specialist_id?: string;
 telegram?: string | null;
 updated_at?: string;
 viber?: string | null;
 whatsapp?: string | null;
 };
 Relationships: [
 {
 foreignKeyName: "specialist_contacts_specialist_id_fkey";
 columns: ["specialist_id"];
 referencedRelation: "specialists";
 referencedColumns: ["id"];
 },
 ];
 };
 specialist_schedule_config: {
 Row: {
 created_at: string;
 default_slot_duration: number;
 specialist_id: string;
 timezone: string;
 updated_at: string;
 };
 Insert: {
 created_at?: string;
 default_slot_duration?: number;
 specialist_id: string;
 timezone?: string;
 updated_at?: string;
 };
 Update: {
 created_at?: string;
 default_slot_duration?: number;
 specialist_id?: string;
 timezone?: string;
 updated_at?: string;
 };
 Relationships: [
 {
 foreignKeyName: "specialist_schedule_config_specialist_id_fkey";
 columns: ["specialist_id"];
 referencedRelation: "specialists";
 referencedColumns: ["id"];
 },
 ];
 };
 specialists: {
 Row: {
 bio: string | null;
 created_at: string;
 display_name: string;
 id: string;
 is_active: boolean;
 specialty: string;
 updated_at: string;
 user_id: string;
 username: string;
 };
 Insert: {
 bio?: string | null;
 created_at?: string;
 display_name: string;
 id?: string;
 is_active?: boolean;
 specialty: string;
 updated_at?: string;
 user_id: string;
 username: string;
 };
 Update: {
 bio?: string | null;
 created_at?: string;
 display_name?: string;
 id?: string;
 is_active?: boolean;
 specialty?: string;
 updated_at?: string;
 user_id?: string;
 username?: string;
 };
 Relationships: [
 {
 foreignKeyName: "specialists_user_id_fkey";
 columns: ["user_id"];
 referencedRelation: "profiles";
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
 referencedRelation: "specialists";
 referencedColumns: ["id"];
 },
 ];
 };
 };
 Views: {
 [_ in never]: never;
 };
 Functions: {
 get_available_slots: {
 Args: {
 p_date: string;
 p_service_duration_minutes?: number;
 p_specialist_id: string;
 };
 Returns: {
 available: boolean;
 blocked_reason: string;
 end_time: string;
 start_time: string;
 }[];
 };
 is_slot_available: {
 Args: {
 p_date: string;
 p_end_time: string;
 p_specialist_id: string;
 p_start_time: string;
 };
 Returns: boolean;
 };
 };
 Enums: {
 [_ in never]: never;
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
