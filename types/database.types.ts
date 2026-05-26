export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      computer_licenses: {
        Row: {
          id: string
          computer_id: string
          license_id: string
          installed_at: string
        }
        Insert: {
          id?: string
          computer_id: string
          license_id: string
          installed_at?: string
        }
        Update: {
          id?: string
          computer_id?: string
          license_id?: string
          installed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "computer_licenses_computer_id_fkey"
            columns: ["computer_id"]
            isOneToOne: false
            referencedRelation: "computers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "computer_licenses_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      computer_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          computer_type: string | null
          hardware: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          computer_type?: string | null
          hardware?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          computer_type?: string | null
          hardware?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      computers: {
        Row: {
          computer_type: string | null
          created_at: string
          employee_id: string | null
          hardware: Json | null
          id: string
          inventory_number: string
          lifecycle_status: Database["public"]["Enums"]["computer_status"]
          room: string | null
          serial_number: string | null
          template_id: string | null
          updated_at: string
        }
        Insert: {
          computer_type?: string | null
          created_at?: string
          employee_id?: string | null
          hardware?: Json | null
          id?: string
          inventory_number: string
          lifecycle_status?: Database["public"]["Enums"]["computer_status"]
          room?: string | null
          serial_number?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          computer_type?: string | null
          created_at?: string
          employee_id?: string | null
          hardware?: Json | null
          id?: string
          inventory_number?: string
          lifecycle_status?: Database["public"]["Enums"]["computer_status"]
          room?: string | null
          serial_number?: string | null
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "computers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "computers_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "computer_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          position: string | null
          room: string | null
          role: Database["public"]["Enums"]["user_role"]
          telegram: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          position?: string | null
          room?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telegram?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          position?: string | null
          room?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          telegram?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          computer_id: string | null
          created_at: string
          description: string
          employee_id: string | null
          assigned_to: string | null
          id: string
          incident_type: Database["public"]["Enums"]["incident_type"]
          priority: Database["public"]["Enums"]["incident_priority"]
          resolved_at: string | null
          status: Database["public"]["Enums"]["incident_status"]
          title: string | null
          updated_at: string
        }
        Insert: {
          computer_id?: string | null
          created_at?: string
          description: string
          employee_id?: string | null
          assigned_to?: string | null
          id?: string
          incident_type?: Database["public"]["Enums"]["incident_type"]
          priority?: Database["public"]["Enums"]["incident_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string | null
          updated_at?: string
        }
        Update: {
          computer_id?: string | null
          created_at?: string
          description?: string
          employee_id?: string | null
          assigned_to?: string | null
          id?: string
          incident_type?: Database["public"]["Enums"]["incident_type"]
          priority?: Database["public"]["Enums"]["incident_priority"]
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["incident_status"]
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_computer_id_fkey"
            columns: ["computer_id"]
            isOneToOne: false
            referencedRelation: "computers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          license_key: string | null
          license_type: Database["public"]["Enums"]["license_type"]
          notes: string | null
          price_per_unit: number | null
          software_name: string
          total_seats: number
          used_seats: number
          vendor: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          license_key?: string | null
          license_type?: Database["public"]["Enums"]["license_type"]
          notes?: string | null
          price_per_unit?: number | null
          software_name: string
          total_seats?: number
          used_seats?: number
          vendor?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          license_key?: string | null
          license_type?: Database["public"]["Enums"]["license_type"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      computer_status: "active" | "repair" | "decommissioned" | "storage"
      incident_priority: "low" | "medium" | "high" | "critical"
      incident_status: "open" | "in_progress" | "resolved"
      incident_type: "hardware" | "software" | "network" | "other"
      license_type: "perpetual" | "subscription"
      user_role: "admin" | "employee" | "it_specialist"
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

export const Constants = {
  public: {
    Enums: {
      computer_status: ["active", "repair", "decommissioned", "storage"],
      incident_priority: ["low", "medium", "high", "critical"],
      incident_status: ["open", "in_progress", "resolved"],
      incident_type: ["hardware", "software", "network", "other"],
      license_type: ["perpetual", "subscription"],
      user_role: ["admin", "employee", "it_specialist"],
    },
  },
} as const
