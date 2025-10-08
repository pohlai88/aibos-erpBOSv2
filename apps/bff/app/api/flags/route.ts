import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_FLAGS, type FeatureFlags } from '@aibos/config';

// In-memory storage for demo purposes
// In production, this would be stored in Redis, database, or external config service
let currentFlags: FeatureFlags = { ...DEFAULT_FLAGS };

/**
 * GET /api/flags
 * Get current feature flags
 */
export async function GET() {
  return NextResponse.json({
    flags: currentFlags,
    lastUpdated: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}

/**
 * PUT /api/flags
 * Update feature flags
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the flags
    const validStates = ['off', 'beta', 'on'];
    const validKeys = ['M01', 'M02', 'M03'];

    for (const [key, value] of Object.entries(body)) {
      if (!validKeys.includes(key)) {
        return NextResponse.json(
          { error: `Invalid feature key: ${key}` },
          { status: 400 }
        );
      }

      if (!validStates.includes(value as string)) {
        return NextResponse.json(
          { error: `Invalid state for ${key}: ${value}` },
          { status: 400 }
        );
      }
    }

    // Update flags
    currentFlags = { ...currentFlags, ...body };

    // In production, you would:
    // 1. Persist to database/Redis
    // 2. Notify other services
    // 3. Update environment variables
    // 4. Trigger deployments if needed

    console.log('Feature flags updated:', currentFlags);

    return NextResponse.json({
      success: true,
      flags: currentFlags,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

/**
 * POST /api/flags/reset
 * Reset flags to default values
 */
export async function POST(request: NextRequest) {
  const url = new URL(request.url);

  if (url.pathname.endsWith('/reset')) {
    currentFlags = { ...DEFAULT_FLAGS };

    return NextResponse.json({
      success: true,
      flags: currentFlags,
      message: 'Flags reset to default values'
    });
  }

  return NextResponse.json(
    { error: 'Not found' },
    { status: 404 }
  );
}

