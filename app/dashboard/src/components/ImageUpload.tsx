import { forwardRef, useRef, useImperativeHandle } from 'react'

interface ImageUploadProps {
  onUpload: (file: File) => void
  imageUrl: string | null
  loading: boolean
  error: string | null
}

const ImageUpload = forwardRef<HTMLInputElement, ImageUploadProps>(
  ({ onUpload, imageUrl, loading, error }, ref) => {
    const internalRef = useRef<HTMLInputElement>(null)
    
    useImperativeHandle(ref, () => internalRef.current as HTMLInputElement)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onUpload(file)
      }
    }

    return (
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-medical-blue transition-colors duration-200">
          <input
            ref={internalRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="xray-upload"
            disabled={loading}
          />
          <label
            htmlFor="xray-upload"
            className={`cursor-pointer flex flex-col items-center gap-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="text-6xl">🩻</div>
            <div>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {loading ? 'Processing...' : 'Click to upload X-ray image'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                JPG, PNG, or JPEG (max 10MB)
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 animate-fade-in">
            <p className="text-red-800 dark:text-red-300 text-sm">❌ {error}</p>
          </div>
        )}

        {imageUrl && (
          <div className="relative rounded-lg overflow-hidden shadow-lg animate-fade-in">
            <img
              src={imageUrl}
              alt="Uploaded X-ray"
              className="w-full h-auto max-h-96 object-contain bg-gray-100 dark:bg-gray-800"
            />
            {loading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

ImageUpload.displayName = 'ImageUpload'

export default ImageUpload
