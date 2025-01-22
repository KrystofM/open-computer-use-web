import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Forward the request to the Python server
    const response = await fetch('http://localhost:8000/stop', {
      method: 'POST',
    });

    // Optionally check response status or return a more detailed message
    if (!response.ok) {
      throw new Error('Failed to stop the run on the Python server');
    }

    return NextResponse.json({ success: true, detail: 'Run stopped' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to stop the run' },
      { status: 500 },
    );
  }
}