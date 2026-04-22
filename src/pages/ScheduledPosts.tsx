import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePostStore, type Post, type PostStatus, type Platform } from '@/stores/postStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Trash2, Clock, CheckCircle2, XCircle, Twitter,
  Linkedin, Facebook, Instagram, Youtube, Calendar, Plus, Loader2, ListOrdered,
  Loader, FileText, Eye, CalendarClock, CalendarDays, List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PostForm, { type PostMode } from '@/components/PostForm';
import PostDetails from '@/components/PostDetails';

const STATUS_CONFIG: Record<PostStatus, { label: string; icon: React.ElementType; className: string }> = {
  scheduled: { label: 'Scheduled', icon: Clock, className: 'text-amber-700 bg-amber-50 border border-amber-200' },
  queued: { label: 'Queued', icon: ListOrdered, className: 'text-blue-700 bg-blue-50 border border-blue-200' },
  pending: { label: 'Pending', icon: Loader, className: 'text-amber-700 bg-amber-50 border border-amber-200' },
  processing: { label: 'Processing', icon: Loader, className: 'text-blue-700 bg-blue-50 border border-blue-200' },
  published: { label: 'Published', icon: CheckCircle2, className: 'text-emerald-700 bg-emerald-50 border border-emerald-200' },
  posted: { label: 'Posted', icon: CheckCircle2, className: 'text-emerald-700 bg-emerald-50 border border-emerald-200' },
  failed: { label: 'Failed', icon: XCircle, className: 'text-red-700 bg-red-50 border border-red-200' },
  draft: { label: 'Draft', icon: FileText, className: 'text-slate-700 bg-slate-50 border border-slate-200' },
  partial: { label: 'Partial', icon: CheckCircle2, className: 'text-amber-700 bg-amber-50 border border-amber-200' },
};

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
};

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// "09:00:00" → "9:00 AM"
const formatSlotTime = (time: string): string => {
  const [h = '0', m = '00'] = time.split(':');
  const hr = Number(h);
  const period = hr >= 12 ? 'PM' : 'AM';
  const display = hr % 12 === 0 ? 12 : hr % 12;
  return `${display}:${m} ${period}`;
};

