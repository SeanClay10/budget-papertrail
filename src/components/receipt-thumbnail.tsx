'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Receipt, Maximize2 } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface ReceiptThumbnailProps {
  imageUrl: string | null
  storeName: string | null
  receiptDate: string
}

export function ReceiptThumbnail({ imageUrl, storeName, receiptDate }: ReceiptThumbnailProps) {
  const [open, setOpen] = useState(false)

  const formattedDate = format(new Date(receiptDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')

  // No photo — show a static placeholder (manually entered receipt)
  if (!imageUrl) {
    return (
      <div
        className={cn(
          'shrink-0 w-16 h-16 rounded-xl border-2 border-border',
          'bg-muted flex items-center justify-center',
          'shadow-[var(--shadow-hard-sm)]',
        )}
        aria-label="No photo available"
      >
        <Receipt className="h-5 w-5 text-muted-foreground/40" strokeWidth={1.5} />
      </div>
    )
  }

  return (
    <>
      {/* Thumbnail button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'group shrink-0 relative w-16 h-16 rounded-xl border-2 border-border overflow-hidden',
          'shadow-[var(--shadow-hard-sm)]',
          'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          'hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_var(--border)]',
          'active:translate-x-[1px] active:translate-y-[1px] active:shadow-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        )}
        aria-label={`View photo for ${storeName ?? 'receipt'}`}
      >
        <Image
          src={imageUrl}
          alt={storeName ?? 'Receipt photo'}
          fill
          className="object-cover"
          sizes="64px"
        />
        {/* Hover overlay — signals it's interactive */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-150 flex items-center justify-center">
          <Maximize2
            className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 drop-shadow"
            strokeWidth={2.5}
          />
        </div>
      </button>

      {/* Lightbox dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            'sm:max-w-md p-0 gap-0 overflow-hidden animate-pop-in',
            'border-2 border-border shadow-[5px_5px_0px_0px_var(--border)] ring-0',
          )}
        >
          {/* Header — pr-10 clears the built-in close button */}
          <div className="px-4 pt-4 pb-3 pr-10 border-b-2 border-border/20">
            <p className="font-heading font-bold text-base leading-tight">
              {storeName || 'Unknown store'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{formattedDate}</p>
          </div>

          {/* Full receipt image — scrollable for tall receipts */}
          <div className="overflow-y-auto max-h-[70vh] bg-muted/30">
            <Image
              src={imageUrl}
              alt={storeName ?? 'Receipt photo'}
              width={800}
              height={1200}
              className="w-full h-auto"
              sizes="(max-width: 640px) calc(100vw - 2rem), 448px"
              priority
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
