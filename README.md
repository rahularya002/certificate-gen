# Certificate Generator with Supabase Integration

A modern certificate generator application built with React, TypeScript, and Supabase. This application allows you to upload Excel datasets, create certificate templates, and generate certificates with QR codes.

## Features

- 📊 **Excel Data Upload**: Upload participant data from Excel files
- 📝 **Template Management**: Create and manage certificate templates with placeholder mapping
- 🎯 **Certificate Generation**: Generate certificates in PDF or DOCX format
- 🔗 **QR Code Integration**: Add QR codes to certificates with customizable data patterns
- 📈 **Real-time Progress**: Track generation progress with live updates
- 📚 **History Tracking**: View all datasets, templates, and generation jobs
- 💾 **Supabase Integration**: Persistent data storage and management
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **QR Codes**: react-qr-code
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router DOM

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd excel-to-pdf
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `env.example` to `.env` and fill in your Supabase credentials:

```bash
cp env.example .env
```

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL script to create all necessary tables and sample data

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Database Schema

### Migrations

Add SQL migrations under `supabase/migrations/`. Example migration adds new certificate fields:

```
ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS aadhar VARCHAR(50),
  ADD COLUMN IF NOT EXISTS dob VARCHAR(20),
  ADD COLUMN IF NOT EXISTS son_or_daughter_of VARCHAR(255),
  ADD COLUMN IF NOT EXISTS job_role VARCHAR(255),
  ADD COLUMN IF NOT EXISTS duration VARCHAR(100),
  ADD COLUMN IF NOT EXISTS training_center VARCHAR(255),
  ADD COLUMN IF NOT EXISTS district VARCHAR(255),
  ADD COLUMN IF NOT EXISTS state VARCHAR(255),
  ADD COLUMN IF NOT EXISTS assessment_partner VARCHAR(255),
  ADD COLUMN IF NOT EXISTS issue_place VARCHAR(255);
```

The application uses the following main tables:

- **datasets**: Stores uploaded Excel data and participant information
- **templates**: Stores certificate templates with placeholder mappings
- **generation_jobs**: Tracks certificate generation jobs and progress
- **certificates**: Stores individual generated certificates with QR code data
- **history_records**: Maintains audit trail of all operations

## Usage

### 1. Upload Excel Dataset
- Navigate to the Upload page
- Upload an Excel file with participant data
- Required columns: Name, AadharNo, DOB, CertificateNo
- Review and confirm the data

### 2. Create Template Mapping
- Go to Template Mapping page
- Upload a Word document template
- Map placeholders to dataset columns
- Save the mapping configuration

### 3. Generate Certificates
- Visit the Generate page
- Select your dataset and template
- Configure output format and filename pattern
- Enable QR codes and set data pattern
- Start the generation process

### 4. View Results
- Check the Results page for generated certificates
- Download individual certificates or entire batches
- View QR codes for each certificate

### 5. Track History
- Use the History page to view all past operations
- Filter by type (dataset, template, generation)
- Search through historical records

## QR Code Configuration

QR codes can be customized using placeholders:
- `{CertificateNo}`: Certificate number
- `{Name}`: Participant name
- `{IssueDate}`: Issue date
- `{Course}`: Course name
- `{Institute}`: Institute name

Example QR data pattern: `{CertificateNo}_{Name}_{IssueDate}`

## Development

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── FileUpload.tsx  # File upload component
│   └── QRCodeGenerator.tsx # QR code component
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and services
│   ├── supabase.ts     # Supabase client and types
│   └── supabaseService.ts # Database service functions
├── pages/              # Page components
│   ├── UploadExcel.tsx # Excel upload page
│   ├── TemplateMapping.tsx # Template mapping page
│   ├── Generate.tsx    # Certificate generation page
│   ├── Results.tsx     # Results viewing page
│   └── History.tsx     # History tracking page
└── App.tsx             # Main application component
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.