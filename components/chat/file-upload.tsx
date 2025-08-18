'use client';

import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  conversationId: string; // We need to know which conversation to associate the doc with
  onUploadSuccess: () => void;
}

export function FileUpload({ conversationId, onUploadSuccess }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('No file selected', {
        description: 'Please select a PDF or TXT file to upload.',
      });
      return;
    }
    if (!conversationId) {
      toast.error('No active conversation', {
        description: 'Please start a new conversation before uploading a document.',
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);

    try {
      await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Upload successful', {
        description: `${file.name} has been uploaded and processed.`,
      });
      onUploadSuccess();
    } catch (error) {
      toast.error('Upload failed', {
        description: 'There was an error uploading your file. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
        <h3 className="text-sm font-medium mb-2">Upload a Document</h3>
        <p className="text-xs text-muted-foreground mb-4">Upload a .pdf or .txt file to chat with it.</p>
      <div className="flex items-center space-x-2">
        <Input type="file" onChange={handleFileChange} accept=".pdf,.txt" className="flex-grow" />
        <Button onClick={handleSubmit} disabled={isUploading || !file}>
          <UploadCloud className="w-4 h-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
    </div>
  );
}
