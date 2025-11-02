import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export const isNativeApp = () => {
  return Capacitor.isNativePlatform();
};

export const takePictureWithCamera = async (): Promise<File | null> => {
  try {
    if (!isNativeApp()) {
      return null; // Fall back to web camera
    }

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      saveToGallery: false,
      correctOrientation: true,
    });

    if (!image.dataUrl) {
      throw new Error('No image data received');
    }

    // Convert dataUrl to File
    const response = await fetch(image.dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `photo_${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });

    return file;
  } catch (error) {
    console.error('Error taking picture:', error);
    return null;
  }
};

export const pickImageFromGallery = async (): Promise<File | null> => {
  try {
    if (!isNativeApp()) {
      return null; // Fall back to web file input
    }

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      correctOrientation: true,
    });

    if (!image.dataUrl) {
      throw new Error('No image data received');
    }

    // Convert dataUrl to File
    const response = await fetch(image.dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `upload_${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });

    return file;
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

export const requestCameraPermissions = async (): Promise<boolean> => {
  try {
    if (!isNativeApp()) {
      return true;
    }

    const permissions = await Camera.checkPermissions();
    
    if (permissions.camera === 'granted' && permissions.photos === 'granted') {
      return true;
    }

    const requested = await Camera.requestPermissions({
      permissions: ['camera', 'photos']
    });

    return requested.camera === 'granted' && requested.photos === 'granted';
  } catch (error) {
    console.error('Error requesting camera permissions:', error);
    return false;
  }
};
