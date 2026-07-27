export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

export type AccountType = 'individual' | 'organization'
export type PlanType = 'free' | 'pro' | 'organization'
export type EventType = 'profile_view' | 'amount_selected' | 'hotmart_redirect'
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed'
export type ReportReason =
  | 'fraud'
  | 'impersonation'
  | 'prohibited_content'
  | 'suspicious_link'
  | 'spam'
  | 'other'

// ─────────────────────────────────────────────
// Core tables
// ─────────────────────────────────────────────

export interface Profile {
  id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  account_type: AccountType
  website_url: string | null
  plan: PlanType
  is_active: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface SocialLink {
  id: string
  profile_id: string
  platform: string
  label: string | null
  url: string
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface SupportGoal {
  id: string
  profile_id: string
  title: string
  emoji: string | null
  description: string | null
  cover_url: string | null
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface SupportAmount {
  id: string
  goal_id: string
  amount: number
  currency: string
  hotmart_checkout_url: string
  hotmart_offer_code: string | null
  button_label: string | null
  is_featured: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface AnalyticsEvent {
  id: string
  profile_id: string
  support_amount_id: string | null
  event_type: EventType
  session_id: string | null
  referrer: string | null
  created_at: string
}

export interface ProfileReport {
  id: string
  profile_id: string
  reason: ReportReason
  description: string | null
  reporter_email: string | null
  status: ReportStatus
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}

// ─────────────────────────────────────────────
// Plan limits (centralized — never trust client)
// ─────────────────────────────────────────────

export const PLAN_LIMITS: Record<PlanType, { goals: number; socialLinks: number }> = {
  free: { goals: 5, socialLinks: 5 },
  pro: { goals: 20, socialLinks: 15 },
  organization: { goals: 50, socialLinks: 30 },
}

export const MAX_SUPPORT_AMOUNTS_PER_GOAL = 50

// ─────────────────────────────────────────────
// Social platforms
// ─────────────────────────────────────────────

export const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'discord', label: 'Discord' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'website', label: 'Sitio web' },
  { value: 'other', label: 'Otro enlace' },
] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]['value']
