import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const RECEIPT_SYSTEM_PROMPT = `You are a receipt parser. Your job is to extract line items from receipt images and categorize them.
Always return only valid JSON with no markdown, no code blocks, no extra text.
Be precise with prices — use exactly what is printed on the receipt.`

export const DEFAULT_CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Clothing',
  'Electronics',
  'Health',
  'Transportation',
  'Entertainment',
  'Household',
  'Other',
]
