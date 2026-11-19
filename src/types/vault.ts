export type VaultCategory = 
  | 'all'
  | 'favourite'
  | 'login'
  | 'browser'
  | 'mobile'
  | 'payment'
  | 'identity'
  | 'wifi'
  | 'note';

export interface VaultItem {
  id: string;
  appName: string;
  username: string;
  password: string;
  siteUrl: string;
  category: VaultCategory;
  tags: string[];
  notes?: string;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface VaultStats {
  total: number;
  compromised: number;
  weak: number;
  reused: number;
  healthScore: number;
}

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarInitials: string;
  createdAt: number;
}

export type ActiveTab = 'home' | 'vault' | 'generator' | 'settings';
