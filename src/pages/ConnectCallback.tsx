import { useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAccountStore } from '@/stores/accountStore';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ConnectCallback = () => {
  const { platform } = useParams<{ platform: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeCallback, isLoading } = useAccountStore();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    if (!platform) return;
    
    called.current = true;
    const params = Object.fromEntries(searchParams.entries());
    
    // If the backend redirected us back with an explicit error in the URL
    if (params.status === 'error') {
      const errorMsg = params.message || 'Social connection failed';
      toast.error(errorMsg);
      setTimeout(() => navigate('/dashboard/accounts'), 3000);
      return;
    }
    
    // The store's completeCallback now internally deduplicates requests
    // so Mount 1 and Mount 2 will share the same backend call.
    completeCallback(platform, params)
      .then(() => {
        toast.success(`Successfully connected ${platform}!`);
        setTimeout(() => navigate('/dashboard/accounts'), 2000);
      })
      .catch((error) => {
        // If the error is 'cancelled' or similar from a previous unmount
        // the store handles the state, so we just show the message if it's a real error.
        if (error !== 'canceled') {
          toast.error(error.toString());
          setTimeout(() => navigate('/dashboard/accounts'), 3000);
        }
      });
  }, [platform, searchParams, completeCallback, navigate]);


  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-card border rounded-2xl p-10 shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-500">
        {isLoading ? (
          <>
            <div className="relative mb-6 mx-auto w-20 h-20">
              <Loader2 className="w-20 h-20 animate-spin text-primary opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-primary rounded-full animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Finalizing Connection</h2>
            <p className="text-muted-foreground">
              Please wait while we securely connect your {platform} account...
            </p>
          </>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Connected!</h2>
              <p className="text-muted-foreground">
                Your {platform} account has been successfully linked.
              </p>
            </div>
            <Button onClick={() => navigate('/dashboard/accounts')} className="w-full">
              Go to Connected Accounts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectCallback;
