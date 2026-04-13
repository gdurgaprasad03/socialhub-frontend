import { useEffect, useState } from 'react';
import { useAccountStore } from '@/stores/accountStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Twitter, Linkedin, Facebook, Instagram, CheckCircle2, Link2Off, Plus, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Platform } from '@/stores/postStore';
import AccountForm from '@/components/AccountForm';

const PLATFORM_META: Record<Platform, { label: string; icon: React.ElementType; color: string; description: string }> = {
  twitter: { label: 'Twitter', icon: Twitter, color: 'bg-[hsl(203,89%,53%)]', description: 'Share tweets and threads' },
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'bg-[hsl(210,80%,42%)]', description: 'Professional updates and articles' },
  facebook: { label: 'Facebook', icon: Facebook, color: 'bg-[hsl(221,44%,41%)]', description: 'Page posts and stories' },
  instagram: { label: 'Instagram', icon: Instagram, color: 'bg-[hsl(340,75%,54%)]', description: 'Photos, reels, and stories' },
};

const ConnectedAccounts = () => {
  const [view, setView] = useState<'list' | 'add'>('list');
  const { accounts, disconnectAccount, isConnecting, fetchAccounts, isLoading } = useAccountStore();

  useEffect(() => { fetchAccounts().catch(() => { }); }, [fetchAccounts]);

  const handleDisconnect = async (id: number, label: string) => {
    try {
      await disconnectAccount(id);
      toast.success(`${label} disconnected`);
    } catch (error: any) {
      toast.error(error.toString());
    }
  };

  if (view === 'add') {
    return (
      <div className="max-w-2xl mx-auto">
        <AccountForm
          onSuccess={() => setView('list')}
          onCancel={() => setView('list')}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Connected Accounts</h2>
          <p className="text-muted-foreground text-sm">Connect your social media accounts to start publishing.</p>
        </div>
        <Button onClick={() => setView('add')} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Add Account
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-card rounded-lg border p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-medium mb-1">No accounts connected yet</p>
          <p className="text-sm text-muted-foreground mb-6">Connect your first social media account to start posting!</p>
          <Button onClick={() => setView('add')} variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Connect one
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account, index) => {
            const meta = PLATFORM_META[account.platform];
            const Icon = meta.icon;
            const connecting = isConnecting === account.platform;
            return (
              <div
                key={`${account.platform}-${account.username}`}
                className="bg-card rounded-lg border p-5 shadow-sm flex items-center gap-4 animate-slide-up"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {account.avatar ? (
                  <img src={account.avatar} alt={account.username} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', meta.color)}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{meta.label}</p>
                    {account.connected !== false && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {account.username || account.platform_username || meta.description}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={connecting}
                  onClick={() => account.id && handleDisconnect(account.id, meta.label)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  {connecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Link2Off className="w-4 h-4 mr-1" />
                      Disconnect
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConnectedAccounts;
