import { useState } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, AlertTriangle, FileSpreadsheet } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { useToast } from "@/hooks/use-toast";
import { datasetService, historyService } from "@/lib/supabaseService";
import { Dataset } from "@/lib/supabase";

interface ValidationResult {
  isValid: boolean;
  missingColumns: string[];
  totalRows: number;
  validRows: number;
}

const REQUIRED_COLUMNS = ['Name', 'AadharNo', 'DOB', 'CertificateNo'];

export default function UploadExcel() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setUploadedFile(file);
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      setPreviewData(rows);
      
      // Validation
      const columns = Object.keys(rows[0] || {});
      const missingColumns = REQUIRED_COLUMNS.filter(col => !columns.includes(col));
      
      setValidation({
        isValid: missingColumns.length === 0,
        missingColumns,
        totalRows: rows.length,
        validRows: rows.length
      });

      toast({
        title: "File processed successfully",
        description: `Found ${rows.length} rows with ${columns.length} columns`,
      });
    } catch (error) {
      toast({
        title: "Error processing file",
        description: "Please check your file format and try again",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!validation?.isValid || !uploadedFile) return;

    try {
      setIsProcessing(true);
      
      // Create dataset in Supabase
      const datasetData: Omit<Dataset, 'id' | 'created_at' | 'updated_at'> = {
        name: uploadedFile.name.replace(/\.[^/.]+$/, ""), // Remove file extension
        description: `Dataset uploaded from ${uploadedFile.name}`,
        file_name: uploadedFile.name,
        file_size: uploadedFile.size,
        total_rows: validation.totalRows,
        columns: Object.keys(previewData[0] || {}),
        data: previewData,
        status: 'active'
      };

      const created = await datasetService.create(datasetData);

      // Record history
      await historyService.create({
        type: 'dataset',
        name: datasetData.name,
        description: datasetData.description || '',
        status: 'active',
        details: { rows: datasetData.total_rows, file_size: `${Math.round(datasetData.file_size / 1024)} KB` }
      } as any);

      toast({
        title: "Dataset saved successfully",
        description: "You can now proceed to template mapping",
      });
    } catch (error) {
      toast({
        title: "Error saving dataset",
        description: "Failed to save dataset to database",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Upload Excel Dataset</h1>
        <p className="text-muted-foreground mt-2">
          Upload your Excel file containing student/participant data for certificate generation
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Excel File Upload</span>
          </CardTitle>
          <CardDescription>
            Upload an Excel file (.xlsx) with participant data. Required columns: {REQUIRED_COLUMNS.join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUpload
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onFilesSelected={handleFileUpload}
            title="Drop your Excel file here"
            description="Drag and drop your .xlsx (Excel) file or click to browse"
            maxSize={50}
          />
        </CardContent>
      </Card>

      {/* Processing Indicator */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Processing file...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Results */}
      {validation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {validation.isValid ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-warning" />
              )}
              <span>Validation Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{validation.totalRows}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{validation.validRows}</div>
                <div className="text-sm text-muted-foreground">Valid Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {previewData[0] ? Object.keys(previewData[0]).length : 0}
                </div>
                <div className="text-sm text-muted-foreground">Columns Found</div>
              </div>
              <div className="text-center">
                <Badge variant={validation.isValid ? "default" : "destructive"}>
                  {validation.isValid ? "Valid" : "Invalid"}
                </Badge>
              </div>
            </div>

            {validation.missingColumns.length > 0 && (
              <div className="bg-warning/10 p-4 rounded-lg">
                <h4 className="font-medium text-warning mb-2">Missing Required Columns:</h4>
                <div className="flex flex-wrap gap-2">
                  {validation.missingColumns.map(col => (
                    <Badge key={col} variant="outline" className="border-warning text-warning">
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Preview (First 5 rows)</CardTitle>
            <CardDescription>
              Review your data before proceeding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(previewData[0] || {}).map(column => (
                      <TableHead key={column} className="whitespace-nowrap">
                        {column}
                        {REQUIRED_COLUMNS.includes(column) && (
                          <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(0, 5).map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value: any, cellIndex) => (
                        <TableCell key={cellIndex} className="whitespace-nowrap">
                          {value}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {validation && (
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => {
            setUploadedFile(null);
            setPreviewData([]);
            setValidation(null);
          }}>
            Reset
          </Button>
          <Button 
            onClick={handleConfirmUpload}
            disabled={!validation.isValid}
            className="bg-gradient-to-r from-primary to-primary-hover"
          >
            Confirm & Save Dataset
          </Button>
        </div>
      )}
    </div>
  );
}