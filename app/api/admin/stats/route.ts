import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/stats
 * Returns platform-wide statistics for admin dashboard
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Run all stats queries in parallel
    const [
      usersResult,
      jobsResult,
      revenueResult,
      recentJobsResult,
    ] = await Promise.all([
      // User counts by role
      admin.from('users').select('role'),

      // Job counts by status
      admin.from('jobs').select('status, total_amount, created_at'),

      // Revenue this month
      admin.from('jobs')
        .select('total_amount, platform_fee, created_at')
        .eq('status', 'delivered')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

      // Recent 10 jobs with details
      admin.from('jobs')
        .select(`
          id, job_number, status, total_amount, total_weight_kg,
          created_at,
          job_stops(address, stop_type),
          client:client_profiles(user:users(full_name))
        `)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const users = usersResult.data || [];
    const jobs = jobsResult.data || [];

    // Calculate stats
    const totalClients = users.filter(u => u.role === 'client').length;
    const totalDrivers = users.filter(u => u.role === 'driver').length;

    const pendingJobs    = jobs.filter(j => j.status === 'pending').length;
    const activeJobs     = jobs.filter(j => ['accepted', 'in_transit'].includes(j.status)).length;
    const completedJobs  = jobs.filter(j => j.status === 'delivered').length;
    const cancelledJobs  = jobs.filter(j => j.status === 'cancelled').length;
    const totalJobs      = jobs.length;

    const monthRevenue   = (revenueResult.data || []).reduce((sum, j) => sum + (j.platform_fee || 0), 0);
    const allTimeRevenue = jobs
      .filter(j => j.status === 'delivered')
      .reduce((sum, j) => sum + (j.total_amount || 0), 0);

    return NextResponse.json({
      users: { total: users.length, clients: totalClients, drivers: totalDrivers },
      jobs:  { total: totalJobs, pending: pendingJobs, active: activeJobs, completed: completedJobs, cancelled: cancelledJobs },
      revenue: { this_month: monthRevenue, all_time: allTimeRevenue },
      recent_jobs: recentJobsResult.data || [],
    });

  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}