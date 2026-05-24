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
      computers: {
        Row: {
          computer_type: string
          created_at: string
          employee_id: string | null
          hardware: Json | null
          id: string
          inventory_number: string
          lifecycle_status: Database["public"]["Enums"]["computer_status"]
          room: string | null
          serial_number: string | null
          updated_at: string
        }
        Insert: {
          computer_type?: string
          created_at?: string
          employee_id?: string | null
          hardware?: Json | null
          id?: string
          inventory_number: string
          lifecycle_status?: Database["public"]["Enums"]["computer_status"]
          room?: string | null
          serial_number?: string | null
          updated_at?: string
        }
        Update: {
          computer_type?: string
          created_at?: string
          employee_id?: string | null
          hardware?: Json | null
          id?: string
          inventory_number?: string
          lifecycle_status?: Database["public"]["Enums"]["computer_status"]
          room?: string | null
          serial_number?: string | null
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
        ]
      }
      employees: {
        Row: {
          created_at: string
          department: string | null
          email: string | null
          employee_number: string | null
          full_name: string
          id: string
          is_active: boolean
          position: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email?: string | null
          employee_number?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          position?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string | null
          employee_number?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          position?: string | null
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
        ]
      }
      license_pools: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          license_type: Database["public"]["Enums"]["license_type"]
          notes: string | null
          price_per_unit: number
          software_id: string
          total_seats: number
          updated_at: string
          used_seats: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          license_type?: Database["public"]["Enums"]["license_type"]
          notes?: string | null
          price_per_unit?: number
          software_id: string
          total_seats?: number
          updated_at?: string
          used_seats?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          license_type?: Database["public"]["Enums"]["license_type"]
          notes?: string | null
          price_per_unit?: number
          software_id?: string
          total_seats?: number
          updated_at?: string
          used_seats?: number
        }
        Relationships: [
          {
            foreignKeyName: "license_pools_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
        ]
      }
      software: {
        Row: {
          created_at: string
          id: string
          name: string
          vendor: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          vendor?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          vendor?: string | null
          version?: string | null
        }
        Relationships: []
      }
      software_installations: {
        Row: {
          computer_id: string
          id: string
          installed_at: string
          license_pool_id: string | null
          software_id: string
        }
        Insert: {
          computer_id: string
          id?: string
          installed_at?: string
          license_pool_id?: string | null
          software_id: string
        }
        Update: {
          computer_id?: string
          id?: string
          installed_at?: string
          license_pool_id?: string | null
          software_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "software_installations_computer_id_fkey"
            columns: ["computer_id"]
            isOneToOne: false
            referencedRelation: "computers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "software_installations_license_pool_id_fkey"
            columns: ["license_pool_id"]
            isOneToOne: false
            referencedRelation: "license_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "software_installations_software_id_fkey"
            columns: ["software_id"]
            isOneToOne: false
            referencedRelation: "software"
            referencedColumns: ["id"]
          },
        ]
      }
      workplaces: {
        Row: {
          assigned_at: string | null
          computer_id: string | null
          created_at: string
          employee_id: string | null
          id: string
          room: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          computer_id?: string | null
          created_at?: string
          employee_id?: string | null
          id?: string
          room: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          computer_id?: string | null
          created_at?: string
          employee_id?: string | null
          id?: string
          room?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workplaces_computer_id_fkey"
            columns: ["computer_id"]
            isOneToOne: false
            referencedRelation: "computers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workplaces_employee_id_fkey"
            columns: ["employee_id"]
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
      [_ in never]: never
    }
    Enums: {
      computer_status: "active" | "repair" | "decommissioned" | "storage"
      incident_priority: "low" | "medium" | "high" | "critical"
      incident_status: "open" | "in_progress" | "resolved"
      incident_type: "hardware" | "software" | "network" | "other"
      license_type: "perpetual" | "subscription"
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
    },
  },
} as const
