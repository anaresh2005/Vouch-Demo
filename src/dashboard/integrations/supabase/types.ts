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
      legal_acceptances: {
        Row: {
          accepted_at: string
          brand_id: string
          document: string
          id: string
          ip_address: string | null
          sha256: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          version: string
        }
        Insert: {
          accepted_at?: string
          brand_id?: string
          document?: string
          id?: string
          ip_address?: string | null
          sha256?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          version?: string
        }
        Update: {
          accepted_at?: string
          brand_id?: string
          document?: string
          id?: string
          ip_address?: string | null
          sha256?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_acceptances_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          brand_id: string
          brand_role: string
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          revoked_at: string | null
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          brand_id: string
          brand_role?: string
          created_at?: string
          created_by?: string | null
          expires_at: string
          id?: string
          revoked_at?: string | null
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          brand_id?: string
          brand_role?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          revoked_at?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_invites_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          delivery_days: number | null
          discount_at_min_percent: number
          floor_discount_percent: number | null
          free_express_shipping: boolean
          full_discount_followers: number
          max_uses_per_customer: number
          posting_window_days: number
          post_ideas: string[]
          post_messaging: string
          max_discount_amount: number | null
          combine_with_other_discounts: boolean
          accepting_orders: boolean
          button_pages: string[]
          button_color: string
          button_text: string
          button_corners: string
          button_radius: number | null
          button_size: string
          settings_completed_at: string | null
          terms_accepted_at: string | null
          terms_accepted_version: string | null
          uses_period: string
          contact_email: string | null
          created_at: string
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
          delivery_days?: number | null
          discount_at_min_percent?: number
          floor_discount_percent?: number | null
          free_express_shipping?: boolean
          full_discount_followers?: number
          max_uses_per_customer?: number
          posting_window_days?: number
          post_ideas?: string[]
          post_messaging?: string
          max_discount_amount?: number | null
          combine_with_other_discounts?: boolean
          accepting_orders?: boolean
          button_pages?: string[]
          button_color?: string
          button_text?: string
          button_corners?: string
          button_radius?: number | null
          button_size?: string
          settings_completed_at?: string | null
          terms_accepted_at?: string | null
          terms_accepted_version?: string | null
          uses_period?: string
          contact_email?: string | null
          created_at?: string
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
          delivery_days?: number | null
          discount_at_min_percent?: number
          floor_discount_percent?: number | null
          free_express_shipping?: boolean
          full_discount_followers?: number
          max_uses_per_customer?: number
          posting_window_days?: number
          post_ideas?: string[]
          post_messaging?: string
          max_discount_amount?: number | null
          combine_with_other_discounts?: boolean
          accepting_orders?: boolean
          button_pages?: string[]
          button_color?: string
          button_text?: string
          button_corners?: string
          button_radius?: number | null
          button_size?: string
          settings_completed_at?: string | null
          terms_accepted_at?: string | null
          terms_accepted_version?: string | null
          uses_period?: string
          contact_email?: string | null
          created_at?: string
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
          bio: string | null
          category: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          instagram_engagement_rate: number | null
          instagram_followers: number | null
          instagram_username: string | null
          instagram_verified: boolean
          phone: string | null
          profile_image_url: string | null
          sponsored_posts_30d: number | null
          stripe_customer_id: string | null
          tiktok_engagement_rate: number | null
          tiktok_followers: number | null
          tiktok_username: string | null
          tiktok_verified: boolean
          updated_at: string
        }
        Insert: {
          bio?: string | null
          category?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          instagram_engagement_rate?: number | null
          instagram_followers?: number | null
          instagram_username?: string | null
          instagram_verified?: boolean
          phone?: string | null
          profile_image_url?: string | null
          sponsored_posts_30d?: number | null
          stripe_customer_id?: string | null
          tiktok_engagement_rate?: number | null
          tiktok_followers?: number | null
          tiktok_username?: string | null
          tiktok_verified?: boolean
          updated_at?: string
        }
        Update: {
          bio?: string | null
          category?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          instagram_engagement_rate?: number | null
          instagram_followers?: number | null
          instagram_username?: string | null
          instagram_verified?: boolean
          phone?: string | null
          profile_image_url?: string | null
          sponsored_posts_30d?: number | null
          stripe_customer_id?: string | null
          tiktok_engagement_rate?: number | null
          tiktok_followers?: number | null
          tiktok_username?: string | null
          tiktok_verified?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          brand_id: string | null
          brand_role: string | null
          created_at: string
          email: string | null
          full_name: string | null
          job_title: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          brand_id?: string | null
          brand_role?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          job_title?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          brand_id?: string | null
          brand_role?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          job_title?: string | null
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
      shopify_connections: {
        Row: {
          access_token: string | null
          app_client_id: string | null
          brand_id: string
          id: string
          installed_at: string | null
          last_webhook_at: string | null
          last_webhook_topic: string | null
          refresh_expires_at: string | null
          refresh_token: string | null
          scopes: string
          shop_country: string | null
          shop_currency: string | null
          shop_domain: string
          shop_email: string | null
          shop_name: string | null
          shop_updated_at: string | null
          token_expires_at: string | null
          token_lock_id: string | null
          token_lock_until: string | null
          uninstalled_at: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          app_client_id?: string | null
          brand_id: string
          id?: string
          installed_at?: string | null
          last_webhook_at?: string | null
          last_webhook_topic?: string | null
          refresh_expires_at?: string | null
          refresh_token?: string | null
          scopes: string
          shop_country?: string | null
          shop_currency?: string | null
          shop_domain: string
          shop_email?: string | null
          shop_name?: string | null
          shop_updated_at?: string | null
          token_expires_at?: string | null
          token_lock_id?: string | null
          token_lock_until?: string | null
          uninstalled_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          app_client_id?: string | null
          brand_id?: string
          id?: string
          installed_at?: string | null
          last_webhook_at?: string | null
          last_webhook_topic?: string | null
          refresh_expires_at?: string | null
          refresh_token?: string | null
          scopes?: string
          shop_country?: string | null
          shop_currency?: string | null
          shop_domain?: string
          shop_email?: string | null
          shop_name?: string | null
          shop_updated_at?: string | null
          token_expires_at?: string | null
          token_lock_id?: string | null
          token_lock_until?: string | null
          uninstalled_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_connections_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_oauth_states: {
        Row: {
          brand_id: string
          created_at: string
          expires_at: string
          return_origin: string | null
          shop_domain: string
          state: string
          user_id: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          expires_at?: string
          return_origin?: string | null
          shop_domain: string
          state: string
          user_id?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          expires_at?: string
          return_origin?: string | null
          shop_domain?: string
          state?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_oauth_states_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_webhook_receipts: {
        Row: {
          event_id: string
          received_at: string
          request_data: Json | null
          shop_domain: string
          status: string
          topic: string
        }
        Insert: {
          event_id: string
          received_at?: string
          request_data?: Json | null
          shop_domain: string
          status?: string
          topic: string
        }
        Update: {
          event_id?: string
          received_at?: string
          request_data?: Json | null
          shop_domain?: string
          status?: string
          topic?: string
        }
        Relationships: []
      }
      vouch_orders: {
        Row: {
          brand_id: string
          charged_at: string | null
          cogs: number | null
          created_at: string
          currency: string
          delivered_at: string | null
          estimated_delivery_at: string | null
          id: string
          influencer_id: string
          items_count: number | null
          order_total: number
          platform: Database["public"]["Enums"]["social_platform"]
          post_deadline: string | null
          sales_tax: number | null
          shipping_carrier: string | null
          shipping_cost: number | null
          shopify_order_id: string | null
          status: Database["public"]["Enums"]["vouch_order_status"]
          stripe_payment_intent_id: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          charged_at?: string | null
          cogs?: number | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          estimated_delivery_at?: string | null
          id?: string
          influencer_id: string
          items_count?: number | null
          order_total: number
          platform: Database["public"]["Enums"]["social_platform"]
          post_deadline?: string | null
          sales_tax?: number | null
          shipping_carrier?: string | null
          shipping_cost?: number | null
          shopify_order_id?: string | null
          status?: Database["public"]["Enums"]["vouch_order_status"]
          stripe_payment_intent_id?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          charged_at?: string | null
          cogs?: number | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          estimated_delivery_at?: string | null
          id?: string
          influencer_id?: string
          items_count?: number | null
          order_total?: number
          platform?: Database["public"]["Enums"]["social_platform"]
          post_deadline?: string | null
          sales_tax?: number | null
          shipping_carrier?: string | null
          shipping_cost?: number | null
          shopify_order_id?: string | null
          status?: Database["public"]["Enums"]["vouch_order_status"]
          stripe_payment_intent_id?: string | null
          tracking_number?: string | null
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
        ]
      }
      vouch_post_reports: {
        Row: {
          post_id: string
          brand_id: string
          reason: string
          reported_by: string | null
          reported_by_name: string | null
          reported_at: string
        }
        Insert: {
          post_id: string
          brand_id: string
          reason: string
          reported_by?: string | null
          reported_by_name?: string | null
          reported_at?: string
        }
        Update: {
          post_id?: string
          brand_id?: string
          reason?: string
          reported_by?: string | null
          reported_by_name?: string | null
          reported_at?: string
        }
        Relationships: []
      }
      vouch_posts: {
        Row: {
          boosting_rights_granted: boolean
          brand_id: string
          comments: number | null
          created_at: string
          detected_at: string
          engagement_rate: number | null
          id: string
          influencer_id: string
          likes: number | null
          checkout_offer_id: string | null
          order_id: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          post_id: string | null
          post_url: string
          views: number | null
        }
        Insert: {
          boosting_rights_granted?: boolean
          brand_id: string
          comments?: number | null
          created_at?: string
          detected_at?: string
          engagement_rate?: number | null
          id?: string
          influencer_id: string
          likes?: number | null
          checkout_offer_id?: string | null
          order_id?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          post_id?: string | null
          post_url: string
          views?: number | null
        }
        Update: {
          boosting_rights_granted?: boolean
          brand_id?: string
          comments?: number | null
          created_at?: string
          detected_at?: string
          engagement_rate?: number | null
          id?: string
          influencer_id?: string
          likes?: number | null
          checkout_offer_id?: string | null
          order_id?: string | null
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
            foreignKeyName: "vouch_posts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vouch_orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_brand_invite: { Args: { p_token: string }; Returns: string }
      accept_merchant_terms: {
        Args: { p_privacy_sha256: string; p_privacy_version: string; p_sha256: string; p_version: string }
        Returns: undefined
      }
      begin_shopify_install: {
        Args: {
          p_brand_id: string
          p_origin: string
          p_shop: string
          p_state: string
          p_user_id: string
        }
        Returns: undefined
      }
      claim_shopify_token: {
        Args: { p_brand_id: string; p_lock: string; p_shop: string }
        Returns: boolean
      }
      complete_shopify_install: {
        Args: {
          p_brand_id: string
          p_credentials: Json
          p_lock: string
          p_metadata: Json
          p_shop: string
          p_user_id: string
        }
        Returns: undefined
      }
      create_brand: {
        Args: {
          p_email?: string
          p_instagram?: string
          p_max_sponsored?: number
          p_min_engagement?: number
          p_min_followers?: number
          p_name: string
          p_tiktok?: string
        }
        Returns: string
      }
      create_brand_invite: { Args: { p_role?: string }; Returns: string }
      list_brand_members: {
        Args: never
        Returns: { user_id: string; email: string | null; full_name: string | null; brand_role: string; joined_at: string }[]
      }
      mark_post_reported: {
        Args: { p_post_id: string; p_reason: string }
        Returns: Database['public']['Tables']['vouch_post_reports']['Row']
      }
      preview_brand_invite: { Args: { p_token: string }; Returns: string | null }
      remove_brand_member: { Args: { p_user_id: string }; Returns: undefined }
      release_shopify_token: {
        Args: { p_brand_id: string; p_lock: string }
        Returns: undefined
      }
      revoke_brand_invite: { Args: { p_invite_id: string }; Returns: undefined }
      set_brand_member_role: { Args: { p_role: string; p_user_id: string }; Returns: undefined }
      transfer_brand_ownership: { Args: { p_user_id: string }; Returns: undefined }
      process_shopify_webhook: {
        Args: {
          p_event_id: string
          p_payload: Json
          p_shop: string
          p_topic: string
          p_triggered_at: string
        }
        Returns: undefined
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
