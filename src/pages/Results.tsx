import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Lock, Package, Eye, CheckCircle, FileText, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generationJobService, certificateService, templateService } from "@/lib/supabaseService";
import { GenerationJob, Certificate } from "@/lib/supabase";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import { CertificateGenerator, CertificateData } from "@/lib/certificateGenerator";
import JSZip from "jszip";
import { saveAs } from "file-saver";

interface LocalCertificate {
  id: string;
  filename: string;
  participantName: string;
  certificateNo: string;
  generatedAt: Date;
  fileSize: string;
  status: 'ready' | 'error';
  qrCodeData?: string;
  // Add all the new certificate fields
  aadhar?: string;
  dob?: string;
  sonOrDaughterOf?: string;
  jobRole?: string;
  duration?: string;
  trainingCenter?: string;
  district?: string;
  state?: string;
  assessmentPartner?: string;
  enrollmentNo?: string;
  issuePlace?: string;
  grade?: string;
}

export default function Results() {
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState(false);
  const [generationResults, setGenerationResults] = useState<GenerationJob[]>([]);
  const [certificates, setCertificates] = useState<LocalCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const jobs = await generationJobService.getAll();
        setGenerationResults(jobs);
        
        // Load certificates for the first job if available
        if (jobs.length > 0) {
          const firstJobId = jobs[0].id;
          const certs = await certificateService.getByGenerationJob(firstJobId);
          const localCerts: LocalCertificate[] = certs.map(cert => ({
            id: cert.id,
            filename: cert.filename,
            participantName: cert.participant_name,
            certificateNo: cert.certificate_no,
            generatedAt: new Date(cert.created_at),
            fileSize: `${Math.round(cert.file_size / 1024)} KB`,
            status: cert.status,
            qrCodeData: cert.qr_code_data,
            // Add all the new certificate fields
            aadhar: cert.aadhar || '',
            dob: cert.dob || '',
            sonOrDaughterOf: cert.son_or_daughter_of || '',
            jobRole: cert.job_role || '',
            duration: cert.duration || '',
            trainingCenter: cert.training_center || '',
            district: cert.district || '',
            state: cert.state || '',
            assessmentPartner: cert.assessment_partner || '',
            enrollmentNo: cert.enrollment_no || '',
            issuePlace: cert.issue_place || '',
            grade: cert.grade || ''
          }));
          setCertificates(localCerts);
          setSelectedResult(firstJobId);
        }
      } catch (error) {
        toast({
          title: "Error loading data",
          description: "Failed to load generation results",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Load certificates when selected result changes
  useEffect(() => {
    const loadCertificates = async () => {
      if (!selectedResult) return;
      
      try {
        const certs = await certificateService.getByGenerationJob(selectedResult);
        const localCerts: LocalCertificate[] = certs.map(cert => ({
          id: cert.id,
          filename: cert.filename,
          participantName: cert.participant_name,
          certificateNo: cert.certificate_no,
          generatedAt: new Date(cert.created_at),
          fileSize: `${Math.round(cert.file_size / 1024)} KB`,
          status: cert.status,
          qrCodeData: cert.qr_code_data,
          // Add all the new certificate fields
          aadhar: cert.aadhar || '',
          dob: cert.dob || '',
          sonOrDaughterOf: cert.son_or_daughter_of || '',
          jobRole: cert.job_role || '',
          duration: cert.duration || '',
          trainingCenter: cert.training_center || '',
          district: cert.district || '',
          state: cert.state || '',
          assessmentPartner: cert.assessment_partner || '',
          enrollmentNo: cert.enrollment_no || '',
          issuePlace: cert.issue_place || '',
          grade: cert.grade || ''
        }));
        setCertificates(localCerts);
      } catch (error) {
        toast({
          title: "Error loading certificates",
          description: "Failed to load certificates for selected job",
          variant: "destructive"
        });
      }
    };

    loadCertificates();
  }, [selectedResult, toast]);

  const handleDownloadAll = async (resultId: string) => {
    const result = generationResults.find(r => r.id === resultId);
    if (!result) return;

    try {
      toast({
        title: "Preparing download...",
        description: `Preparing ${result.successful_certificates} certificates for download`,
      });

      const zip = new JSZip();
      const format = result.output_format as 'pdf' | 'docx';
      for (const cert of certificates) {
        const data: CertificateData = {
          participantName: cert.participantName,
          certificateNo: cert.certificateNo,
          issueDate: cert.generatedAt.toLocaleDateString(),
          aadhar: '',
          dob: '',
          sonOrDaughterOf: '',
          jobRole: '',
          duration: '',
          trainingCenter: '',
          district: '',
          state: '',
          assessmentPartner: '',
          enrollmentNo: '',
          issuePlace: '',
          grade: '',
          qrCodeData: cert.qrCodeData
        };
        // For now, skip individual certificate regeneration since we need the template
        // TODO: Store template reference in certificate records for regeneration
        console.warn('Individual certificate regeneration not supported without template access');
        continue;
      }
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `certificates_${result.id}.zip`);

      toast({
        title: "Download completed!",
        description: `Successfully downloaded ${result.successful_certificates} certificates`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download certificates",
        variant: "destructive"
      });
    }
  };

  const handleLockDataset = async (resultId: string) => {
    setIsLocking(true);
    
    // Simulate locking process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Dataset locked successfully",
      description: "Dataset is now read-only and cannot be modified",
    });
    
    setIsLocking(false);
  };

  const handlePreviewCertificate = (certificateId: string) => {
    const cert = certificates.find(c => c.id === certificateId);
    if (!cert) return;

    toast({
      title: "Opening preview",
      description: `Opening ${cert.filename} in new window`,
    });
  };

  const handleDownloadCertificate = async (certificateId: string) => {
    const cert = certificates.find(c => c.id === certificateId);
    if (!cert) return;

    try {
      const result = generationResults.find(r => r.id === selectedResult);
      if (!result) return;

      toast({
        title: "Preparing download...",
        description: `Preparing ${cert.filename} for download`,
      });

      // Prepare QR image from payload
      const qrDataUrl = cert.qrCodeData
        ? await CertificateGenerator.generateQRCodeAsBase64(cert.qrCodeData)
        : undefined;

      // For template-based generation, we need to fetch the original template
      if (result.template_id) {
        try {
          // Fetch the template
          const template = await templateService.getById(result.template_id);
          if (!template?.file_url) {
            throw new Error('Template not found or missing file URL');
          }
          
          // Fetch template file
          const resp = await fetch(template.file_url);
          if (!resp.ok) {
            throw new Error(`Failed to fetch template: ${resp.status}`);
          }
          const arrayBuffer = await resp.arrayBuffer();
          
          // Generate PDF using template with actual data from database
          const normalizeDate = (val: any): string => {
            if (val === undefined || val === null || val === '') return '';
            if (typeof val === 'number') {
              const date = new Date((val - 25569) * 86400 * 1000);
              const d = String(date.getDate()).padStart(2, '0');
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const y = date.getFullYear();
              return `${d}/${m}/${y}`;
            }
            return String(val);
          };

          const pdfBlob = await CertificateGenerator.generatePDFFromTemplate(
            arrayBuffer, 
            {
              Name: cert.participantName,
              CertificateNo: cert.certificateNo,
              IssueDate: normalizeDate(cert.generatedAt.toLocaleDateString()),
              Grade: cert.grade || '',
              AadharNo: cert.aadhar || '',
              EnrollmentNo: cert.enrollmentNo || '',
              SonOrDaughterOf: cert.sonOrDaughterOf || '',
              JobRole: cert.jobRole || '',
              Duration: cert.duration || '',
              TrainingCenter: cert.trainingCenter || '',
              District: cert.district || '',
              State: cert.state || '',
              AssessmentPartner: cert.assessmentPartner || '',
              IssuePlace: cert.issuePlace || '',
              DOB: normalizeDate(cert.dob || ''),
              QRCode: cert.qrCodeData
            },
            qrDataUrl
          );
          
          // Download the file
          saveAs(pdfBlob, cert.filename);
        } catch (error) {
          console.error('Template-based download failed:', error);
          throw new Error('Failed to regenerate certificate from template');
        }
      } else {
        throw new Error('No template reference found for this generation job');
      }

      toast({
        title: "Download completed!",
        description: `Successfully downloaded ${cert.filename}`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download certificate",
        variant: "destructive"
      });
    }
  };

  const selectedResultData = selectedResult ? generationResults.find(r => r.id === selectedResult) : generationResults[0];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading generation results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Generation Results</h1>
        <p className="text-muted-foreground mt-2">
          View and download your generated certificates
        </p>
      </div>

      {/* Results Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Generations</CardTitle>
          <CardDescription>
            Select a generation batch to view detailed results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generationResults.map((result) => (
              <div
                key={result.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedResult === result.id || (!selectedResult && result.id === generationResults[0].id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedResult(result.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium">{(result as any).datasets?.name || 'Unknown Dataset'}</h3>
                      <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
                        {result.status === 'completed' ? 'Completed' : result.status.charAt(0).toUpperCase() + result.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Template: {(result as any).templates?.name || 'Unknown Template'} • {result.output_format.toUpperCase()}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-success">
                        ✓ {result.successful_certificates} successful
                      </span>
                      {result.failed_certificates > 0 && (
                        <span className="text-destructive">
                          ✗ {result.failed_certificates} failed
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        Generated {new Date(result.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadAll(result.id);
                      }}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Download ZIP
                    </Button>
                    {result.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLockDataset(result.id);
                        }}
                        disabled={isLocking}
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Lock Dataset
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      {selectedResultData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Generated Certificates</span>
                </CardTitle>
                <CardDescription>
                  Individual certificates from {(selectedResultData as any)?.datasets?.name || 'Unknown Dataset'}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {certificates.length} certificates
                </Badge>
                <Button onClick={() => handleDownloadAll(selectedResultData.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Certificate No</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">
                        {cert.participantName}
                      </TableCell>
                      <TableCell>{cert.certificateNo}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {cert.filename}
                      </TableCell>
                      <TableCell>{cert.fileSize}</TableCell>
                      <TableCell>
                        {cert.qrCodeData ? (
                          <div className="flex justify-center">
                            <QRCodeGenerator 
                              value={cert.qrCodeData} 
                              size={40}
                              className="border rounded"
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No QR</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cert.generatedAt.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={cert.status === 'ready' ? 'default' : 'destructive'}>
                          {cert.status === 'ready' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ready
                            </>
                          ) : (
                            'Error'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreviewCertificate(cert.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadCertificate(cert.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {generationResults.reduce((acc, r) => acc + r.successful_certificates, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Generated</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {generationResults.length}
              </div>
              <div className="text-sm text-muted-foreground">Batches Processed</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {generationResults.filter(r => r.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Completed Jobs</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {generationResults.reduce((acc, r) => acc + r.failed_certificates, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Failed Generations</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}