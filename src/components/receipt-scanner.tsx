'use client'

import { useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Upload, X } from 'lucide-react'
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

  const handleScan = () => {
    if (selectedFile) onScan(selectedFile)
  }

  return (
    <div className="space-y-4">
      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      {!preview ? (
        <>
          {/* Camera button — prominent on mobile */}
          <Button
            size="lg"
            className="w-full h-16 text-base gap-3"
            onClick={() => cameraInputRef.current?.click()}
            disabled={loading}
          >
            <Camera className="h-6 w-6" />
            Take Photo
          </Button>

          {/* Drop zone / file upload */}
          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
              dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Upload from gallery</p>
            <p className="text-xs text-muted-foreground mt-1">or drag & drop an image here</p>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Receipt preview" className="w-full max-h-96 object-contain bg-muted" />
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleScan}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span>
                Scanning receipt…
              </>
            ) : (
              <>
                <Camera className="h-5 w-5" />
                Scan Receipt
              </>
            )}
          </Button>
          <Button variant="outline" className="w-full" onClick={clearPreview} disabled={loading}>
            Choose Different Image
          </Button>
        </div>
      )}
    </div>
  )
}
