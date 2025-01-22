import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch('http://localhost:8000/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ instruction: body.instruction }),
    });

    // Create a TransformStream to forward the response
    const { readable, writable } = new TransformStream();
    
    // Pipe the response to our transform stream
    response.body?.pipeTo(writable);
    
    // Return a streaming response
    return new Response(readable, {
      headers: {
        'Content-Type': 'application/x-ndjson',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process instruction' },
      { status: 500 }
    );
  }
} 