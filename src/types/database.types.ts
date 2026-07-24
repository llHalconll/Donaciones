export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Profile {
  id: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  is_active: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface SocialLink {
  id: string
  profile_id: string
  platform: string
  url: string
  created_at: string
}

export interface DonationButton {
  id: string
  profile_id: string
  title: string
  amount: number
  currency: string
  hotmart_checkout_url: string
  order_index: number
  created_at: string
}
