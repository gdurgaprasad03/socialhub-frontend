import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Share2, Sparkles, CheckCircle2 } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await register(name, email, password);
      toast.success('Account created! Please log in.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.toString());
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-blue-500/30 to-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] bg-gradient-to-br from-blue-400/20 to-blue-300/10 rounded-full blur-3xl" />
        <div className="max-w-md animate-fade-in relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/40">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-sidebar-primary-foreground">SocialHub</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-white/90 bg-white/10 backdrop-blur px-2.5 py-1 rounded-full border border-white/20 mb-4">
            <Sparkles className="w-3 h-3" />
            Free forever to start
          </div>
          <h1 className="text-3xl font-bold text-sidebar-primary-foreground mb-3" style={{ lineHeight: '1.2' }}>
            Start shipping to every network in minutes
          </h1>
          <p className="text-sidebar-foreground text-base mb-6">
            One account, every platform. Create, schedule, and grow — all from one place.
          </p>
          <ul className="space-y-3 text-sm text-sidebar-foreground">
            {[
              'Post to Instagram, Facebook, LinkedIn, and Twitter',
              'Queue and schedule content in advance',
              'Track performance across every network',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-white">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
              <Share2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">SocialHub</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Create account</h2>
          <p className="text-slate-500 mb-6">Start managing your social media today</p>

          {error && (
            <div className="mb-4 p-3 bg-destructive/15 text-destructive text-sm rounded-xl animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Jane Cooper" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
            </div>
            <Button
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-500 hover:opacity-95 text-white rounded-full shadow-md shadow-blue-500/30"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
