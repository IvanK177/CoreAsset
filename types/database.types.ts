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
      computer_templates: {
        Row: {
          computer_type: string | null
          created_at: string | null
          description: string | null
          hardware: Json | null
          id: string
          name: string
        }
        Insert: {
          computer_type?: string | null
          created_at?: string | null
          description?: string | null
          hardware?: Json | null
          id?: string
          name: string
        }
        Update: {
          computer_type?: string | null
          created_at?: string | null
          description?: string | null
          hardware?: Json | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      device_licenses: {
        Row: {
          device_id: string
          id: string
          installed_at: string | null
          license_id: string
        }
        Insert: {
          device_id: string
          id?: string
          installed_at?: string | null
          license_id: string
        }
        Update: {
          device_id?: string
          id?: string
          installed_at?: string | null
          license_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_licenses_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_licenses_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          computer_type: string | null
          created_at: string | null
          device_type: Database["public"]["Enums"]["device_type"]
          employee_id: string | null
          hardware: Json | null
          id: string
          inventory_number: string
          lifecycle_status:
            | Database["public"]["Enums"]["computer_status"]
            | null
          photo_urls: string[] | null
          room: string | null
          serial_number: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          computer_type?: string | null
          created_at?: string | null
          device_type?: Database["public"]["Enums"]["device_type"]
          employee_id?: string | null
          hardware?: Json | null
          id?: string
          inventory_number: string
          lifecycle_status?:
            | Database["public"]["Enums"]["computer_status"]
            | null
          photo_urls?: string[] | null
          room?: string | null
          serial_number?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          computer_type?: string | null
          created_at?: string | null
          device_type?: Database["public"]["Enums"]["device_type"]
          employee_id?: string | null
          hardware?: Json | null
          id?: string
          inventory_number?: string
          lifecycle_status?:
            | Database["public"]["Enums"]["computer_status"]
            | null
          photo_urls?: string[] | null
          room?: string | null
          serial_number?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "computer_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          building: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          phone: string | null
          position: string
          role: Database["public"]["Enums"]["user_role"]
          room: string | null
          telegram: string | null
          updated_at: string | null
        }
        Insert: {
          building?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          phone?: string | null
          position: string
          role?: Database["public"]["Enums"]["user_role"]
          room?: string | null
          telegram?: string | null
          updated_at?: string | null
        }
        Update: {
          building?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          phone?: string | null
          position?: string
          role?: Database["public"]["Enums"]["user_role"]
          room?: string | null
          telegram?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      incidents: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string
          device_id: string | null
          employee_id: string | null
          id: string
          incident_type: Database["public"]["Enums"]["incident_type"] | null
          photo_urls: string[] | null
          priority: Database["public"]["Enums"]["incident_priority"] | null
          resolution: string | null
          resolution_photo_urls: string[] | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["incident_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description: string
          device_id?: string | null
          employee_id?: string | null
          id?: string
          incident_type?: Database["public"]["Enums"]["incident_type"] | null
          photo_urls?: string[] | null
          priority?: Database["public"]["Enums"]["incident_priority"] | null
          resolution?: string | null
          resolution_photo_urls?: string[] | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["incident_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          device_id?: string | null
          employee_id?: string | null
          id?: string
          incident_type?: Database["public"]["Enums"]["incident_type"] | null
          photo_urls?: string[] | null
          priority?: Database["public"]["Enums"]["incident_priority"] | null
          resolution?: string | null
          resolution_photo_urls?: string[] | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["incident_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          license_key: string | null
          license_type: Database["public"]["Enums"]["license_type"] | null
          notes: string | null
          price_per_unit: number | null
          software_name: string
          total_seats: number
          used_seats: number
          vendor: string | null
          version: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          license_key?: string | null
          license_type?: Database["public"]["Enums"]["license_type"] | null
          notes?: string | null
          price_per_unit?: number | null
          software_name: string
          total_seats?: number
          used_seats?: number
          vendor?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          license_key?: string | null
          license_type?: Database["public"]["Enums"]["license_type"] | null
          notes?: string | null
          price_per_unit?: number | null
          software_name?: string
          total_seats?: number
          used_seats?: number
          vendor?: string | null
          version?: string | null
        }
        Relationships: []
      }
      room_requests: {
        Row: {
          author_id: string
          created_at: string
          description: string
          id: string
          photo_urls: string[] | null
          resolution: string | null
          resolution_photo_urls: string[] | null
          room: string
          status: string
          type: string
        }
        Insert: {
          author_id: string
          created_at?: string
          description: string
          id?: string
          photo_urls?: string[] | null
          resolution?: string | null
          resolution_photo_urls?: string[] | null
          room: string
          status?: string
          type: string
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string
          id?: string
          photo_urls?: string[] | null
          resolution?: string | null
          resolution_photo_urls?: string[] | null
          room?: string
          status?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_requests_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_role_security_definer: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role: { Args: never; Returns: string }
      is_it_specialist: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      computer_status: "active" | "repair" | "decommissioned" | "storage"
      device_type: "pc" | "monitor" | "keyboard" | "mouse" | "printer" | "other"
      incident_priority: "low" | "medium" | "high" | "critical"
      incident_status: "open" | "in_progress" | "resolved" | "cancelled"
      incident_type: "hardware" | "software" | "network" | "other"
      license_type: "perpetual" | "subscription"
      user_role: "admin" | "employee" | "it_specialist" | "facilities"
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
      computer_status: ["active", "repair", "decommissioned", "storage"],
      device_type: ["pc", "monitor", "keyboard", "mouse", "printer", "other"],
      incident_priority: ["low", "medium", "high", "critical"],
      incident_status: ["open", "in_progress", "resolved", "cancelled"],
      incident_type: ["hardware", "software", "network", "other"],
      license_type: ["perpetual", "subscription"],
      user_role: ["admin", "employee", "it_specialist", "facilities"],
    },
  },
} as const
