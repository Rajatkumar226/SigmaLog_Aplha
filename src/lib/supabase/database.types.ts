/**
 * TypeScript Database Types
 * ==========================
 * Auto-generated types for Supabase database schema
 *
 * To regenerate these types:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
          last_active_at: string | null;
          timezone: string;
          total_habits_created: number;
          total_logs_created: number;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string | null;
          timezone?: string;
          total_habits_created?: number;
          total_logs_created?: number;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string | null;
          timezone?: string;
          total_habits_created?: number;
          total_logs_created?: number;
        };
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string; // Allows custom categories
          points: 1 | 2 | 3;
          reminder_time: string | null;
          reminder_last_sent_date: string | null;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: string; // Allows custom categories
          points: 1 | 2 | 3;
          reminder_time?: string | null;
          reminder_last_sent_date?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string; // Allows custom categories
          points?: 1 | 2 | 3;
          reminder_time?: string | null;
          reminder_last_sent_date?: string | null;
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string;
          log_date: string;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_id: string;
          log_date?: string;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          habit_id?: string;
          log_date?: string;
          completed_at?: string;
          created_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          user_id: string;
          milestone_type: '7_day' | '30_day' | '90_day' | '365_day';
          achieved_at: string;
          streak_length: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          milestone_type: '7_day' | '30_day' | '90_day' | '365_day';
          achieved_at?: string;
          streak_length: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          milestone_type?: '7_day' | '30_day' | '90_day' | '365_day';
          achieved_at?: string;
          streak_length?: number;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          enabled: boolean;
          reminder_time: string;
          timezone: string;
          send_if_not_logged: boolean;
          last_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          enabled?: boolean;
          reminder_time?: string;
          timezone?: string;
          send_if_not_logged?: boolean;
          last_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          enabled?: boolean;
          reminder_time?: string;
          timezone?: string;
          send_if_not_logged?: boolean;
          last_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      shares: {
        Row: {
          id: string;
          user_id: string;
          share_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
          shared_at: string;
          share_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          share_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
          shared_at?: string;
          share_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          share_type?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
          shared_at?: string;
          share_data?: Json | null;
          created_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          user_id: string | null;
          type: 'bug' | 'feature' | 'improvement' | 'other';
          message: string;
          user_email: string | null;
          browser_info: string | null;
          status: 'pending' | 'reviewed' | 'resolved' | 'ignored';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: 'bug' | 'feature' | 'improvement' | 'other';
          message: string;
          user_email?: string | null;
          browser_info?: string | null;
          status?: 'pending' | 'reviewed' | 'resolved' | 'ignored';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: 'bug' | 'feature' | 'improvement' | 'other';
          message?: string;
          user_email?: string | null;
          browser_info?: string | null;
          status?: 'pending' | 'reviewed' | 'resolved' | 'ignored';
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_current_date: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
  };
}
