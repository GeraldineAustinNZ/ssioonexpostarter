export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_size: number
          file_url: string
          id: string
          mime_type: string
          patient_id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_size: number
          file_url: string
          id?: string
          mime_type: string
          patient_id: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          mime_type?: string
          patient_id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          from_user_id: string
          id: string
          read_at: string | null
          to_user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          from_user_id: string
          id?: string
          read_at?: string | null
          to_user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_user_id?: string
          id?: string
          read_at?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          region: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          region: string
          role: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          region?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      recovery_tasks: {
        Row: {
          completed: boolean
          created_at: string
          description: string
          due_date: string
          id: string
          patient_id: string
          surgery_plan_id: string
          task_type: string
          title: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          description: string
          due_date: string
          id?: string
          patient_id: string
          surgery_plan_id: string
          task_type: string
          title: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          patient_id?: string
          surgery_plan_id?: string
          task_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "recovery_tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovery_tasks_surgery_plan_id_fkey"
            columns: ["surgery_plan_id"]
            isOneToOne: false
            referencedRelation: "surgery_plans"
            referencedColumns: ["id"]
          }
        ]
      }
      surgery_plans: {
        Row: {
          clinic_name: string
          created_at: string
          id: string
          patient_id: string
          procedure_type: string
          status: string
          surgery_date: string
          updated_at: string
        }
        Insert: {
          clinic_name: string
          created_at?: string
          id?: string
          patient_id: string
          procedure_type: string
          status?: string
          surgery_date: string
          updated_at?: string
        }
        Update: {
          clinic_name?: string
          created_at?: string
          id?: string
          patient_id?: string
          procedure_type?: string
          status?: string
          surgery_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surgery_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_provider: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}