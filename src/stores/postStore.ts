import { create } from 'zustand';
import axiosInstance from '@/lib/axiosInstance';

export type Platform = 'twitter' | 'linkedin' | 'facebook' | 'instagram';
export type PostStatus = 'scheduled' | 'published' | 'failed';

export interface PlatformResult {
  success: boolean;
  response?: { id: string };
  error?: string;
  processed_at?: string;
}

export interface Post {
  id: number;
  user: number;
  content: string;
  image: string;
  platforms: Platform[];
  status: PostStatus;
  scheduled_time: string | null;
  celery_task_id: string | null;
  platform_results: Record<string, PlatformResult>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PostState {
  posts: Post[];
  scheduledPosts: Post[];
  isCreating: boolean;
  isLoading: boolean;
  isLoadingScheduled: boolean;
  fetchPosts: () => Promise<void>;
  fetchScheduledPosts: () => Promise<void>;
  createPost: (post: { content: string; platforms: Platform[]; scheduledAt: string; media: string[] }) => Promise<void>;
  deletePost: (id: number) => Promise<void>;
  deleteScheduledPost: (id: number) => Promise<void>;
}

export const usePostStore = create<PostState>((set) => ({
  posts: [],
  scheduledPosts: [],
  isCreating: false,
  isLoading: false,
  isLoadingScheduled: false,
  fetchPosts: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get('/posts/');
      set({ posts: Array.isArray(data) ? data : data.results || [], isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      const errorMessage = error.response?.data?.error ||
                           error.response?.data?.detail ||
                           error.response?.data?.message ||
                           'Failed to fetch posts';
      throw errorMessage;
    }
  },
  fetchScheduledPosts: async () => {
    set({ isLoadingScheduled: true });
    try {
      const { data } = await axiosInstance.get('/schedule/');
      set({ scheduledPosts: Array.isArray(data) ? data : data.results || [], isLoadingScheduled: false });
    } catch (error: any) {
      set({ isLoadingScheduled: false });
      const errorMessage = error.response?.data?.error ||
                           error.response?.data?.detail ||
                           error.response?.data?.message ||
                           'Failed to fetch scheduled posts';
      throw errorMessage;
    }
  },
  createPost: async (post) => {
    set({ isCreating: true });
    try {
      const payload: any = {
        content: post.content,
        platforms: post.platforms,
        image: post.media && post.media.length > 0 ? post.media[0] : "",
      };

      if (post.scheduledAt) {
        payload.scheduled_time = post.scheduledAt;
      }

      const endpoint = post.scheduledAt ? '/schedule/' : '/posts/';
      const { data } = await axiosInstance.post(endpoint, payload);

      if (post.scheduledAt) {
        set((state) => ({ scheduledPosts: [data, ...state.scheduledPosts], isCreating: false }));
      } else {
        set((state) => ({ posts: [data, ...state.posts], isCreating: false }));
      }
    } catch (error: any) {
      set({ isCreating: false });
      const errorMessage = error.response?.data?.error ||
                           error.response?.data?.detail ||
                           error.response?.data?.message ||
                           (error.response?.data ? Object.values(error.response.data).flat().join(' ') : 'Failed to create post');
      throw errorMessage;
    }
  },
  deletePost: async (id) => {
    await axiosInstance.delete(`/posts/${id}/`);
    set((state) => ({ posts: state.posts.filter((p) => p.id !== id) }));
  },
  deleteScheduledPost: async (id) => {
    await axiosInstance.delete(`/schedule/${id}/`);
    set((state) => ({ scheduledPosts: state.scheduledPosts.filter((p) => p.id !== id) }));
  },
}));
