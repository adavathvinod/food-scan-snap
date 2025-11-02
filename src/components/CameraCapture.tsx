import { useRef } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { takePictureWithCamera, isNativeApp, requestCameraPermissions } from "@/utils/capacitor-camera";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  isAnalyzing: boolean;
}

const CameraCapture = ({ onCapture, isAnalyzing }: CameraCaptureProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = async () => {
    if (isNativeApp()) {
      // Use Capacitor Camera for native app
      const hasPermission = await requestCameraPermissions();
      if (!hasPermission) {
        toast.error("Camera permission denied");
        return;
      }

      const file = await takePictureWithCamera();
      if (file) {
        onCapture(file);
      } else {
        toast.error("Failed to capture photo");
      }
    } else {
      // Fall back to web camera
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onCapture(file);
    } else {
      toast.error("Please select a valid image file");
    }
  };

  return (
    <>
      <Button
        onClick={handleCameraClick}
        disabled={isAnalyzing}
        size="lg"
        className="w-full"
      >
        <Camera className="w-5 h-5 mr-2" />
        📷 Take a Photo
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};

export default CameraCapture;