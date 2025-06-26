import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tx_ref = searchParams.get('tx_ref');
  const status = searchParams.get('status');
  // TODO: Verify transaction with PayChangu API using your secret key
  console.log('PayChangu callback:', { tx_ref, status });
  return NextResponse.json({ message: 'Callback received', tx_ref, status });
} 