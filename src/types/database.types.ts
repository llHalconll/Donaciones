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

export interface DonationButton {
  id: string
  profile_id: string
  title: string
  description: string | null
  amount: number
  currency: string
  hotmart_checkout_url: string
  button_label: string | null
  is_active: boolean
  is_featured: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface AnalyticsEvent {
  id: string
  profile_id: string
  donation_button_id: string | null
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

export const PLAN_LIMITS: Record<PlanType, { buttons: number; socialLinks: number }> = {
  free: { buttons: 5, socialLinks: 5 },
  pro: { buttons: 20, socialLinks: 15 },
  organization: { buttons: 50, socialLinks: 30 },
}

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
