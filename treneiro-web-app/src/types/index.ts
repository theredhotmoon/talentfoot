// ── Domain Interfaces ──────────────────────────────────────────────────
// Single source of truth for all shared types used across views,
// components, composables, and stores.

/** Translatable field – can be a JSON object keyed by locale or a plain string. */
export type TranslatableField = Record<string, string> | string;

// ── Auth / Users ───────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  auth_provider?: string | null;
  show_tips?: boolean;
  auto_play_delay?: number;
  subscription_valid_until?: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

// ── Tags ───────────────────────────────────────────────────────────────

export interface Tag {
  id: string;
  name: TranslatableField;
  slug: TranslatableField;
}

// ── Categories ─────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: TranslatableField;
  slug: TranslatableField;
  clips_count?: number;
  clips_sum_views?: number;
  total_subclips_count?: number;
  popular_clips?: Clip[];
}

// ── Clips & Subclips ───────────────────────────────────────────────────

export interface Subclip {
  id: string;
  clip_id: string;
  name: TranslatableField;
  file_path: string;
  difficulty: number;
  views: number;
  average_rating: number;
  ratings_count: number;
  sort_order: number;
  thumbnails: string[] | null;
  captions?: Record<string, string>;
  is_preview?: boolean;
}

export interface Clip {
  id: string;
  name: TranslatableField;
  slug: TranslatableField;
  description: TranslatableField;
  file_path: string;
  tags?: Tag[] | null;
  difficulty: number;
  views: number;
  average_rating: number;
  ratings_count: number;
  comments_count?: number;
  subclips_count?: number;
  challenges_count?: number;
  completed_challenges_count?: number;
  category?: Category;
  category_id?: string;
  thumbnails?: string[];
  activeThumbnail?: string;
  captions?: Record<string, string>;
  subclips: Subclip[];
  current_user_rating?: { rating: number } | null;
  cartoon_status?: string | null;
}

// ── Comments ───────────────────────────────────────────────────────────

export interface Comment {
  id: number;
  user_id: number;
  clip_id: number;
  content: string;
  created_at: string;
  user: Pick<User, 'id' | 'name'>;
}

// ── Challenges ─────────────────────────────────────────────────────────

export interface Challenge {
  id: string;
  clip_id: string;
  clip_name?: TranslatableField;
  clip_slug?: TranslatableField;
  clip_thumbnail?: string;
  started_at: string;
  finished_at: string | null;
  is_completed: boolean;
  watched_items: number;
  total_items: number;
  watched_ids: string[];
  duration?: string;
}

/**
 * The challenge object returned by the clip-detail endpoint.
 * Identical to Challenge but guaranteed to have `watched_ids`.
 */
export type ActiveChallenge = Required<Pick<Challenge, 'watched_ids'>> &
  Omit<Challenge, 'watched_ids'>;

