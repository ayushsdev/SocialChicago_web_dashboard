'use client';

import { useEffect, useState } from 'react';

interface PDFViewerProps {
  file: File;
}

export function PDFViewer({ file }: PDFViewerProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    // Create a URL for the PDF file
    const fileUrl = URL.createObjectURL(file);
    setUrl(fileUrl);

    // Cleanup the URL when component unmounts
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [file]);

  return (
    <div className="card bg-base-200 p-6 shadow-xl">
      <h2 className="text-xl font-bold mb-4">PDF Preview</h2>
      <div className="flex flex-col items-center">
        {url && (
          <iframe
            src={url}
            className="w-full h-[600px]" // Adjust height as needed
            title="PDF viewer"
          />
        )}
      </div>
    </div>
  );
}
