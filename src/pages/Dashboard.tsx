import { useEffect, useState } from 'react';
import { usePostStore } from '@/stores/postStore';
import { useAccountStore } from '@/stores/accountStore';
import axiosInstance from '@/lib/axiosInstance';
import { BarChart3, Calendar, CheckCircle2, TrendingUp, Users } from 'lucide-react';

const Dashboard = () => {
  const { posts, fetchPosts } = usePostStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const [backendStats, setBackendStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    fetchPosts().catch(() => {});
    fetchAccounts().catch(() => {});
    axiosInstance.get('/dashboard/').then(({ data }) => setBackendStats(data)).catch(() => {});
  }, [fetchPosts, fetchAccounts]);

  const totalPosts = backendStats?.total_posts ?? posts.length;
  const postedCount = backendStats?.published ?? posts.filter((p) => p.status === 'published').length;
  const pendingCount = backendStats?.pending ?? posts.filter((p) => p.status === 'scheduled').length;
  const connectedCount = backendStats?.connected_accounts ?? accounts.filter((a) => a.connected).length;

  const stats = [
    { label: 'Total Posts', value: totalPosts, icon: Calendar, color: 'text-primary' },
    { label: 'Published', value: postedCount, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Pending', value: pendingCount, icon: TrendingUp, color: 'text-amber-500' },
    { label: 'Connected Accounts', value: connectedCount, icon: Users, color: 'text-blue-500' },
  ];

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card rounded-lg border p-5 shadow-sm animate-slide-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-3xl font-bold tabular-nums">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card rounded-lg border p-8 text-center">
        <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium mb-1">Detailed metrics coming soon</p>
        <p className="text-sm text-muted-foreground">
          Engagement metrics, reach, and audience insights will appear here.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
