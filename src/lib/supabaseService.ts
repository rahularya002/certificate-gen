import { supabase, Dataset, Template, GenerationJob, Certificate, HistoryRecord } from './supabase'

// Dataset operations
export const datasetService = {
  async getAll(): Promise<Dataset[]> {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Dataset | null> {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(dataset: Omit<Dataset, 'id' | 'created_at' | 'updated_at'>): Promise<Dataset> {
    const { data, error } = await supabase
      .from('datasets')
      .insert(dataset)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Dataset>): Promise<Dataset> {
    const { data, error } = await supabase
      .from('datasets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('datasets')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Template operations
export const templateService = {
  async getAll(): Promise<Template[]> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<Template | null> {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(template: Omit<Template, 'id' | 'created_at' | 'updated_at'>): Promise<Template> {
    const { data, error } = await supabase
      .from('templates')
      .insert(template)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<Template>): Promise<Template> {
    const { data, error } = await supabase
      .from('templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Generation job operations
export const generationJobService = {
  async getAll(): Promise<GenerationJob[]> {
    const { data, error } = await supabase
      .from('generation_jobs')
      .select(`
        *,
        datasets(name),
        templates(name)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<GenerationJob | null> {
    const { data, error } = await supabase
      .from('generation_jobs')
      .select(`
        *,
        datasets(name),
        templates(name)
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async create(job: Omit<GenerationJob, 'id' | 'created_at' | 'completed_at'>): Promise<GenerationJob> {
    const { data, error } = await supabase
      .from('generation_jobs')
      .insert(job)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<GenerationJob>): Promise<GenerationJob> {
    const { data, error } = await supabase
      .from('generation_jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('generation_jobs')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Certificate operations
export const certificateService = {
  async getByGenerationJob(jobId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('generation_job_id', jobId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(certificate: Omit<Certificate, 'id' | 'created_at'>): Promise<Certificate> {
    const { data, error } = await supabase
      .from('certificates')
      .insert(certificate)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async createBatch(certificates: Omit<Certificate, 'id' | 'created_at'>[]): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('certificates')
      .insert(certificates)
      .select()
    
    if (error) throw error
    return data || []
  },

  async update(id: string, updates: Partial<Certificate>): Promise<Certificate> {
    const { data, error } = await supabase
      .from('certificates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// History operations
export const historyService = {
  async getAll(): Promise<HistoryRecord[]> {
    const { data, error } = await supabase
      .from('history_records')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async create(record: Omit<HistoryRecord, 'id' | 'created_at'>): Promise<HistoryRecord> {
    const { data, error } = await supabase
      .from('history_records')
      .insert(record)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getByType(type: 'dataset' | 'template' | 'generation'): Promise<HistoryRecord[]> {
    const { data, error } = await supabase
      .from('history_records')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}
