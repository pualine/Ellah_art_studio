export interface GeneratedImage {
  url: string;
  mimeType: string;
}

export interface ProcessingState {
  isLoading: boolean;
  error: string | null;
  stage: 'idle' | 'uploading' | 'processing' | 'complete';
}

export interface ImageFile {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}
