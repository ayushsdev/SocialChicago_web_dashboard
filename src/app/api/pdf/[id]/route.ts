import { storage } from '@/lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Properly await the params
    const { id } = params;
    
    // Create reference to the PDF in Firebase Storage
    const pdfRef = ref(storage, `happyHourMenu/${id}.pdf`);
    
    // Get the download URL
    const url = await getDownloadURL(pdfRef);
    
    // Fetch the PDF content
    const response = await fetch(url);
    const pdfArrayBuffer = await response.arrayBuffer();

    return new NextResponse(pdfArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        // Add cache control if needed
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return new NextResponse('PDF not found', { status: 404 });
  }
}