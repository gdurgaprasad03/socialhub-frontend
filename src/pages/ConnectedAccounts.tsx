import { useAccountStore } from '@/stores/accountStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Twitter, Linkedin, Facebook, Instagram, CheckCircle2, Link2Off } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Platform } from '@/stores/postStore';

const PLATFORM_META: Record<Platform, { label: string; icon: React.ElementType; color: string; description: string }> = {
  twitter: { label: 'Twitter', icon: Twitter, color: 'bg-[hsl(203,89%,53%)]', description: 'Share tweets and threads' },
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'bg-[hsl(210,80%,42%)]', description: 'Professional updates and articles' },
  facebook: { label: 'Facebook', icon: Facebook, color: 'bg-[hsl(221,44%,41%)]', description: 'Page posts and stories' },
  instagram: { label: 'Instagram', icon: Instagram, color: 'bg-[hsl(340,75%,54%)]', description: 'Photos, reels, and stories' },
};

const ConnectedAccounts = () => {
  const { accounts, toggleConnection, isConnecting } = useAccountStore();

  const handleToggle = async (platform: Platform, connected: boolean) => {
    await toggleConnection(platform);
    toast.success(connected ? `${PLATFORM_META[platform].label} disconnected` : `${PLATFORM_META[platform].label} connected!`);
  };

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <h2 className="text-2xl font-bold mb-2">Connected Accounts</h2>
      <p className="text-muted-foreground mb-6">Connect your social media accounts to start publishing.</p>

      <div className="space-y-3">
        {accounts.map((account, index) => {
          const meta = PLATFORM_META[account.platform];
          const Icon = meta.icon;
          const connecting = isConnecting === account.platform;
          return (
            <div
              key={account.platform}
              className="bg-card rounded-lg border p-5 shadow-sm flex items-center gap-4 animate-slide-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', meta.color)}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{meta.label}</p>
                  {account.connected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {account.connected ? account.username : meta.description}
                </p>
              </div>
              <Button
                variant={account.connected ? 'outline' : 'default'}
                size="sm"
                disabled={connecting}
                onClick={() => handleToggle(account.platform, account.connected)}
              >
                {connecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : account.connected ? (
                  <>
                    <Link2Off className="w-4 h-4 mr-1" />
                    Disconnect
                  </>
                ) : (
                  'Connect'
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectedAccounts;
