import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { IconUpload } from "@tabler/icons-react";
import { useDropzone } from "react-dropzone";

export const FileUpload = ({
  onChange,
}: {
  onChange?: (files: File[]) => void;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    onChange && onChange(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "p-6 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors",
        "border-gray-300 hover:border-brand-pink",
        isDragActive && "border-brand-pink bg-brand-pink/10"
      )}
    >
      <input {...getInputProps()} ref={fileInputRef} />
      <div className="flex flex-col items-center justify-center space-y-2">
        <IconUpload className="w-8 h-8 text-gray-400" />
        <p className="text-gray-500">
          {isDragActive
            ? "Drop the file here..."
            : "Drag & drop an image, or click to select"}
        </p>
      </div>
      {files.length > 0 && (
        <div className="mt-4 text-left">
          <p className="font-medium text-gray-900">Selected file:</p>
          <ul className="text-sm text-gray-500">
            {files.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 