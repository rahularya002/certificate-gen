import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History as HistoryIcon, Search, Filter, Download, Eye, FileText, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { historyService } from "@/lib/supabaseService";
import { HistoryRecord } from "@/lib/supabase";

interface LocalHistoryRecord {
  id: string;
  type: 'dataset' | 'template' | 'generation';
  name: string;
  description: string;
  createdAt: Date;
  status: 'active' | 'locked' | 'completed' | 'failed';
  details: {
    rows?: number;
    placeholders?: number;
    certificates?: number;
    fileSize?: string;
  };
}

export default function History() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [historyRecords, setHistoryRecords] = useState<LocalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load data from Supabase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const records = await historyService.getAll();
        const localRecords: LocalHistoryRecord[] = records.map(record => ({
          id: record.id,
          type: record.type,
          name: record.name,
          description: record.description || '',
          createdAt: new Date(record.created_at),
          status: record.status,
          details: record.details as any
        }));
        setHistoryRecords(localRecords);
      } catch (error) {
        toast({
          title: "Error loading history",
          description: "Failed to load history records",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const filteredRecords = historyRecords.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || record.type === filterType;
    const matchesStatus = filterStatus === "all" || record.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dataset':
        return <Database className="h-4 w-4" />;
      case 'template':
        return <FileText className="h-4 w-4" />;
      case 'generation':
        return <HistoryIcon className="h-4 w-4" />;
      default:
        return <HistoryIcon className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default" as const,
      locked: "secondary" as const,
      completed: "default" as const,
      failed: "destructive" as const
    };
    
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const handleView = (record: LocalHistoryRecord) => {
    toast({
      title: "Opening details",
      description: `Viewing details for ${record.name}`,
    });
  };

  const handleDownload = async (record: LocalHistoryRecord) => {
    try {
      toast({
        title: "Preparing download...",
        description: `Preparing ${record.name} for download`,
      });

      // For now, show a message that download is not available for this record type
      // In a real implementation, you would implement specific download logic based on record type
      toast({
        title: "Download not available",
        description: `Download functionality for ${record.type} records is not yet implemented`,
        variant: "destructive"
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download record",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading history records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-muted-foreground mt-2">
          View past datasets, templates, and generation jobs
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg z-50">
                <SelectItem value="all" className="hover:bg-accent">All Types</SelectItem>
                <SelectItem value="dataset" className="hover:bg-accent">Datasets</SelectItem>
                <SelectItem value="template" className="hover:bg-accent">Templates</SelectItem>
                <SelectItem value="generation" className="hover:bg-accent">Generations</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg z-50">
                <SelectItem value="all" className="hover:bg-accent">All Status</SelectItem>
                <SelectItem value="active" className="hover:bg-accent">Active</SelectItem>
                <SelectItem value="locked" className="hover:bg-accent">Locked</SelectItem>
                <SelectItem value="completed" className="hover:bg-accent">Completed</SelectItem>
                <SelectItem value="failed" className="hover:bg-accent">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>History Records</CardTitle>
              <CardDescription>
                Showing {filteredRecords.length} of {historyRecords.length} records
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(record.type)}
                        <span className="capitalize font-medium">{record.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate">{record.name}</div>
                    </TableCell>
                    <TableCell className="max-w-sm">
                      <div className="truncate text-muted-foreground">
                        {record.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {record.details.rows && (
                          <div className="text-muted-foreground">
                            {record.details.rows} rows
                          </div>
                        )}
                        {record.details.placeholders && (
                          <div className="text-muted-foreground">
                            {record.details.placeholders} placeholders
                          </div>
                        )}
                        {record.details.certificates !== undefined && (
                          <div className="text-muted-foreground">
                            {record.details.certificates} certificates
                          </div>
                        )}
                        {record.details.fileSize && (
                          <div className="text-xs text-muted-foreground">
                            {record.details.fileSize}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{(() => {
                          const d = record.createdAt;
                          const day = String(d.getDate()).padStart(2, '0');
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          const month = monthNames[d.getMonth()];
                          const year = d.getFullYear();
                          return `${day}/${month}/${year}`;
                        })()}</div>
                        <div className="text-muted-foreground">
                          {record.createdAt.toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(record.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(record)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {record.status !== 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(record)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-8">
              <HistoryIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No records found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {historyRecords.filter(r => r.type === 'dataset').length}
              </div>
              <div className="text-sm text-muted-foreground">Datasets</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {historyRecords.filter(r => r.type === 'template').length}
              </div>
              <div className="text-sm text-muted-foreground">Templates</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {historyRecords.filter(r => r.type === 'generation').length}
              </div>
              <div className="text-sm text-muted-foreground">Generation Jobs</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {historyRecords
                  .filter(r => r.type === 'generation' && r.status === 'completed')
                  .reduce((acc, r) => acc + (r.details.certificates || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Certificates</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}