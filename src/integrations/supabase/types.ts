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
      cart_events: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          id: string
          payment_method: string
          shipping_address: string | null
          status: string
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_method?: string
          shipping_address?: string | null
          status?: string
          total_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_method?: string
          shipping_address?: string | null
          status?: string
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_clicks: {
        Row: {
          created_at: string
          faculty: Database["public"]["Enums"]["faculty_type"] | null
          id: string
          product_id: string
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          faculty?: Database["public"]["Enums"]["faculty_type"] | null
          id?: string
          product_id: string
          source?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          faculty?: Database["public"]["Enums"]["faculty_type"] | null
          id?: string
          product_id?: string
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_clicks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          popularity_score: number | null
          price: number
          rating: number | null
          stock: number | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          popularity_score?: number | null
          price: number
          rating?: number | null
          stock?: number | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          popularity_score?: number | null
          price?: number
          rating?: number | null
          stock?: number | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          brand_preference: string | null
          budget_range: Database["public"]["Enums"]["budget_range"] | null
          created_at: string
          email: string
          faculty: Database["public"]["Enums"]["faculty_type"] | null
          id: string
          name: string
          performance_priority:
            | Database["public"]["Enums"]["performance_priority"]
            | null
          preferred_categories: string[]
          study_year: number | null
          updated_at: string
          usage_type: Database["public"]["Enums"]["usage_type"] | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          brand_preference?: string | null
          budget_range?: Database["public"]["Enums"]["budget_range"] | null
          created_at?: string
          email?: string
          faculty?: Database["public"]["Enums"]["faculty_type"] | null
          id?: string
          name?: string
          performance_priority?:
            | Database["public"]["Enums"]["performance_priority"]
            | null
          preferred_categories?: string[]
          study_year?: number | null
          updated_at?: string
          usage_type?: Database["public"]["Enums"]["usage_type"] | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          brand_preference?: string | null
          budget_range?: Database["public"]["Enums"]["budget_range"] | null
          created_at?: string
          email?: string
          faculty?: Database["public"]["Enums"]["faculty_type"] | null
          id?: string
          name?: string
          performance_priority?:
            | Database["public"]["Enums"]["performance_priority"]
            | null
          preferred_categories?: string[]
          study_year?: number | null
          updated_at?: string
          usage_type?: Database["public"]["Enums"]["usage_type"] | null
          user_id?: string
        }
        Relationships: []
      }
      recently_viewed: {
        Row: {
          id: string
          product_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      cancel_order: { Args: { p_order_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      place_order: {
        Args: {
          p_items: Json
          p_payment_method: string
          p_shipping_address: string
          p_total: number
          p_user_id: string
        }
        Returns: string
      }
      upsert_recently_viewed: {
        Args: { p_product_id: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      budget_range: "low" | "medium" | "high"
      faculty_type:
        | "Engineering"
        | "Business"
        | "Medicine"
        | "Pharmacy"
        | "Computer Science"
        | "Artificial Intelligence"
        | "Arts"
        | "Law"
        | "Media"
        | "Education"
        | "Architecture"
        | "Dentistry"
        | "Nursing"
        | "Science"
        | "Agriculture"
        | "Economics"
        | "Other"
      performance_priority:
        | "battery"
        | "performance"
        | "portability"
        | "balanced"
      usage_type: "gaming" | "programming" | "design" | "study" | "general"
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
      app_role: ["admin", "user"],
      budget_range: ["low", "medium", "high"],
      faculty_type: [
        "Engineering",
        "Business",
        "Medicine",
        "Pharmacy",
        "Computer Science",
        "Artificial Intelligence",
        "Arts",
        "Law",
        "Media",
        "Education",
        "Architecture",
        "Dentistry",
        "Nursing",
        "Science",
        "Agriculture",
        "Economics",
        "Other",
      ],
      performance_priority: [
        "battery",
        "performance",
        "portability",
        "balanced",
      ],
      usage_type: ["gaming", "programming", "design", "study", "general"],
    },
  },
} as const
