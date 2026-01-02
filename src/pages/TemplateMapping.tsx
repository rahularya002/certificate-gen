import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, MapPin, CheckCircle } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { useToast } from "@/hooks/use-toast";
import { templateService, historyService } from "@/lib/supabaseService";
import { Template } from "@/lib/supabase";
import JSZip from "jszip";

interface Placeholder {
  name: string;
  mappedColumn: string | null;
}

export default function TemplateMapping() {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mappingComplete, setMappingComplete] = useState(false);
  const { toast } = useToast();

  // Mock dataset columns (would come from previous step)
  const datasetColumns = [
    'Name',
    'AadharNo',
    'DOB',
    'CertificateNo',
    'Grade',
    'RegistrationNo',
    'Level',
    'CandidateId',
    'IssueDate',
    'EnrollmentNo',
    'SonOrDaughterOf',
    'JobRole',
    'Duration',
    'TrainingCenter',
    'District',
    'State',
    'AssessmentPartner',
    'IssuePlace',
    // Allow selecting a column that holds QR payload
    'QRCode'
  ];

  // Standard placeholders we support regardless of template detection
  const standardPlaceholders = [
    'Name',
    'DOB',
    'CertificateNo',
    'RegistrationNo',
    'Level',
    'CandidateId',
    'IssueDate',
    'Grade',
    'AadharNo',
    'EnrollmentNo',
    'SonOrDaughterOf',
    'JobRole',
    'Duration',
    'TrainingCenter',
    'District',
    'State',
    'AssessmentPartner',
    'IssuePlace',
    // Allow mapping QR content from a dataset column
    'QRCode'
  ];

  const handleTemplateUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setTemplateFile(file);
    setIsProcessing(true);

    try {
      // Basic DOCX placeholder extraction: search document.xml for {{...}} tokens
      const zip = await JSZip.loadAsync(file);
      const documentXml = await zip.file("word/document.xml")?.async("string");
      const names = new Set<string>();
      if (documentXml) {
        const regex = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(documentXml)) !== null) {
          names.add(match[1]);
        }
      }
      // Union of detected placeholders and our standard set
      const detected = Array.from(names);
      const union = Array.from(new Set([...(detected || []), ...standardPlaceholders]));
      const detectedPlaceholders = union.map(n => ({ name: n, mappedColumn: null }));

      setPlaceholders(detectedPlaceholders);

      toast({
        title: "Template processed successfully",
        description: `Found ${detectedPlaceholders.length} placeholders in your template`,
      });
    } catch (error) {
      toast({
        title: "Error processing template",
        description: "Please check your file format and try again",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleColumnMapping = (placeholderName: string, columnName: string) => {
    setPlaceholders(prev => 
      prev.map(p => 
        p.name === placeholderName 
          ? { ...p, mappedColumn: columnName }
          : p
      )
    );
  };

  const handleAutoMap = () => {
    const autoMapped = placeholders.map(placeholder => ({
      ...placeholder,
      mappedColumn: datasetColumns.find(col => 
        col.toLowerCase() === placeholder.name.toLowerCase()
      ) || placeholder.mappedColumn
    }));
    
    setPlaceholders(autoMapped);
    
    toast({
      title: "Auto-mapping completed",
      description: "Columns have been automatically mapped where possible",
    });
  };

  const handleSaveMapping = async () => {
    // Allow QRCode to be auto-filled from generation pattern; don't block save on it
    const unmappedPlaceholders = placeholders.filter(p => !p.mappedColumn && p.name !== 'QRCode');
    
    if (unmappedPlaceholders.length > 0) {
      toast({
        title: "Incomplete mapping",
        description: `Please map all placeholders before saving (${unmappedPlaceholders.length} remaining)`,
        variant: "destructive"
      });
      return;
    }

    try {
      if (!templateFile) return;
      // Upload file to Supabase Storage if configured
      let fileUrl: string | undefined = undefined;
      try {
        // @ts-ignore supabase is available in service
        const { supabase } = await import('@/lib/supabase');
        const bucket = 'templates';
        const path = `${Date.now()}_${templateFile.name}`;
        console.log('[TemplateMapping] Uploading template', { bucket, path, name: templateFile.name, size: templateFile.size });
        const upload = await supabase.storage.from(bucket).upload(path, templateFile, { upsert: true });
        if (!upload.error) {
          const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
          fileUrl = pub.publicUrl;
          console.log('[TemplateMapping] Upload success, publicUrl:', fileUrl);
        } else {
          console.error('Template upload failed:', upload.error);
          toast({ title: 'Template upload failed', description: 'Please create a public Storage bucket named "templates" in Supabase and allow uploads.', variant: 'destructive' });
        }
      } catch (e) {
        console.error('Template upload exception:', e);
        toast({ title: 'Template upload failed', description: 'Storage is not configured. The app will fall back to the built-in layout.', variant: 'destructive' });
      }

      const templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'> = {
        name: templateFile.name.replace(/\.[^/.]+$/, ""),
        description: `Template uploaded from ${templateFile.name}`,
        file_name: templateFile.name,
        file_size: templateFile.size,
        file_url: fileUrl,
        placeholders: placeholders.map(p => p.name),
        // If QRCode is unmapped, mark it as AUTO so generation uses the pattern
        mappings: Object.fromEntries(placeholders.map(p => [p.name, (p.mappedColumn || (p.name === 'QRCode' ? 'AUTO' : '')) as string])),
        status: 'active'
      } as any;

      console.log('[TemplateMapping] Saving template record', templateData);
      const created = await templateService.create(templateData);
      console.log('[TemplateMapping] Template saved', created);
      await historyService.create({
        type: 'template',
        name: templateData.name,
        description: templateData.description || '',
        status: 'active',
        details: { placeholders: templateData.placeholders.length, file_size: `${Math.round(templateData.file_size / 1024)} KB` }
      } as any);

      setMappingComplete(true);
      toast({
        title: "Mapping saved successfully",
        description: "Template is ready for certificate generation",
      });
    } catch (e) {
      toast({
        title: "Failed to save template",
        description: "An error occurred while saving your mappings",
        variant: "destructive"
      });
    }
  };

  const mappedCount = placeholders.filter(p => p.mappedColumn).length;
  const totalCount = placeholders.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Template Mapping</h1>
        <p className="text-muted-foreground mt-2">
          Upload your certificate template and map placeholders to dataset columns
        </p>
      </div>

      {/* Template Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Certificate Template</span>
          </CardTitle>
          <CardDescription>
            Upload a Word document (.docx) with placeholders like {"{"}{"{"} Name {"}"}{"}"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            accept=".docx"
            onFilesSelected={handleTemplateUpload}
            title="Drop your template file here"
            description="Drag and drop your .docx template or click to browse"
            maxSize={25}
          />
        </CardContent>
      </Card>

      {/* Processing Indicator */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Analyzing template placeholders...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapping Section */}
      {placeholders.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Column Mapping</span>
                </CardTitle>
                <CardDescription>
                  Map template placeholders to your dataset columns
                </CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant={mappedCount === totalCount ? "default" : "secondary"}>
                  {mappedCount}/{totalCount} Mapped
                </Badge>
                <Button variant="outline" onClick={handleAutoMap}>
                  Auto Map
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {placeholders.map((placeholder, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {placeholder.mappedColumn ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted" />
                    )}
                    <div>
                      <div className="font-medium">{"{{" + placeholder.name + "}}"}</div>
                      <div className="text-sm text-muted-foreground">Template placeholder</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">→</span>
                    <Select
                      value={placeholder.mappedColumn || ""}
                      onValueChange={(value) => handleColumnMapping(placeholder.name, value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border shadow-lg z-50">
                        {datasetColumns.map(column => (
                          <SelectItem key={column} value={column} className="hover:bg-accent">
                            {column}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Section */}
      {mappedCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mapping Preview</CardTitle>
            <CardDescription>
              Review your column mappings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {placeholders
                .filter(p => p.mappedColumn)
                .map((placeholder, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                    <span className="font-mono text-sm">{"{{" + placeholder.name + "}}"}</span>
                    <span className="text-sm">→</span>
                    <Badge variant="outline">{placeholder.mappedColumn}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {placeholders.length > 0 && (
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => {
            setTemplateFile(null);
            setPlaceholders([]);
            setMappingComplete(false);
          }}>
            Reset
          </Button>
          <Button 
            onClick={handleSaveMapping}
            disabled={mappedCount !== totalCount}
            className="bg-gradient-to-r from-primary to-primary-hover"
          >
            {mappingComplete ? "Mapping Saved" : "Save Mapping"}
          </Button>
        </div>
      )}
    </div>
  );
}