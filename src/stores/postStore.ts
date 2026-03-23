import { create } from 'zustand';
import api from '@/lib/api';

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
  isLoading: boolean;
  fetchPosts: () => Promise<void>;
  createPost: (post: Omit<ScheduledPost, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  updatePost: (id: string, data: Partial<ScheduledPost>) => Promise<void>;
  updatePostStatus: (id: string, status: PostStatus) => void;
}

export const usePostStore = create<PostState>((set) => ({
  posts: [],
  isCreating: false,
  isLoading: false,
  fetchPosts: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/posts/');
      set({ posts: Array.isArray(data) ? data : data.results || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
  createPost: async (post) => {
    set({ isCreating: true });
    try {
      const { data } = await api.post('/posts/', {
        content: post.content,
        platforms: post.platforms,
        scheduled_at: post.scheduledAt,
        media: post.media,
      });
      const newPost: ScheduledPost = {
        id: data.id?.toString(),
        content: data.content,
        platforms: data.platforms,
        scheduledAt: data.scheduled_at || data.scheduledAt,
        status: data.status || 'pending',
        media: data.media,
        createdAt: data.created_at || data.createdAt || new Date().toISOString(),
      };
      set((state) => ({ posts: [newPost, ...state.posts], isCreating: false }));
    } catch {
      set({ isCreating: false });
      throw new Error('Failed to create post');
    }
  },
  deletePost: async (id) => {
    await api.delete(`/posts/${id}/`);
    set((state) => ({ posts: state.posts.filter((p) => p.id !== id) }));
  },
  updatePost: async (id, data) => {
    const { data: updated } = await api.put(`/posts/${id}/`, data);
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }));
  },
  updatePostStatus: (id, status) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, status } : p)),
    })),
}));
