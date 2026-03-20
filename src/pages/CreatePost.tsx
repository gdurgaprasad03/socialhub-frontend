import { useState, useMemo } from 'react';
import { usePostStore, type Platform } from '@/stores/postStore';
import { useAccountStore } from '@/stores/accountStore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Image, Twitter, Linkedin, Facebook, Instagram, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLATFORM_LIMITS: Record<Platform, { maxChars: number; mediaRequired: boolean; label: string }> = {
  twitter: { maxChars: 280, mediaRequired: false, label: 'Twitter' },
  linkedin: { maxChars: 3000, mediaRequired: false, label: 'LinkedIn' },
  facebook: { maxChars: 63206, mediaRequired: false, label: 'Facebook' },
  instagram: { maxChars: 2200, mediaRequired: true, label: 'Instagram' },
};

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
};

const PLATFORM_COLORS: Record<Platform, string> = {
  twitter: 'bg-[hsl(203,89%,53%)]',
  linkedin: 'bg-[hsl(210,80%,42%)]',
  facebook: 'bg-[hsl(221,44%,41%)]',
  instagram: 'bg-[hsl(340,75%,54%)]',
};

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const { createPost, isCreating } = usePostStore();
  const { accounts } = useAccountStore();

  const connectedPlatforms = accounts.filter((a) => a.connected).map((a) => a.platform);

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    selectedPlatforms.forEach((p) => {
      const limits = PLATFORM_LIMITS[p];
      if (content.length > limits.maxChars) {
        errors[p] = `Exceeds ${limits.maxChars} characters`;
      }
      if (limits.mediaRequired && mediaFiles.length === 0) {
        errors[p] = 'Media is required';
      }
    });
    return errors;
  }, [content, selectedPlatforms, mediaFiles]);

  const canSubmit = content.trim() && selectedPlatforms.length > 0 && Object.keys(validationErrors).length === 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      await createPost({
        content,
        platforms: selectedPlatforms,
        scheduledAt: scheduledAt || new Date().toISOString(),
        media: mediaFiles.map((f) => URL.createObjectURL(f)),
      });
      toast.success('Post scheduled successfully!');
      setContent('');
      setSelectedPlatforms([]);
      setMediaFiles([]);
      setScheduledAt('');
    } catch {
      toast.error('Failed to create post');
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      <h2 className="text-2xl font-bold mb-6">Create Post</h2>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Editor */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-card rounded-lg border p-4 shadow-sm">
            <Label className="mb-2 block">Content</Label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={6}
              disabled={isCreating}
              className="w-full bg-transparent resize-none outline-none text-sm placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between pt-3 border-t mt-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <Image className="w-4 h-4" />
                Add media
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(e) => setMediaFiles(Array.from(e.target.files || []))}
                />
              </label>
              <span className="text-xs text-muted-foreground">{content.length} chars</span>
            </div>
            {mediaFiles.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {mediaFiles.map((f, i) => (
                  <span key={i} className="text-xs bg-muted px-2 py-1 rounded-md">{f.name}</span>
                ))}
              </div>
            )}
          </div>

          {/* Platforms */}
          <div className="bg-card rounded-lg border p-4 shadow-sm">
            <Label className="mb-3 block">Platforms</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PLATFORM_LIMITS) as Platform[]).map((platform) => {
                const Icon = PLATFORM_ICONS[platform];
                const isConnected = connectedPlatforms.includes(platform);
                const isSelected = selectedPlatforms.includes(platform);
                const error = validationErrors[platform];
                return (
                  <button
                    key={platform}
                    disabled={!isConnected || isCreating}
                    onClick={() => togglePlatform(platform)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border text-sm transition-all text-left',
                      isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-muted-foreground/30',
                      !isConnected && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-md flex items-center justify-center', PLATFORM_COLORS[platform])}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{PLATFORM_LIMITS[platform].label}</p>
                      <p className="text-xs text-muted-foreground">
                        {isConnected ? (error ? <span className="text-destructive">{error}</span> : 'Connected') : 'Not connected'}
                      </p>
                    </div>
                    {isSelected && !error && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    {error && isSelected && <AlertCircle className="w-4 h-4 text-destructive" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-card rounded-lg border p-4 shadow-sm">
            <Label htmlFor="schedule" className="mb-2 block">Schedule (optional)</Label>
            <Input
              id="schedule"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <Button onClick={handleSubmit} disabled={!canSubmit || isCreating} className="w-full">
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Schedule Post'}
          </Button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Platform Previews</h3>
          {selectedPlatforms.length === 0 ? (
            <div className="bg-card rounded-lg border p-8 text-center">
              <p className="text-sm text-muted-foreground">Select platforms to see previews</p>
            </div>
          ) : (
            selectedPlatforms.map((platform) => {
              const limits = PLATFORM_LIMITS[platform];
              const Icon = PLATFORM_ICONS[platform];
              const charCount = content.length;
              const overLimit = charCount > limits.maxChars;
              return (
                <div key={platform} className="bg-card rounded-lg border p-4 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn('w-6 h-6 rounded flex items-center justify-center', PLATFORM_COLORS[platform])}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium">{limits.label}</span>
                    <span className={cn('ml-auto text-xs tabular-nums', overLimit ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                      {charCount}/{limits.maxChars}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words" style={{ overflowWrap: 'break-word' }}>
                    {content || <span className="text-muted-foreground italic">Your content will appear here…</span>}
                  </p>
                  {mediaFiles.length > 0 && (
                    <div className="mt-3 bg-muted rounded-md h-32 flex items-center justify-center text-xs text-muted-foreground">
                      {mediaFiles.length} media file(s) attached
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
