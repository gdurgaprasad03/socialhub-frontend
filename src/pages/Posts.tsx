import { useState, useEffect } from 'react';
import { usePostStore, type PostStatus, type Platform } from '@/stores/postStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Loader2, Trash2, Clock, CheckCircle2, XCircle,
  Calendar, MessageSquare, Plus, Twitter, Linkedin, Facebook, Instagram
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PostForm from '@/components/PostForm';

const STATUS_CONFIG: Record<PostStatus, { label: string; icon: React.ElementType; className: string }> = {
  scheduled: { label: 'Scheduled', icon: Clock, className: 'text-amber-600 bg-amber-50' },
  published: { label: 'Published', icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-50' },
  failed: { label: 'Failed', icon: XCircle, className: 'text-red-600 bg-red-50' },
};

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
};

const Posts = () => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const { posts, fetchPosts, deletePost, isLoading } = usePostStore();

  useEffect(() => {
    fetchPosts().catch(() => {});
  }, [fetchPosts]);

  const handleDelete = (id: number) => {
    deletePost(id);
    toast.success('Post deleted');
  };

  const publishedPosts = posts.filter(p => p.status === 'published' || p.status === 'failed');

  if (view === 'create') {
    return (
      <div className="max-w-4xl mx-auto">
        <PostForm
          mode="post"
          onSuccess={() => { fetchPosts().catch(() => {}); setView('list'); }}
          onCancel={() => setView('list')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Posts</h2>
        <Button onClick={() => setView('create')} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Post
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : publishedPosts.length === 0 ? (
        <div className="bg-card rounded-lg border p-12 text-center animate-fade-in">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
          <p className="text-muted-foreground mb-6">Create your first post to get started!</p>
          <Button onClick={() => setView('create')} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Create one
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {publishedPosts.map((post, index) => {
            const statusCfg = STATUS_CONFIG[post.status];
            const StatusIcon = statusCfg.icon;
            return (
              <div
                key={post.id}
                className="bg-card rounded-lg border p-4 shadow-sm animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  {post.image && (
                    <img src={post.image} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm mb-3 whitespace-pre-wrap break-words">{post.content}</p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className={cn('inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full', statusCfg.className)}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {post.platforms.map((p) => {
                          const Icon = PLATFORM_ICONS[p];
                          const result = post.platform_results?.[p];
                          return (
                            <span key={p} className="inline-flex items-center gap-1">
                              <Icon className={cn('w-3.5 h-3.5', result?.success ? 'text-emerald-500' : result?.error ? 'text-red-500' : 'text-muted-foreground')} />
                            </span>
                          );
                        })}
                      </div>
                      {post.published_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.published_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {/* Show platform errors if failed */}
                    {post.status === 'failed' && Object.entries(post.platform_results || {}).map(([platform, result]) => (
                      result.error && (
                        <p key={platform} className="text-xs text-red-500 mt-2">
                          {platform}: {result.error}
                        </p>
                      )
                    ))}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)} className="shrink-0 text-muted-foreground hover:text-destructive h-8 w-8">
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

export default Posts;
