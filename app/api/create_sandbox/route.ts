import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = await fetch('http://localhost:8000/create_sandbox', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error('Failed to create the sandbox on the Python server');
    }

    const data = await response.json();

    return NextResponse.json({ success: true, sandbox_id: data.sandbox_id, playback_id: data.playback_id });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create the sandbox' },
      { status: 500 },
    );
  }
}
