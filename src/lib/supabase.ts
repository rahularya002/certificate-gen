import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// For development, we'll use mock data if Supabase is not configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key'
)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Dataset {
  id: string
  name: string
  description?: string
  file_name: string
  file_size: number
  total_rows: number
  columns: string[]
  data: Record<string, any>[]
  created_at: string
  updated_at: string
  status: 'active' | 'locked'
  user_id?: string
}

export interface Template {
  id: string
  name: string
  description?: string
  file_name: string
  file_size: number
  file_url?: string
  placeholders: string[]
  mappings: Record<string, string>
  created_at: string
  updated_at: string
  status: 'active' | 'archived'
  user_id?: string
}

export interface GenerationJob {
  id: string
  dataset_id: string
  template_id: string
  output_format: 'pdf' | 'docx'
  filename_pattern: string
  total_certificates: number
  successful_certificates: number
  failed_certificates: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  current_row: number
  created_at: string
  completed_at?: string
  user_id?: string
}

export interface Certificate {
  id: string
  generation_job_id: string
  participant_name: string
  certificate_no: string
  filename: string
  file_size: number
  aadhar?: string
  dob?: string
  son_or_daughter_of?: string
  job_role?: string
  duration?: string
  training_center?: string
  district?: string
  state?: string
  assessment_partner?: string
  enrollment_no?: string
  issue_place?: string
  grade?: string
  qr_code_data?: string
  qr_code_url?: string
  status: 'ready' | 'error'
  created_at: string
  user_id?: string
}

export interface HistoryRecord {
  id: string
  type: 'dataset' | 'template' | 'generation'
  name: string
  description: string
  created_at: string
  status: 'active' | 'locked' | 'completed' | 'failed'
  details: {
    rows?: number
    placeholders?: number
    certificates?: number
    file_size?: string
  }
  user_id?: string
}
