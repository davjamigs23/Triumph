import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DocumentService } from '../../services/DocumentService';
import { DocumentSubmission } from '../../types';
import { 
  Upload, 
  FileCheck, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  FileText
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';
import FeedbackModal from '../ui/FeedbackModal';

export default function MyDocuments() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocumentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<any>(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      const userDocs = await DocumentService.getStudentDocuments(user.uid);
      setDocs(userDocs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleUpload = async (type: DocumentSubmission['type'], e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // File Type Validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setFeedback({ title: 'Invalid Format', message: 'Unsupported file format. Please upload PDF, JPG, or PNG files only.', type: 'error', onClose: () => setFeedback(null) });
      return;
    }

    // File Size Validation (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ title: 'File Too Large', message: 'File size exceeds the 5MB limit. Please compress or resize it before uploading.', type: 'error', onClose: () => setFeedback(null) });
      return;
    }

    setUploading(type);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      const fileUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      await DocumentService.submitDocument(user.uid, type, file.name, fileUrl);
      await fetchData();
      setFeedback({ title: 'Success', message: 'Document successfully submitted — Your requirement has been uploaded and is now pending staff review.', type: 'info', onClose: () => setFeedback(null) });
    } catch (err) {
      console.error(err);
      setFeedback({ title: 'Error', message: 'Upload failed. Something went wrong while uploading your file. Check your connection and try again.', type: 'error', onClose: () => setFeedback(null) });
    } finally {
      setUploading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'REJECTED': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const docTypes: DocumentSubmission['type'][] = ['CLEARANCE', 'RECEIPT', 'BIRTH_CERTIFICATE'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-[#0d1b2a]">Documents</h1>
        <p className="text-sm text-gray-500 font-medium">Upload and track your requirements for verification.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {docTypes.map((type) => {
          const doc = docs.find(d => d.type === type);
          const isUploading = uploading === type;

          return (
            <div key={type} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col h-full group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-[#1a237e]/5 transition-colors">
                  <FileText className="h-6 w-6 text-[#1a237e]" />
                </div>
                {doc && getStatusIcon(doc.status)}
              </div>

              <h3 className="text-[13px] font-black uppercase tracking-wider text-[#0d1b2a] mb-1">
                {type?.replace?.('_', ' ') || type}
              </h3>
              <p className="text-[11px] text-gray-500 font-medium mb-6 leading-relaxed">
                {type === 'CLEARANCE' ? 'University clearance form signed by all departments.' : 
                 type === 'RECEIPT' ? 'Official receipt or slip for yearbook fees.' : 
                 'Original birth certificate for identity verification.'}
              </p>

              <div className="mt-auto space-y-4">
                {doc ? (
                  <div className={cn(
                    "p-3 rounded-lg text-[10px] font-bold uppercase tracking-widest text-center border",
                    doc.status === 'APPROVED' ? "bg-green-50 border-green-100 text-green-700" :
                    doc.status === 'REJECTED' ? "bg-red-50 border-red-100 text-red-700" : "bg-yellow-50 border-yellow-100 text-yellow-700"
                  )}>
                    {doc.status}{doc.rejectionReason && `: ${doc.rejectionReason}`}
                  </div>
                ) : null}

                <div className="relative">
                  <input 
                    type="file" 
                    id={`file-upload-${type}`}
                    className="hidden"
                    onChange={(e) => handleUpload(type, e)}
                    disabled={isUploading || (doc?.status === 'APPROVED' || doc?.status === 'PENDING')}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <label
                    htmlFor={`file-upload-${type}`}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer",
                      doc?.status === 'APPROVED' || doc?.status === 'PENDING' || isUploading ? "bg-gray-100 text-gray-400 cursor-not-allowed" :
                      "bg-[#1a237e] text-white hover:shadow-lg active:scale-95 shadow-md shadow-[#1a237e]/20"
                    )}
                  >
                    {isUploading ? 'Uploading...' : doc ? 'Re-upload' : 'Upload Document'}
                    {!isUploading && !doc && <Upload className="h-4 w-4" />}
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#fbbd08]/10 border border-[#fbbd08]/20 rounded-2xl p-6 flex gap-4 items-start">
        <AlertCircle className="h-6 w-6 text-[#fbbd08] shrink-0" />
        <div>
          <h4 className="text-[12px] font-black uppercase tracking-widest text-[#0d1b2a] mb-1">Important Note</h4>
          <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
            Please ensure all documents are clear and legible. File size should not exceed 5MB. 
            Verification typically takes 1-3 business days. Rejected documents will include comments on what to fix.
          </p>
        </div>
      </div>
      {feedback && <FeedbackModal {...feedback} />}
    </div>
  );
}
