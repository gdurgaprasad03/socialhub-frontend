import { create } from 'zustand';

export type Platform = 'twitter' | 'linkedin' | 'facebook' | 'instagram';
export type PostStatus = 'pending' | 'posted' | 'failed';

export interface ScheduledPost {
  id: string;
  content: string;
  platforms: Platform[];
  scheduledAt: string;
  status: PostStatus;
  media?: string[];
  createdAt: string;
}

interface PostState {
  posts: ScheduledPost[];
  isCreating: boolean;
  createPost: (post: Omit<ScheduledPost, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  deletePost: (id: string) => void;
  updatePostStatus: (id: string, status: PostStatus) => void;
}

const mockPosts: ScheduledPost[] = [
  {
    id: '1',
    content: 'Excited to announce our new product launch! Stay tuned for more details. 🚀',
    platforms: ['twitter', 'linkedin'],
    scheduledAt: '2026-03-21T10:00:00Z',
    status: 'pending',
    createdAt: '2026-03-19T08:00:00Z',
  },
  {
    id: '2',
    content: 'Behind the scenes of our latest photoshoot. The team worked incredibly hard to bring this vision to life.',
    platforms: ['instagram', 'facebook'],
    scheduledAt: '2026-03-20T14:30:00Z',
    status: 'posted',
    media: ['/placeholder.svg'],
    createdAt: '2026-03-18T12:00:00Z',
  },
  {
    id: '3',
    content: 'Join us for a live Q&A session this Friday at 3 PM EST. Drop your questions below!',
    platforms: ['twitter', 'facebook', 'linkedin'],
    scheduledAt: '2026-03-19T20:00:00Z',
    status: 'failed',
    createdAt: '2026-03-17T09:00:00Z',
  },
];

export const usePostStore = create<PostState>((set) => ({
  posts: mockPosts,
  isCreating: false,
  createPost: async (post) => {
    set({ isCreating: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const newPost: ScheduledPost = {
      ...post,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ posts: [newPost, ...state.posts], isCreating: false }));
  },
  deletePost: (id) =>
    set((state) => ({ posts: state.posts.filter((p) => p.id !== id) })),
  updatePostStatus: (id, status) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, status } : p)),
    })),
}));
