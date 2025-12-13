import { NextRequest, NextResponse } from 'next/server';
import { exportLeaderboardCSV } from '@/app/leaderboard/actions';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const courseId = searchParams.get('courseId') || undefined;

  const result = await exportLeaderboardCSV(courseId);

  if (!result.success || !result.csv) {
    return NextResponse.json(
      { error: result.error || 'Failed to export CSV' },
      { status: result.error === 'Unauthorized' ? 403 : 500 }
    );
  }

  // Return CSV file
  return new NextResponse(result.csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="leaderboard-${courseId || 'global'}-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
