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
      consent_records: {
        Row: {
          communications: boolean
          consent_version: string
          created_at: string
          data_collection: boolean
          directory_participation: boolean
          id: string
          ip_address: string | null
          mentorship_matching: boolean
          user_id: string
        }
        Insert: {
          communications: boolean
          consent_version: string
          created_at?: string
          data_collection: boolean
          directory_participation: boolean
          id?: string
          ip_address?: string | null
          mentorship_matching: boolean
          user_id: string
        }
        Update: {
          communications?: boolean
          consent_version?: string
          created_at?: string
          data_collection?: boolean
          directory_participation?: boolean
          id?: string
          ip_address?: string | null
          mentorship_matching?: boolean
          user_id?: string
        }
        Relationships: []
      }
      education_records: {
        Row: {
          country: string | null
          created_at: string
          graduation_year: number | null
          honors: string | null
          id: string
          institution: string
          is_mandatory: boolean
          level: Database["public"]["Enums"]["education_level"]
          major: string | null
          organization: string | null
          user_id: string
          year_awarded: number | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          graduation_year?: number | null
          honors?: string | null
          id?: string
          institution: string
          is_mandatory?: boolean
          level: Database["public"]["Enums"]["education_level"]
          major?: string | null
          organization?: string | null
          user_id: string
          year_awarded?: number | null
        }
        Update: {
          country?: string | null
          created_at?: string
          graduation_year?: number | null
          honors?: string | null
          id?: string
          institution?: string
          is_mandatory?: boolean
          level?: Database["public"]["Enums"]["education_level"]
          major?: string | null
          organization?: string | null
          user_id?: string
          year_awarded?: number | null
        }
        Relationships: []
      }
      employment_records: {
        Row: {
          business_type: string | null
          city: string | null
          company: string
          country: string | null
          created_at: string
          end_year: number | null
          id: string
          industry: string | null
          is_current: boolean
          position: string
          start_year: number | null
          user_id: string
        }
        Insert: {
          business_type?: string | null
          city?: string | null
          company: string
          country?: string | null
          created_at?: string
          end_year?: number | null
          id?: string
          industry?: string | null
          is_current?: boolean
          position: string
          start_year?: number | null
          user_id: string
        }
        Update: {
          business_type?: string | null
          city?: string | null
          company?: string
          country?: string | null
          created_at?: string
          end_year?: number | null
          id?: string
          industry?: string | null
          is_current?: boolean
          position?: string
          start_year?: number | null
          user_id?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          is_archived: boolean
          is_published: boolean
          location: string | null
          name: string
          rsvp_deadline: string | null
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          is_archived?: boolean
          is_published?: boolean
          location?: string | null
          name: string
          rsvp_deadline?: string | null
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          is_archived?: boolean
          is_published?: boolean
          location?: string | null
          name?: string
          rsvp_deadline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      industry_partners: {
        Row: {
          created_at: string
          display_order: number
          id: string
          logo_url: string | null
          name: string
          website: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          logo_url?: string | null
          name: string
          website?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          logo_url?: string | null
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      internship_posts: {
        Row: {
          application_link: string | null
          company_name: string
          contact_email: string | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string
          employment_type: Database["public"]["Enums"]["employment_type"]
          id: string
          location: string | null
          position: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["post_status"]
          updated_at: string
        }
        Insert: {
          application_link?: string | null
          company_name: string
          contact_email?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          location?: string | null
          position: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
        }
        Update: {
          application_link?: string | null
          company_name?: string
          contact_email?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string
          employment_type?: Database["public"]["Enums"]["employment_type"]
          id?: string
          location?: string | null
          position?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          updated_at?: string
        }
        Relationships: []
      }
      mentorship_settings: {
        Row: {
          available_as_mentor: boolean
          hours_per_month: number | null
          industry_expertise: string[]
          mentorship_areas: string[]
          preferred_contact_method: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_as_mentor?: boolean
          hours_per_month?: number | null
          industry_expertise?: string[]
          mentorship_areas?: string[]
          preferred_contact_method?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_as_mentor?: boolean
          hours_per_month?: number | null
          industry_expertise?: string[]
          mentorship_areas?: string[]
          preferred_contact_method?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_published: boolean
          published_at: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          published_at?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          published_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          admission_year: number | null
          avatar_url: string | null
          certifications: string[]
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          expertise: string[]
          facebook_url: string | null
          first_name: string
          gender: string | null
          generation: number | null
          graduation_year: number | null
          id: string
          instagram_url: string | null
          is_approved: boolean
          is_featured: boolean
          last_name: string
          linkedin_url: string | null
          major: Database["public"]["Enums"]["major_type"] | null
          nationality: string | null
          partner_university: string | null
          personal_website: string | null
          phone: string | null
          preferred_name: string | null
          professional_summary: string | null
          program_type: Database["public"]["Enums"]["program_type"] | null
          province: string | null
          research_interests: string[]
          show_email: boolean
          show_facebook: boolean
          show_instagram: boolean
          show_linkedin: boolean
          show_phone: boolean
          show_website: boolean
          skills: string[]
          student_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          admission_year?: number | null
          avatar_url?: string | null
          certifications?: string[]
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          expertise?: string[]
          facebook_url?: string | null
          first_name?: string
          gender?: string | null
          generation?: number | null
          graduation_year?: number | null
          id: string
          instagram_url?: string | null
          is_approved?: boolean
          is_featured?: boolean
          last_name?: string
          linkedin_url?: string | null
          major?: Database["public"]["Enums"]["major_type"] | null
          nationality?: string | null
          partner_university?: string | null
          personal_website?: string | null
          phone?: string | null
          preferred_name?: string | null
          professional_summary?: string | null
          program_type?: Database["public"]["Enums"]["program_type"] | null
          province?: string | null
          research_interests?: string[]
          show_email?: boolean
          show_facebook?: boolean
          show_instagram?: boolean
          show_linkedin?: boolean
          show_phone?: boolean
          show_website?: boolean
          skills?: string[]
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          admission_year?: number | null
          avatar_url?: string | null
          certifications?: string[]
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          expertise?: string[]
          facebook_url?: string | null
          first_name?: string
          gender?: string | null
          generation?: number | null
          graduation_year?: number | null
          id?: string
          instagram_url?: string | null
          is_approved?: boolean
          is_featured?: boolean
          last_name?: string
          linkedin_url?: string | null
          major?: Database["public"]["Enums"]["major_type"] | null
          nationality?: string | null
          partner_university?: string | null
          personal_website?: string | null
          phone?: string | null
          preferred_name?: string | null
          professional_summary?: string | null
          program_type?: Database["public"]["Enums"]["program_type"] | null
          province?: string | null
          research_interests?: string[]
          show_email?: boolean
          show_facebook?: boolean
          show_instagram?: boolean
          show_linkedin?: boolean
          show_phone?: boolean
          show_website?: boolean
          skills?: string[]
          student_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          alumni_name: string | null
          company: string | null
          content: string
          created_at: string
          created_by: string | null
          featured_alumni_id: string | null
          generation: number | null
          id: string
          image_url: string | null
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          alumni_name?: string | null
          company?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          featured_alumni_id?: string | null
          generation?: number | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          alumni_name?: string | null
          company?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          featured_alumni_id?: string | null
          generation?: number | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "success_stories_featured_alumni_id_fkey"
            columns: ["featured_alumni_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "success_stories_featured_alumni_id_fkey"
            columns: ["featured_alumni_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      internship_posts_public: {
        Row: {
          application_link: string | null
          company_name: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          id: string | null
          location: string | null
          position: string | null
          status: Database["public"]["Enums"]["post_status"] | null
          updated_at: string | null
        }
        Insert: {
          application_link?: string | null
          company_name?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          id?: string | null
          location?: string | null
          position?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          updated_at?: string | null
        }
        Update: {
          application_link?: string | null
          company_name?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          id?: string | null
          location?: string | null
          position?: string | null
          status?: Database["public"]["Enums"]["post_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles_public: {
        Row: {
          admission_year: number | null
          available_as_mentor: boolean | null
          avatar_url: string | null
          certifications: string[] | null
          city: string | null
          country: string | null
          created_at: string | null
          expertise: string[] | null
          first_name: string | null
          generation: number | null
          graduation_year: number | null
          id: string | null
          is_featured: boolean | null
          last_name: string | null
          major: Database["public"]["Enums"]["major_type"] | null
          partner_university: string | null
          preferred_name: string | null
          professional_summary: string | null
          program_type: Database["public"]["Enums"]["program_type"] | null
          research_interests: string[] | null
          skills: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_generation_status: {
        Args: { gen: number }
        Returns: Database["public"]["Enums"]["generation_status"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "alumni"
      education_level:
        | "high_school"
        | "bachelor"
        | "master"
        | "phd"
        | "certification"
      employment_type: "internship" | "full_time" | "part_time" | "contract"
      generation_status: "alumni" | "current_student" | "incoming_student"
      major_type:
        | "Chemical Engineering and Management"
        | "Civil Engineering and Real Estate Development"
        | "Electrical and Data Engineering"
        | "Mechanical Engineering and Industrial Management"
        | "Industrial Engineering (Legacy Program)"
      post_status: "pending" | "approved" | "rejected"
      program_type: "TEPE" | "TEP" | "TEPE+"
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
      app_role: ["admin", "alumni"],
      education_level: [
        "high_school",
        "bachelor",
        "master",
        "phd",
        "certification",
      ],
      employment_type: ["internship", "full_time", "part_time", "contract"],
      generation_status: ["alumni", "current_student", "incoming_student"],
      major_type: [
        "Chemical Engineering and Management",
        "Civil Engineering and Real Estate Development",
        "Electrical and Data Engineering",
        "Mechanical Engineering and Industrial Management",
        "Industrial Engineering (Legacy Program)",
      ],
      post_status: ["pending", "approved", "rejected"],
      program_type: ["TEPE", "TEP", "TEPE+"],
    },
  },
} as const
