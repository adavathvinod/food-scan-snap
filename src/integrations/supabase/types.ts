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
      chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      enterprise_inquiries: {
        Row: {
          contact_person: string
          created_at: string
          email: string
          id: string
          message: string
          organization_name: string
          phone: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          contact_person: string
          created_at?: string
          email: string
          id?: string
          message: string
          organization_name: string
          phone?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          organization_name?: string
          phone?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      food_stories: {
        Row: {
          calories: number
          caption: string | null
          carbs: number
          created_at: string
          fat: number
          food_name: string
          id: string
          image_url: string
          protein: number
          story_image_url: string | null
          template_style: string
          user_id: string
        }
        Insert: {
          calories: number
          caption?: string | null
          carbs: number
          created_at?: string
          fat: number
          food_name: string
          id?: string
          image_url: string
          protein: number
          story_image_url?: string | null
          template_style: string
          user_id: string
        }
        Update: {
          calories?: number
          caption?: string | null
          carbs?: number
          created_at?: string
          fat?: number
          food_name?: string
          id?: string
          image_url?: string
          protein?: number
          story_image_url?: string | null
          template_style?: string
          user_id?: string
        }
        Relationships: []
      }
      indian_food_nutrition: {
        Row: {
          alternative_names: string[] | null
          calories: number
          carbs_g: number
          category: string
          created_at: string | null
          fat_g: number
          fiber_g: number
          food_name: string
          id: string
          notes: string | null
          protein_g: number
          serving_size: string
          updated_at: string | null
        }
        Insert: {
          alternative_names?: string[] | null
          calories: number
          carbs_g: number
          category: string
          created_at?: string | null
          fat_g: number
          fiber_g: number
          food_name: string
          id?: string
          notes?: string | null
          protein_g: number
          serving_size: string
          updated_at?: string | null
        }
        Update: {
          alternative_names?: string[] | null
          calories?: number
          carbs_g?: number
          category?: string
          created_at?: string | null
          fat_g?: number
          fiber_g?: number
          food_name?: string
          id?: string
          notes?: string | null
          protein_g?: number
          serving_size?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meal_schedules: {
        Row: {
          created_at: string
          id: string
          meal_instructions: string | null
          meal_name: string
          meal_time: string
          reminder_enabled: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meal_instructions?: string | null
          meal_name: string
          meal_time: string
          reminder_enabled?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meal_instructions?: string | null
          meal_name?: string
          meal_time?: string
          reminder_enabled?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      medical_reports: {
        Row: {
          extracted_data: Json
          id: string
          image_url: string | null
          recommendations: string | null
          report_type: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          extracted_data: Json
          id?: string
          image_url?: string | null
          recommendations?: string | null
          report_type: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          extracted_data?: Json
          id?: string
          image_url?: string | null
          recommendations?: string | null
          report_type?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          preferred_language: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          preferred_language?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          preferred_language?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scan_history: {
        Row: {
          calories: number
          carbs: number
          category_icon: string | null
          created_at: string
          fat: number
          fiber: number | null
          food_name: string
          health_tip: string | null
          id: string
          image_url: string | null
          items: Json | null
          protein: number
          scanned_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          category_icon?: string | null
          created_at?: string
          fat?: number
          fiber?: number | null
          food_name: string
          health_tip?: string | null
          id?: string
          image_url?: string | null
          items?: Json | null
          protein?: number
          scanned_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          category_icon?: string | null
          created_at?: string
          fat?: number
          fiber?: number | null
          food_name?: string
          health_tip?: string | null
          id?: string
          image_url?: string | null
          items?: Json | null
          protein?: number
          scanned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          duration_days: number
          features: Json
          id: string
          is_active: boolean
          name: string
          plan_type: Database["public"]["Enums"]["subscription_plan_type"]
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_days: number
          features: Json
          id?: string
          is_active?: boolean
          name: string
          plan_type: Database["public"]["Enums"]["subscription_plan_type"]
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_days?: number
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          plan_type?: Database["public"]["Enums"]["subscription_plan_type"]
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          created_at: string
          daily_calorie_goal: number | null
          daily_carbs_goal: number | null
          daily_fat_goal: number | null
          daily_protein_goal: number | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_calorie_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fat_goal?: number | null
          daily_protein_goal?: number | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_calorie_goal?: number | null
          daily_carbs_goal?: number | null
          daily_fat_goal?: number | null
          daily_protein_goal?: number | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          created_at: string
          show_share_icons: boolean
          show_watermark: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          show_share_icons?: boolean
          show_watermark?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          show_share_icons?: boolean
          show_watermark?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          amount: number
          auto_renew: boolean
          created_at: string
          currency: string
          expiry_date: string
          id: string
          payment_id: string | null
          plan_type: Database["public"]["Enums"]["subscription_plan_type"]
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          auto_renew?: boolean
          created_at?: string
          currency?: string
          expiry_date: string
          id?: string
          payment_id?: string | null
          plan_type: Database["public"]["Enums"]["subscription_plan_type"]
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auto_renew?: boolean
          created_at?: string
          currency?: string
          expiry_date?: string
          id?: string
          payment_id?: string | null
          plan_type?: Database["public"]["Enums"]["subscription_plan_type"]
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          height: number | null
          id: string
          recorded_at: string
          user_id: string
          weight: number
        }
        Insert: {
          height?: number | null
          id?: string
          recorded_at?: string
          user_id: string
          weight: number
        }
        Update: {
          height?: number | null
          id?: string
          recorded_at?: string
          user_id?: string
          weight?: number
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
      subscription_plan_type: "free" | "monthly" | "annual" | "enterprise"
      subscription_status: "active" | "expired" | "cancelled" | "trial"
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
      subscription_plan_type: ["free", "monthly", "annual", "enterprise"],
      subscription_status: ["active", "expired", "cancelled", "trial"],
    },
  },
} as const
