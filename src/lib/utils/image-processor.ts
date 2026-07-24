/**
 * Client-side image processing using HTML5 Canvas.
 * No heavy dependencies — pure browser APIs.
 */

export interface ProcessedImage {
  blob: Blob
  previewUrl: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export function validateImageFile(
  file: File,
  maxMB: number
): { ok: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
    return { ok: false, error: 'Solo se permiten imágenes JPG, JPEG, PNG o WebP.' }
  }
  if (file.size > maxMB * 1024 * 1024) {
    return { ok: false, error: `El archivo supera el límite de ${maxMB} MB.` }
  }
  return { ok: true }
}

export function processImage(
  file: File,
  targetWidth: number,
  targetHeight: number,
  quality = 0.85
): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        let { width, height } = img

        // Fit within target keeping aspect ratio
        const ratio = Math.min(targetWidth / width, targetHeight / height)
        if (ratio < 1) {
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo inicializar Canvas 2D.'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Error al convertir la imagen a WebP.'))
              return
            }
            resolve({ blob, previewUrl: URL.createObjectURL(blob) })
          },
          'image/webp',
          quality
        )
      }

      img.onerror = () => reject(new Error('No se pudo leer la imagen.'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Error al leer el archivo.'))
    reader.readAsDataURL(file)
  })
}
