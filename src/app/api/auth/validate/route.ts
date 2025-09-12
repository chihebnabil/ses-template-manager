import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { accessKeyId, secretAccessKey, region } = await request.json();

    // Validate against environment variables
    const expectedAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const expectedSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const expectedRegion = process.env.AWS_REGION || 'us-east-1';

    if (!expectedAccessKeyId || !expectedSecretAccessKey) {
      return NextResponse.json(
        { message: 'Server configuration error: AWS credentials not configured' },
        { status: 500 }
      );
    }

    // Check if provided credentials match environment variables
    if (
      accessKeyId === expectedAccessKeyId &&
      secretAccessKey === expectedSecretAccessKey &&
      region === expectedRegion
    ) {
      return NextResponse.json(
        { message: 'Authentication successful' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth validation error:', error);
    return NextResponse.json(
      { message: 'Authentication failed' },
      { status: 500 }
    );
  }
}