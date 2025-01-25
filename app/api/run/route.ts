import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch('http://localhost:8000/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ instruction: body.instruction, sandbox_id: body.sandbox_id }),
    });

    const { readable, writable } = new TransformStream();
    
    response.body?.pipeTo(writable);
    
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