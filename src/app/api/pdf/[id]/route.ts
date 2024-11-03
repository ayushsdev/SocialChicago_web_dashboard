import { storage } from '@/lib/firebase';
import { ref, getDownloadURL } from 'firebase/storage';
import { NextRequest } from 'next/server';


export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    
    // Create reference to the PDF in Firebase Storage
    const pdfRef = ref(storage, `happyHourMenu/${id}.pdf`);
    
    // Get the download URL
    const url = await getDownloadURL(pdfRef);
    
    // Fetch the PDF content
    const response = await fetch(url);
    const pdfArrayBuffer = await response.arrayBuffer();
    
    return new Response(pdfArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return new Response('PDF not found', { status: 404 });
  }
}