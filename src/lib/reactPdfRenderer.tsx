import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles for landscape certificate
const styles = StyleSheet.create({
  page: {
    flexDirection: 'row', // Landscape orientation
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  container: {
    flex: 1,
    border: '2px solid #000',
    padding: 20,
    position: 'relative',
  },
  innerBorder: {
    border: '1px solid #000',
    padding: 15,
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  participantName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  completionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  leftColumn: {
    flex: 1,
    marginRight: 10,
  },
  rightColumn: {
    flex: 1,
    marginLeft: 10,
  },
  detailText: {
    fontSize: 12,
    marginBottom: 8,
    color: '#333',
  },
  dateContainer: {
    textAlign: 'center',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#000',
  },
  certificateNumber: {
    fontSize: 10,
    textAlign: 'center',
    color: '#999',
    marginBottom: 20,
  },
  qrContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 60,
    height: 60,
  },
  qrLabel: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
});

interface CertificateData {
  Name: string;
  DOB: string | number;
  CertificateNo: string;
  IssueDate: string;
  Grade: string;
  AadharNo: string;
  EnrollmentNo: string;
  SonOrDaughterOf: string;
  JobRole: string;
  Duration: string;
  TrainingCenter: string;
  District: string;
  State: string;
  AssessmentPartner: string;
  IssuePlace: string;
  QRCode?: string;
}

interface ReactPdfCertificateProps {
  data: CertificateData;
}

export const ReactPdfCertificate: React.FC<ReactPdfCertificateProps> = ({ data }) => {
  // Format DOB if it's a number (Excel serial date)
  const formatDOB = (dob: string | number) => {
    if (typeof dob === 'number') {
      // Excel serial date to readable date
      const date = new Date((dob - 25569) * 86400 * 1000);
      const d = String(date.getDate()).padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const m = monthNames[date.getMonth()];
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    }
    // If it's a string date, try to parse and format it
    if (typeof dob === 'string') {
      const date = new Date(dob);
      if (!isNaN(date.getTime())) {
        const d = String(date.getDate()).padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const m = monthNames[date.getMonth()];
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
      }
    }
    return dob;
  };

  // Create details array for two-column layout
  const details = [
    data.SonOrDaughterOf && `S/D of: ${data.SonOrDaughterOf}`,
    data.AadharNo && `Aadhar: ${data.AadharNo}`,
    data.DOB && `DOB: ${formatDOB(data.DOB)}`,
    data.JobRole && `Job Role: ${data.JobRole}`,
    data.Duration && `Duration: ${data.Duration}`,
    data.TrainingCenter && `Training Center: ${data.TrainingCenter}`,
    data.District && `District: ${data.District}`,
    data.State && `State: ${data.State}`,
    data.AssessmentPartner && `Assessment Partner: ${data.AssessmentPartner}`,
    data.EnrollmentNo && `Enrollment No: ${data.EnrollmentNo}`,
    data.IssuePlace && `Issue Place: ${data.IssuePlace}`,
  ].filter(Boolean);

  // Split details into two columns
  const leftDetails = details.filter((_, index) => index % 2 === 0);
  const rightDetails = details.filter((_, index) => index % 2 === 1);

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        <View style={styles.container}>
          <View style={styles.innerBorder}>
            {/* Title */}
            <Text style={styles.title}>CERTIFICATE OF COMPLETION</Text>
            
            {/* Subtitle */}
            <Text style={styles.subtitle}>This is to certify that</Text>
            
            {/* Participant Name */}
            <Text style={styles.participantName}>{data.Name}</Text>
            
            {/* Completion Text */}
            <Text style={styles.completionText}>has successfully completed the training</Text>
            
            {/* Details in two columns */}
            <View style={styles.detailsContainer}>
              <View style={styles.leftColumn}>
                {leftDetails.map((detail, index) => (
                  <Text key={index} style={styles.detailText}>{detail}</Text>
                ))}
              </View>
              <View style={styles.rightColumn}>
                {rightDetails.map((detail, index) => (
                  <Text key={index} style={styles.detailText}>{detail}</Text>
                ))}
              </View>
            </View>
            
            {/* Date */}
            <View style={styles.dateContainer}>
              <Text style={styles.dateText}>Date: {data.IssueDate}</Text>
            </View>
            
            {/* Certificate Number */}
            <Text style={styles.certificateNumber}>Certificate No: {data.CertificateNo}</Text>
            
            {/* QR Code */}
            {data.QRCode && (
              <View style={styles.qrContainer}>
                <Image src={data.QRCode} style={{ width: 60, height: 60 }} />
                <Text style={styles.qrLabel}>Verification QR Code</Text>
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ReactPdfCertificate;
