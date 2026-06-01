export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type SubscriptionStatus = 'free' | 'active' | 'past_due' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          user_id: string
          scans_used: number
          is_admin: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: SubscriptionStatus
          subscription_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          scans_used?: number
          is_admin?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: SubscriptionStatus
          subscription_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          scans_used?: number
          is_admin?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: SubscriptionStatus
          subscription_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      budget_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          monthly_limit: number
          color: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          monthly_limit?: number
          color?: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          monthly_limit?: number
          color?: string
          icon?: string | null
          created_at?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          id: string
          user_id: string
          store_name: string | null
          receipt_date: string
          total_amount: number | null
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          store_name?: string | null
          receipt_date?: string
          total_amount?: number | null
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          store_name?: string | null
          receipt_date?: string
          total_amount?: number | null
          image_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      receipt_items: {
        Row: {
          id: string
          receipt_id: string
          user_id: string
          name: string
          price: number
          category_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          receipt_id: string
          user_id: string
          name: string
          price: number
          category_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          receipt_id?: string
          user_id?: string
          name?: string
          price?: number
          category_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'receipt_items_receipt_id_fkey'
            columns: ['receipt_id']
            isOneToOne: false
            referencedRelation: 'receipts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'receipt_items_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'budget_categories'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type BudgetCategory = Database['public']['Tables']['budget_categories']['Row']
export type Receipt = Database['public']['Tables']['receipts']['Row']
export type ReceiptItem = Database['public']['Tables']['receipt_items']['Row']

export interface ReceiptItemWithCategory extends ReceiptItem {
  budget_categories: BudgetCategory | null
}

export interface ReceiptWithItems extends Receipt {
  receipt_items: ReceiptItemWithCategory[]
}

export interface CategoryWithSpending extends BudgetCategory {
  spent: number
}

export interface ScannedItem {
  name: string
  price: number
  suggested_category: string
  included: boolean
  category_id: string | null
}

export interface ScanResult {
  image_url: string
  store_name: string
  receipt_date: string
  items: ScannedItem[]
}
