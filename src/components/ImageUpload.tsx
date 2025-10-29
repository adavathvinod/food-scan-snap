import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  isAnalyzing: boolean;
}

const ImageUpload = ({ onImageSelect, isAnalyzing }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        onImageSelect(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearImage = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!preview ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-primary bg-secondary/50 scale-105"
              : "border-border hover:border-primary hover:bg-secondary/30"
          }`}
        >
          <Upload className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2 text-foreground">Upload Food Image</h3>
          <p className="text-sm text-muted-foreground">
            Drag & drop or click to select
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <img src={preview} alt="Food preview" className="w-full h-auto" />
          {!isAnalyzing && (
            <Button
              onClick={clearImage}
              variant="secondary"
              size="icon"
              className="absolute top-4 right-4 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
