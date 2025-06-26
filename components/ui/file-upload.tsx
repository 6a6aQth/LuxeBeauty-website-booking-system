import { cn } from "@/lib/utils";
import React from "react";
import { motion } from "framer-motion";
import { IconUpload, IconX } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

export const FileUpload = ({
  onChange,
  uploadedFiles = [],
}: {
  onChange?: (files: File[]) => void;
  uploadedFiles?: string[];
}) => {
  // Helper to remove a file by index
  const handleRemove = (idx: number) => {
    if (!uploadedFiles) return;
    const newFiles = uploadedFiles.filter((_, i) => i !== idx);
    // onChange expects File[], but we only have URLs here, so we need to signal removal to parent
    // We'll call onChange with an empty array, parent should update uploadedFiles prop
    if (onChange) onChange([]); // Parent should handle removal by index
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (uploadedFiles.length + acceptedFiles.length > 5) {
      // Only allow up to 5 files
      acceptedFiles = acceptedFiles.slice(0, 5 - uploadedFiles.length);
    }
    onChange && onChange(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: uploadedFiles.length < 5,
    accept: { 'image/*': [] },
    disabled: uploadedFiles.length >= 5,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "p-6 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors",
        "border-gray-300 hover:border-brand-pink",
        isDragActive && "border-brand-pink bg-brand-pink/10",
        uploadedFiles.length >= 5 && "opacity-60 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-2">
        {uploadedFiles.length === 0 && !isDragActive && (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            <IconUpload className="w-8 h-8 text-gray-400" />
          </motion.div>
        )}
        <p className="text-gray-500">
          {isDragActive
            ? "Drop the image(s) here..."
            : uploadedFiles.length > 0
            ? uploadedFiles.length >= 5
              ? "Maximum 5 images uploaded. Remove one to add more."
              : "Add or drag more images (max 5)."
            : "Drag & drop images, or click to select (max 5)"}
        </p>
      </div>
      {uploadedFiles.length > 0 && (
        <div className="mt-4 text-left">
          <p className="font-medium text-gray-900 mb-2">Selected image{uploadedFiles.length > 1 ? 's' : ''}:</p>
          <div className="flex flex-wrap gap-3">
            {uploadedFiles.map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative group"
                style={{ width: 72, height: 72 }}
              >
                <img
                  src={url}
                  alt={`Inspiration ${i + 1}`}
                  className="w-16 h-16 object-cover rounded border border-gray-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleRemove(i);
                  }}
                  className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-full p-1 m-1 text-gray-700 hover:bg-red-100 hover:text-red-600 transition-opacity opacity-0 group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <IconX size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 