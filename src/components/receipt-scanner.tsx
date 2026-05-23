'use client'

import { useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReceiptScannerProps {
  onScan: (file: File) => void
  loading: boolean
}

function compressImage(file: File, maxWidth = 1920): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        resolve(new File([blob!], file.name, { type: 'image/jpeg' }))
      }, 'image/jpeg', 0.88)
    }
    img.src = url
  })
}

export function ReceiptScanner({ onScan, loading }: ReceiptScannerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    const compressed = await compressImage(file)
    setSelectedFile(compressed)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(compressed)
  }, [])

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await handleFile(file)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) await handleFile(file)
  }

  const clearPreview = () => {
    setPreview(null)
    setSelectedFile(null)
    if (cameraInputRef.current) cameraInputRef.current.value = ''
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleInputChange} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleInputChange} />

      {!preview ? (
        <>
          {/* Camera — primary action */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={loading}
            className={cn(
              'w-full h-20 flex items-center justify-center gap-3 rounded-2xl',
              'bg-primary text-white font-heading font-bold text-lg',
              'border-2 border-border shadow-[5px_5px_0px_0px_var(--border)]',
              'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              'hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[7px_7px_0px_0px_var(--border)]',
              'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[3px_3px_0px_0px_var(--border)]',
              'disabled:opacity-50 disabled:pointer-events-none',
            )}
          >
            <Camera className="h-7 w-7" strokeWidth={2.5} />
            Take Photo
          </button>

          {/* Drop zone */}
          <div
            className={cn(
              'flex flex-col items-center justify-center gap-2 p-8 rounded-2xl cursor-pointer',
              'border-2 border-dashed transition-all duration-200',
              dragging
                ? 'border-primary bg-accent text-primary border-solid'
                : 'border-border/50 bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-accent/30'
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8" strokeWidth={2} />
            <p className="font-heading font-bold text-sm">Upload from gallery</p>
            <p className="text-xs">or drag & drop an image here</p>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {/* Preview */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-border shadow-[5px_5px_0px_0px_var(--border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Receipt preview" className="w-full max-h-96 object-contain bg-muted" />
            <button
              onClick={clearPreview}
              className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-foreground/80 text-background border-2 border-border hover:bg-foreground transition-colors"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scan button */}
          <button
            onClick={() => selectedFile && onScan(selectedFile)}
            disabled={loading}
            className={cn(
              'w-full h-14 flex items-center justify-center gap-3 rounded-2xl',
              'bg-primary text-white font-heading font-bold text-base',
              'border-2 border-border shadow-[5px_5px_0px_0px_var(--border)]',
              'transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
              'hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[7px_7px_0px_0px_var(--border)]',
              'active:translate-x-[1px] active:translate-y-[1px] active:shadow-[3px_3px_0px_0px_var(--border)]',
              'disabled:opacity-50 disabled:pointer-events-none',
            )}
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Scanning receipt…</>
            ) : (
              <><Camera className="h-5 w-5" strokeWidth={2.5} /> Scan Receipt</>
            )}
          </button>

          <Button variant="outline" className="w-full" onClick={clearPreview} disabled={loading}>
            Choose Different Image
          </Button>
        </div>
      )}
    </div>
  )
}