const ScheduledPosts = () => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [createMode, setCreateMode] = useState<PostMode>('queue');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const {
    scheduledPosts,
    schedulingSlots,
    deleteScheduledPost,
    fetchScheduledPosts,
    isLoadingScheduled,
  } = usePostStore();

  useEffect(() => { fetchScheduledPosts().catch(() => {}); }, [fetchScheduledPosts]);

  // Sort slots by day then time for a stable, predictable order.
  const sortedSlots = [...schedulingSlots].sort(
    (a, b) => a.day_of_week - b.day_of_week || a.time.localeCompare(b.time)
  );

  const handleDelete = (id: number) => {
    deleteScheduledPost(id);
    toast.success('Scheduled post deleted');
  };

  const openCreate = (mode: PostMode) => {
    setCreateMode(mode);
    setView('create');
  };

  if (view === 'create') {
    return (
      <div className="max-w-4xl mx-auto">
        <PostForm
          mode={createMode}
          onSuccess={() => { fetchScheduledPosts().catch(() => {}); setView('list'); }}
          onCancel={() => setView('list')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-slide-up space-y-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 sm:p-5 shadow-sm">
        <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-gradient-to-br from-blue-400/15 to-blue-400/15 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              <CalendarClock className="w-3 h-3" />
              Scheduled
            </div>
            <h2 className="mt-1.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Scheduled Posts</h2>
            <p className="text-xs sm:text-sm text-slate-500">Content lined up to publish on your schedule.</p>
          </div>
          <div className="flex gap-2 flex-wrap items-center w-full sm:w-auto">
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-500/30"
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
              <Link
                to="/dashboard/calendar"
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Calendar
              </Link>
            </div>
            <Button
              variant="outline"
              onClick={() => openCreate('schedule')}
              className="rounded-full px-3 sm:px-4 h-10 border-slate-300 hover:border-blue-300 hover:text-blue-600 bg-white text-xs sm:text-sm"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Specific Time</span>
              <span className="sm:hidden">Time</span>
            </Button>
            <Button
              onClick={() => openCreate('queue')}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-95 text-white rounded-full px-4 sm:px-5 h-10 shadow-md shadow-blue-500/30 text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Add to Queue</span>
              <span className="xs:hidden">Queue</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Weekly posting slots */}
      {sortedSlots.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <div>
              <p className="text-[11px] font-semibold tracking-widest text-blue-600 uppercase">
                Weekly slots
              </p>
              <p className="text-xs sm:text-sm text-slate-500">
                Queued posts auto-fill the next open slot.
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-500 tabular-nums">
              {sortedSlots.length} {sortedSlots.length === 1 ? 'slot' : 'slots'} / week
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sortedSlots.map((slot) => {
              const dayLabel = slot.day_of_week_display || DAY_LABELS[slot.day_of_week] || `Day ${slot.day_of_week}`;
              return (
                <span
                  key={slot.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100 text-[11px] font-medium text-blue-700"
                >
                  <CalendarClock className="w-3 h-3" />
                  {dayLabel}
                  <span className="text-blue-300">·</span>
                  <span className="tabular-nums">{formatSlotTime(slot.time)}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {isLoadingScheduled ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : scheduledPosts.length === 0 ? (
        <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/70 p-8 text-center shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white to-sky-50/50" />
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/30">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <p className="font-semibold text-slate-900 mb-1">No scheduled posts</p>
            <p className="text-sm text-slate-500 mb-4">Schedule a post to publish it later.</p>
            <Button
              onClick={() => openCreate('queue')}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-95 text-white rounded-full px-4 h-9"
            >
              <Plus className="w-4 h-4" />
              Add to Queue
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {scheduledPosts.map((post, index) => {
            const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.scheduled;
            const StatusIcon = statusCfg.icon;
            const hasLoader = post.status === 'processing' || post.status === 'pending';
            const when = post.scheduled_time || post.created_at;
            const PREVIEW_LEN = 120;
            const needsMore = post.content && post.content.length > PREVIEW_LEN;
            const preview = needsMore ? post.content.slice(0, PREVIEW_LEN).trimEnd() : post.content;
            return (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="group bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm animate-slide-up cursor-pointer hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5 transition-all"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 mb-2 break-words leading-relaxed">
                      {preview || <span className="italic text-slate-400">(no caption)</span>}
                      {needsMore && (
                        <>
                          …{' '}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}
                            className="text-blue-600 hover:text-blue-700 hover:underline text-xs font-medium"
                          >
                            see more
                          </button>
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', statusCfg.className)}>
                        <StatusIcon className={cn('w-3 h-3', hasLoader && 'animate-spin')} />
                        {statusCfg.label}
                      </span>
                      {(post.target_account_details ?? []).slice(0, 3).map((acc) => {
                        const Icon = PLATFORM_ICONS[acc.platform];
                        const handle = acc.platform_username || acc.display_name || '';
                        return (
                          <span
                            key={acc.id}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full"
                          >
                            <Icon className="w-3 h-3 text-slate-500" />
                            <span className="truncate max-w-[9rem]">@{handle}</span>
                          </span>
                        );
                      })}
                      {(post.target_account_details?.length ?? 0) === 0 && (
                        <div className="flex items-center gap-1">
                          {post.platforms.map((p) => {
                            const Icon = PLATFORM_ICONS[p];
                            return <Icon key={p} className="w-3.5 h-3.5 text-slate-400" />;
                          })}
                        </div>
                      )}
                      {when && (
                        <span className="text-xs text-slate-500 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {new Date(when).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}
                      className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 rounded-lg"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                      className="text-slate-400 hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PostDetails
        post={selectedPost}
        open={selectedPost !== null}
        onOpenChange={(open) => { if (!open) setSelectedPost(null); }}
      />
    </div>
  );
};

export default ScheduledPosts;
