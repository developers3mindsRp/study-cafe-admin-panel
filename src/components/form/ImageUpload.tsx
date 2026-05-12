import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadImage } from "../../api/uploads";
import { getImageUrl } from "../../utils/image.utils";

const IMAGE_ACCEPT = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "image/svg+xml": [".svg"],
};

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minWidth?: number;
  minHeight?: number;
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      URL.revokeObjectURL(objectUrl);
      resolve({ width, height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image dimensions"));
    };

    img.src = objectUrl;
  });
}

export default function ImageUpload({
  value,
  onChange,
  label,
  placeholder = "Drag & drop an image here, or click to select",
  className = "",
  disabled = false,
  minWidth,
  minHeight,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setError(null);
      try {
        if (minWidth || minHeight) {
          const { width, height } = await getImageDimensions(file);
          if (
            (typeof minWidth === "number" && width < minWidth) ||
            (typeof minHeight === "number" && height < minHeight)
          ) {
            setError(
              `Image must be at least ${minWidth ?? 0}x${minHeight ?? 0}px. Uploaded image is ${width}x${height}px.`
            );
            return;
          }
        }

        setUploading(true);
        const { url } = await uploadImage(file);
        onChange(url);
      } catch (e: any) {
        let message = "Upload failed";
        if (e.response?.data?.error) {
          message = e.response.data.error;
        } else if (e.message) {
          message = e.message;
        }
        setError(message);
      } finally {
        setUploading(false);
      }
    },
    [onChange, minWidth, minHeight]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: IMAGE_ACCEPT,
    maxFiles: 1,
    disabled: disabled || uploading,
    noClick: false,
    noKeyboard: false,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className={className}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
        </label>
      )}
      <div
        {...getRootProps()}
        className={`
          relative min-h-[140px] cursor-pointer rounded-lg border-2 border-dashed transition
          ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
          ${isDragActive
            ? "border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/10"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
          }
          ${uploading ? "pointer-events-none opacity-70" : ""}
        `}
      >
        <input {...getInputProps()} />
        {uploading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/40 text-sm font-medium text-white">
            Uploading…
          </div>
        )}
        {error && (
          <p className="absolute left-2 right-2 top-2 z-10 rounded bg-red-100 px-2 py-1 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </p>
        )}
        {value ? (
          <div className="relative flex min-h-[140px] items-center justify-center p-4">
            <img
              src={getImageUrl(value)}
              alt="Preview"
              className="max-h-40 max-w-full rounded-lg object-contain"
              referrerPolicy="no-referrer"
              loading="lazy"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute right-2 top-2 rounded-lg bg-gray-900/70 px-2.5 py-1.5 text-sm font-medium text-white transition hover:bg-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
              >
                Remove
              </button>
            )}
            <p className="absolute bottom-2 left-2 text-xs text-gray-500 dark:text-gray-400">
              Drop a new image or click to replace
            </p>
          </div>
        ) : (
          <div className="flex min-h-[140px] flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
              <svg
                className="size-6 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isDragActive ? "Drop image here" : "Drag & drop or click to upload"}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {placeholder}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              PNG, JPG, WebP, GIF, SVG
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
