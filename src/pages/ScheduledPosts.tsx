import { usePostStore, type PostStatus } from '@/stores/postStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Trash2, Clock, CheckCircle2, XCircle, Twitter, Linkedin, Facebook, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Platform } from '@/stores/postStore';

const STATUS_CONFIG: Record<PostStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: 'Pending', icon: Clock, className: 'text-amber-600 bg-amber-50' },
  posted: { label: 'Posted', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-50' },
  failed: { label: 'Failed', icon: XCircle, className: 'text-red-600 bg-red-50' },
};

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
};

const ScheduledPosts = () => {
  const { posts, deletePost } = usePostStore();

  const handleDelete = (id: string) => {
    deletePost(id);
    toast.success('Post deleted');
  };

  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      <h2 className="text-2xl font-bold mb-6">Scheduled Posts</h2>

      {posts.length === 0 ? (
        <div className="bg-card rounded-lg border p-12 text-center">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1">No posts yet</p>
          <p className="text-sm text-muted-foreground">Create your first post to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, index) => {
            const statusCfg = STATUS_CONFIG[post.status];
            const StatusIcon = statusCfg.icon;
            return (
              <div
                key={post.id}
                className="bg-card rounded-lg border p-4 shadow-sm animate-slide-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm mb-2 whitespace-pre-wrap break-words" style={{ overflowWrap: 'break-word' }}>{post.content}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', statusCfg.className)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                      <div className="flex items-center gap-1">
                        {post.platforms.map((p) => {
                          const Icon = PLATFORM_ICONS[p];
                          return <Icon key={p} className="w-3.5 h-3.5 text-muted-foreground" />;
                        })}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(post.scheduledAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Need Calendar import for empty state
import { Calendar } from 'lucide-react';

export default ScheduledPosts;
