export enum AppMode {
  SENDER = 'SENDER',
  RECEIVER = 'RECEIVER'
}

export enum MediaType {
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO'
}

export interface ProcessingStatus {
  loading: boolean;
  message: string;
  type: 'info' | 'success' | 'error' | 'idle' | 'destruct';
}

export interface StegoResult {
  dataUrl: string;
  fileName: string;
}