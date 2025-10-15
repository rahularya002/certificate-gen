-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create datasets table
CREATE TABLE datasets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  total_rows INTEGER NOT NULL,
  columns TEXT[] NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'locked')),
  user_id UUID
);

-- Create templates table
CREATE TABLE templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT,
  placeholders TEXT[] NOT NULL,
  mappings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  user_id UUID
);

-- Create generation_jobs table
CREATE TABLE generation_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  output_format VARCHAR(10) NOT NULL CHECK (output_format IN ('pdf', 'docx')),
  filename_pattern VARCHAR(255) NOT NULL,
  total_certificates INTEGER NOT NULL,
  successful_certificates INTEGER DEFAULT 0,
  failed_certificates INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_row INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID
);

-- Create certificates table
CREATE TABLE certificates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  generation_job_id UUID NOT NULL REFERENCES generation_jobs(id) ON DELETE CASCADE,
  participant_name VARCHAR(255) NOT NULL,
  certificate_no VARCHAR(100) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  aadhar VARCHAR(50),
  dob VARCHAR(20),
  son_or_daughter_of VARCHAR(255),
  job_role VARCHAR(255),
  duration VARCHAR(100),
  training_center VARCHAR(255),
  district VARCHAR(255),
  state VARCHAR(255),
  assessment_partner VARCHAR(255),
  enrollment_no VARCHAR(100),
  issue_place VARCHAR(255),
  qr_code_data TEXT,
  qr_code_url TEXT,
  status VARCHAR(20) DEFAULT 'ready' CHECK (status IN ('ready', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID
);

-- Create history_records table
CREATE TABLE history_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('dataset', 'template', 'generation')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'locked', 'completed', 'failed')),
  details JSONB NOT NULL DEFAULT '{}',
  user_id UUID
);

-- Create indexes for better performance
CREATE INDEX idx_datasets_user_id ON datasets(user_id);
CREATE INDEX idx_datasets_created_at ON datasets(created_at);
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_created_at ON templates(created_at);
CREATE INDEX idx_generation_jobs_user_id ON generation_jobs(user_id);
CREATE INDEX idx_generation_jobs_dataset_id ON generation_jobs(dataset_id);
CREATE INDEX idx_generation_jobs_template_id ON generation_jobs(template_id);
CREATE INDEX idx_certificates_generation_job_id ON certificates(generation_job_id);
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_history_records_user_id ON history_records(user_id);
CREATE INDEX idx_history_records_type ON history_records(type);
CREATE INDEX idx_history_records_created_at ON history_records(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON datasets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO datasets (name, description, file_name, file_size, total_rows, columns, data, status) VALUES
('Training Batch 2024', 'Excel dataset with participant information', 'training_batch_2024.xlsx', 45000, 25, 
 ARRAY['Name','AadharNo','DOB','CertificateNo','Grade','IssueDate','SonOrDaughterOf','JobRole','Duration','TrainingCenter','District','State','AssessmentPartner','IssuePlace'],
 '[{"Name": "John Doe", "AadharNo": "1234-5678-9012", "DOB": "1990-01-15", "CertificateNo": "CERT001", "Grade": "A+", "IssueDate": "2024-01-15", "SonOrDaughterOf": "Richard Roe", "JobRole": "Technician", "Duration": "3 Months", "TrainingCenter": "ABC Center", "District": "Some District", "State": "Some State", "AssessmentPartner": "XYZ Assessments", "IssuePlace": "New Delhi"}, {"Name": "Jane Smith", "AadharNo": "2345-6789-0123", "DOB": "1985-03-22", "CertificateNo": "CERT002", "Grade": "A", "IssueDate": "2024-01-15", "SonOrDaughterOf": "Laura Smith", "JobRole": "Assistant", "Duration": "2 Months", "TrainingCenter": "DEF Center", "District": "Another District", "State": "Another State", "AssessmentPartner": "ABC Assessments", "IssuePlace": "Mumbai"}]'::jsonb,
 'active');

INSERT INTO templates (name, description, file_name, file_size, placeholders, mappings, status) VALUES
('Standard Certificate Template', 'Word template with required fields', 'standard_certificate.docx', 2100000,
 ARRAY['Name','DOB','CertificateNo','IssueDate','Grade','AadharNo','SonOrDaughterOf','JobRole','Duration','TrainingCenter','District','State','AssessmentPartner','IssuePlace'],
 '{"Name": "Name", "DOB": "DOB", "CertificateNo": "CertificateNo", "IssueDate": "IssueDate", "Grade": "Grade", "AadharNo": "AadharNo", "SonOrDaughterOf": "SonOrDaughterOf", "JobRole": "JobRole", "Duration": "Duration", "TrainingCenter": "TrainingCenter", "District": "District", "State": "State", "AssessmentPartner": "AssessmentPartner", "IssuePlace": "IssuePlace"}'::jsonb,
 'active');

-- Insert sample history records
INSERT INTO history_records (type, name, description, status, details) VALUES
('dataset', 'Web Development Batch 2024', 'Excel dataset with participant information', 'active', '{"rows": 25, "file_size": "45 KB"}'::jsonb),
('template', 'Standard Certificate Template', 'Word template with company branding', 'active', '{"placeholders": 7, "file_size": "2.1 MB"}'::jsonb);
