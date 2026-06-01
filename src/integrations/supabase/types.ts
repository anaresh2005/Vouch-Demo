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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      brands: {
        Row: {
          contact_email: string | null
          created_at: string
          estimated_shipping_days: number
          id: string
          instagram_username: string | null
          logo_url: string | null
          max_sponsored_posts_30d: number
          min_engagement_rate: number
          min_followers: number
          name: string
          slug: string
          tiktok_username: string | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          estimated_shipping_days?: number
          id?: string
          instagram_username?: string | null
          logo_url?: string | null
          max_sponsored_posts_30d?: number
          min_engagement_rate?: number
          min_followers?: number
          name: string
          slug: string
          tiktok_username?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          estimated_shipping_days?: number
          id?: string
          instagram_username?: string | null
          logo_url?: string | null
          max_sponsored_posts_30d?: number
          min_engagement_rate?: number
          min_followers?: number
          name?: string
          slug?: string
          tiktok_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      influencers: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          instagram_engagement_rate: number | null
          instagram_followers: number | null
          instagram_username: string | null
          phone: string | null
          sponsored_posts_30d: number | null
          stripe_customer_id: string | null
          tiktok_engagement_rate: number | null
          tiktok_followers: number | null
          tiktok_username: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          instagram_engagement_rate?: number | null
          instagram_followers?: number | null
          instagram_username?: string | null
          phone?: string | null
          sponsored_posts_30d?: number | null
          stripe_customer_id?: string | null
          tiktok_engagement_rate?: number | null
          tiktok_followers?: number | null
          tiktok_username?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          instagram_engagement_rate?: number | null
          instagram_followers?: number | null
          instagram_username?: string | null
          phone?: string | null
          sponsored_posts_30d?: number | null
          stripe_customer_id?: string | null
          tiktok_engagement_rate?: number | null
          tiktok_followers?: number | null
          tiktok_username?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          brand_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          brand_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          brand_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_influencers: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          influencer_id: string
          notes: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          influencer_id: string
          notes?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          influencer_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_influencers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_influencers_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_influencers_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vouch_orders: {
        Row: {
          brand_id: string
          charged_at: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          id: string
          influencer_id: string
          order_total: number
          platform: Database["public"]["Enums"]["social_platform"]
          post_deadline: string | null
          shopify_order_id: string | null
          status: Database["public"]["Enums"]["vouch_order_status"]
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          charged_at?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          id?: string
          influencer_id: string
          order_total: number
          platform: Database["public"]["Enums"]["social_platform"]
          post_deadline?: string | null
          shopify_order_id?: string | null
          status?: Database["public"]["Enums"]["vouch_order_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          charged_at?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          id?: string
          influencer_id?: string
          order_total?: number
          platform?: Database["public"]["Enums"]["social_platform"]
          post_deadline?: string | null
          shopify_order_id?: string | null
          status?: Database["public"]["Enums"]["vouch_order_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouch_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouch_orders_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouch_orders_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      vouch_posts: {
        Row: {
          brand_id: string
          comments: number | null
          created_at: string
          detected_at: string
          engagement_rate: number | null
          id: string
          influencer_id: string
          likes: number | null
          order_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          post_id: string | null
          post_url: string
          views: number | null
        }
        Insert: {
          brand_id: string
          comments?: number | null
          created_at?: string
          detected_at?: string
          engagement_rate?: number | null
          id?: string
          influencer_id: string
          likes?: number | null
          order_id: string
          platform: Database["public"]["Enums"]["social_platform"]
          post_id?: string | null
          post_url: string
          views?: number | null
        }
        Update: {
          brand_id?: string
          comments?: number | null
          created_at?: string
          detected_at?: string
          engagement_rate?: number | null
          id?: string
          influencer_id?: string
          likes?: number | null
          order_id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          post_id?: string | null
          post_url?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vouch_posts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouch_posts_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouch_posts_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vouch_posts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vouch_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      influencers_public: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string | null
          instagram_engagement_rate: number | null
          instagram_followers: number | null
          instagram_username: string | null
          sponsored_posts_30d: number | null
          tiktok_engagement_rate: number | null
          tiktok_followers: number | null
          tiktok_username: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          instagram_engagement_rate?: number | null
          instagram_followers?: number | null
          instagram_username?: string | null
          sponsored_posts_30d?: number | null
          tiktok_engagement_rate?: number | null
          tiktok_followers?: number | null
          tiktok_username?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          instagram_engagement_rate?: number | null
          instagram_followers?: number | null
          instagram_username?: string | null
          sponsored_posts_30d?: number | null
          tiktok_engagement_rate?: number | null
          tiktok_followers?: number | null
          tiktok_username?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      social_platform: "instagram" | "tiktok"
      vouch_order_status:
        | "pending_delivery"
        | "delivered"
        | "post_pending"
        | "post_verified"
        | "charged"
        | "completed"
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
      social_platform: ["instagram", "tiktok"],
      vouch_order_status: [
        "pending_delivery",
        "delivered",
        "post_pending",
        "post_verified",
        "charged",
        "completed",
      ],
    },
  },
} as const
