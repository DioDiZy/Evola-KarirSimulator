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
      career_levels: {
        Row: {
          description: string
          id: string
          name: string
          slug: string
          sort_order: number
          status: string
          track_id: string
        }
        Insert: {
          description: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          status?: string
          track_id: string
        }
        Update: {
          description?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          status?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_levels_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "career_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      career_tracks: {
        Row: {
          field_id: string
          id: string
          name: string
          slug: string
          sort_order: number
          status: string
          tagline: string
        }
        Insert: {
          field_id: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          status?: string
          tagline: string
        }
        Update: {
          field_id?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          status?: string
          tagline?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_tracks_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "fields"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          career_credit_reward: number
          id: string
          level_id: string
          name: string
          slug: string
          sort_order: number
          synopsis: string
        }
        Insert: {
          career_credit_reward?: number
          id?: string
          level_id: string
          name: string
          slug: string
          sort_order?: number
          synopsis: string
        }
        Update: {
          career_credit_reward?: number
          id?: string
          level_id?: string
          name?: string
          slug?: string
          sort_order?: number
          synopsis?: string
        }
        Relationships: [
          {
            foreignKeyName: "episodes_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "career_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      fields: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          status: string
          tagline: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          status?: string
          tagline: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          status?: string
          tagline?: string
        }
        Relationships: []
      }
      missions: {
        Row: {
          content: Json
          duration_minutes: number
          episode_id: string
          id: string
          name: string
          slug: string
          sort_order: number
          type: string
        }
        Insert: {
          content: Json
          duration_minutes?: number
          episode_id: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          type: string
        }
        Update: {
          content?: Json
          duration_minutes?: number
          episode_id?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_episode_completions: {
        Row: {
          career_credits_awarded: number
          completed_at: string
          episode_id: string
          id: string
          user_id: string
        }
        Insert: {
          career_credits_awarded: number
          completed_at?: string
          episode_id: string
          id?: string
          user_id: string
        }
        Update: {
          career_credits_awarded?: number
          completed_at?: string
          episode_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_episode_completions_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mission_attempts: {
        Row: {
          completed_at: string
          decisions: Json
          feedback: Json
          id: string
          max_score: number
          mission_id: string
          passed: boolean
          performance_delta: number
          score: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          decisions: Json
          feedback: Json
          id?: string
          max_score: number
          mission_id: string
          passed: boolean
          performance_delta?: number
          score: number
          user_id: string
        }
        Update: {
          completed_at?: string
          decisions?: Json
          feedback?: Json
          id?: string
          max_score?: number
          mission_id?: string
          passed?: boolean
          performance_delta?: number
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mission_attempts_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_track_progress: {
        Row: {
          career_credits: number
          current_episode_id: string | null
          id: string
          performance_points: number
          track_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          career_credits?: number
          current_episode_id?: string | null
          id?: string
          performance_points?: number
          track_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          career_credits?: number
          current_episode_id?: string | null
          id?: string
          performance_points?: number
          track_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_track_progress_current_episode_id_fkey"
            columns: ["current_episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_track_progress_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "career_tracks"
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
