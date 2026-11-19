import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import * as Clipboard from 'expo-clipboard';
import { AES, Utf8 } from 'crypto-es';
import { VaultItem, VaultStats, PasswordGeneratorOptions } from '../types/vault';

const SECURE_STORE_PIN_KEY = 'pm_master_pin_hash';
const SECURE_STORE_VAULT_KEY = 'pm_vault_master_key';
const SECURE_STORE_BIO_ENABLED_KEY = 'pm_biometrics_enabled';
const VAULT_STORAGE_KEY = 'pm_encrypted_vault_data';

// Helper to derive SHA-256 hash
async function hashValue(value: string, salt: string = 'pm_salt_2026'): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    value + salt
  );
}

// -------------------------------------------------------------
// Master PIN Management
// -------------------------------------------------------------
export async function isMasterPinSet(): Promise<boolean> {
  try {
    const hash = await SecureStore.getItemAsync(SECURE_STORE_PIN_KEY);
    return !!hash;
  } catch (error) {
    console.error('Error checking master PIN:', error);
    return false;
  }
}

export async function setMasterPin(pin: string): Promise<boolean> {
  try {
    const hashed = await hashValue(pin);
    await SecureStore.setItemAsync(SECURE_STORE_PIN_KEY, hashed);

    // Also initialize a 256-bit random master encryption key if not yet set
    const existingKey = await SecureStore.getItemAsync(SECURE_STORE_VAULT_KEY);
    if (!existingKey) {
      const randomKey = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Date.now().toString() + Math.random().toString() + pin
      );
      await SecureStore.setItemAsync(SECURE_STORE_VAULT_KEY, randomKey);
    }
    return true;
  } catch (error) {
    console.error('Error setting master PIN:', error);
    return false;
  }
}

export async function verifyMasterPin(pin: string): Promise<boolean> {
  try {
    const storedHash = await SecureStore.getItemAsync(SECURE_STORE_PIN_KEY);
    if (!storedHash) return false;
    const computedHash = await hashValue(pin);
    return storedHash === computedHash;
  } catch (error) {
    console.error('Error verifying master PIN:', error);
    return false;
  }
}

export async function clearAllSecureCredentials(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SECURE_STORE_PIN_KEY);
    await SecureStore.deleteItemAsync(SECURE_STORE_VAULT_KEY);
    await SecureStore.deleteItemAsync(SECURE_STORE_BIO_ENABLED_KEY);
  } catch (error) {
    console.error('Error clearing secure credentials:', error);
  }
}

// -------------------------------------------------------------
// Biometric Authentication
// -------------------------------------------------------------
export async function checkBiometricsAvailable(): Promise<{
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return { hasHardware, isEnrolled, supportedTypes };
  } catch (error) {
    console.error('Error checking biometrics:', error);
    return { hasHardware: false, isEnrolled: false, supportedTypes: [] };
  }
}

export async function isBiometricsPrefEnabled(): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(SECURE_STORE_BIO_ENABLED_KEY);
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
}

export async function setBiometricsPrefEnabled(enabled: boolean): Promise<void> {
  try {
    await SecureStore.setItemAsync(SECURE_STORE_BIO_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Error saving biometrics preference:', error);
  }
}

export async function authenticateWithBiometrics(
  promptMessage: string = 'Unlock PassManage'
): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Enter Master PIN',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });
    return result.success;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
}

// -------------------------------------------------------------
// AES-256 Vault Encryption & Decryption
// -------------------------------------------------------------
async function getMasterKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(SECURE_STORE_VAULT_KEY);
  if (!key) {
    key = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      'passmanage_default_secure_vault_key_2026'
    );
    await SecureStore.setItemAsync(SECURE_STORE_VAULT_KEY, key);
  }
  return key;
}

export async function encryptVaultData(items: VaultItem[]): Promise<string> {
  const masterKey = await getMasterKey();
  const jsonString = JSON.stringify(items);
  const encrypted = AES.encrypt(jsonString, masterKey).toString();
  return encrypted;
}

export async function decryptVaultData(ciphertext: string): Promise<VaultItem[]> {
  try {
    const masterKey = await getMasterKey();
    const decrypted = AES.decrypt(ciphertext, masterKey);
    const decryptedString = decrypted.toString(Utf8);
    if (!decryptedString) return [];
    return JSON.parse(decryptedString) as VaultItem[];
  } catch (error) {
    console.error('Failed to decrypt vault data:', error);
    return [];
  }
}

// -------------------------------------------------------------
// Password Strength & Vault Health Analysis
// -------------------------------------------------------------
const COMMON_BREACHED_PASSWORDS = new Set([
  '123456', 'password', '12345678', 'qwerty', '123456789', '12345',
  '1234', '111111', '1234567', 'dragon', 'welcome', 'admin', 'password1',
  'pass123', 'root', 'toor', 'default', 'login', 'letmein', 'master',
  'iloveyou', 'sunshine', 'princess', 'football', 'monkey', 'test123',
  'netflix2022', 'insta_2026', 'pass', 'admin123', 'admin2024'
]);

export interface PasswordAnalysis {
  score: number; // 0 - 100
  isWeak: boolean;
  isCompromised: boolean;
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  feedback: string[];
}

export function calculatePasswordStrength(password: string): PasswordAnalysis {
  if (!password || password.trim().length === 0) {
    return {
      score: 0,
      isWeak: true,
      isCompromised: true,
      label: 'Weak',
      color: '#EF4444',
      feedback: ['No password entered'],
    };
  }

  const pass = password.trim();
  const lower = pass.toLowerCase();
  const feedback: string[] = [];

  // 1. Check known breached / common dictionary patterns
  let isBreached = false;
  if (COMMON_BREACHED_PASSWORDS.has(lower)) {
    isBreached = true;
    feedback.push('Known common or breached password');
  }

  // 2. Length evaluation (0 - 45 points)
  let lengthScore = 0;
  if (pass.length < 6) {
    lengthScore = 5;
    feedback.push('Extremely short (<6 chars)');
  } else if (pass.length < 8) {
    lengthScore = 15;
    feedback.push('Short (recommended min: 8 chars)');
  } else if (pass.length < 12) {
    lengthScore = 30;
  } else if (pass.length < 16) {
    lengthScore = 40;
  } else {
    lengthScore = 45;
  }

  // 3. Character Diversity & Entropy (0 - 40 points)
  let diversityScore = 0;
  const hasLower = /[a-z]/.test(pass);
  const hasUpper = /[A-Z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pass);

  if (hasLower) diversityScore += 10;
  if (hasUpper) diversityScore += 10;
  if (hasNumber) diversityScore += 10;
  if (hasSymbol) diversityScore += 10;

  if (!hasUpper) feedback.push('Add uppercase letters');
  if (!hasNumber) feedback.push('Add numbers');
  if (!hasSymbol) feedback.push('Add special symbols');

  // 4. Complexity & Uniqueness Bonus / Penalty (0 - 15 points)
  let bonusScore = 0;
  const uniqueCharCount = new Set(pass).size;
  if (uniqueCharCount >= 10) bonusScore += 10;
  else if (uniqueCharCount >= 6) bonusScore += 5;

  // Penalize obvious character repetitions (e.g. "aaa", "111")
  if (/(.)\1{2,}/.test(pass)) {
    bonusScore -= 10;
    feedback.push('Avoid repeated characters');
  }

  // Calculate raw aggregate score
  let totalScore = lengthScore + diversityScore + bonusScore;
  if (isBreached) {
    totalScore = Math.min(20, totalScore);
  }

  totalScore = Math.max(5, Math.min(100, totalScore));

  const isCompromised = isBreached || pass.length < 6 || totalScore < 30;
  const isWeak = totalScore < 60 || pass.length < 10 || isCompromised;

  let label: 'Weak' | 'Fair' | 'Good' | 'Strong' = 'Weak';
  let color = '#EF4444'; // Red

  if (totalScore >= 80) {
    label = 'Strong';
    color = '#10B981'; // Green
  } else if (totalScore >= 60) {
    label = 'Good';
    color = '#06B6D4'; // Cyan
  } else if (totalScore >= 40) {
    label = 'Fair';
    color = '#F59E0B'; // Amber
  }

  return {
    score: totalScore,
    isWeak,
    isCompromised,
    label,
    color,
    feedback,
  };
}

export function computeVaultStats(items: VaultItem[]): VaultStats {
  if (items.length === 0) {
    return {
      total: 0,
      compromised: 0,
      weak: 0,
      reused: 0,
      healthScore: 100,
    };
  }

  // Count password frequency for credential reuse analysis
  const passwordFrequency: Record<string, number> = {};
  items.forEach(item => {
    const trimmed = (item.password || '').trim();
    if (trimmed) {
      passwordFrequency[trimmed] = (passwordFrequency[trimmed] || 0) + 1;
    }
  });

  let weakCount = 0;
  let compromisedCount = 0;
  let reusedCount = 0;
  let totalScoreSum = 0;

  items.forEach(item => {
    const analysis = calculatePasswordStrength(item.password);
    const isReused = Boolean(item.password && passwordFrequency[item.password.trim()] > 1);

    if (analysis.isCompromised) {
      compromisedCount += 1;
    }
    if (analysis.isWeak) {
      weakCount += 1;
    }
    if (isReused) {
      reusedCount += 1;
    }

    totalScoreSum += analysis.score;
  });

  const total = items.length;
  const averageStrength = Math.round(totalScoreSum / total);

  // Proportional dynamic deductions
  const compromisedPenalty = Math.round((compromisedCount / total) * 35);
  const reusePenalty = Math.round((reusedCount / total) * 25);
  const weakPenalty = Math.round((weakCount / total) * 20);

  // Dynamic vault health score (clamped between 10 and 100)
  const rawScore = averageStrength - compromisedPenalty - reusePenalty - weakPenalty;
  const healthScore = Math.max(10, Math.min(100, Math.round(rawScore)));

  return {
    total,
    compromised: compromisedCount,
    weak: weakCount,
    reused: reusedCount,
    healthScore,
  };
}

// Helpers for UI filtering
export function isItemCompromised(item: VaultItem): boolean {
  return calculatePasswordStrength(item.password).isCompromised;
}

export function isItemWeak(item: VaultItem): boolean {
  return calculatePasswordStrength(item.password).isWeak;
}

export function isItemReused(item: VaultItem, allItems: VaultItem[]): boolean {
  if (!item.password) return false;
  const target = item.password.trim();
  const matches = allItems.filter(i => (i.password || '').trim() === target);
  return matches.length > 1;
}

// -------------------------------------------------------------
// Secure Password Generator
// -------------------------------------------------------------
export function generatePassword(options: PasswordGeneratorOptions): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charset = '';
  const guaranteedChars: string[] = [];

  if (options.includeUppercase) {
    charset += uppercase;
    guaranteedChars.push(uppercase[Math.floor(Math.random() * uppercase.length)]);
  }
  if (options.includeLowercase) {
    charset += lowercase;
    guaranteedChars.push(lowercase[Math.floor(Math.random() * lowercase.length)]);
  }
  if (options.includeNumbers) {
    charset += numbers;
    guaranteedChars.push(numbers[Math.floor(Math.random() * numbers.length)]);
  }
  if (options.includeSymbols) {
    charset += symbols;
    guaranteedChars.push(symbols[Math.floor(Math.random() * symbols.length)]);
  }

  if (charset === '') {
    charset = lowercase + numbers;
  }

  const result: string[] = [...guaranteedChars];
  const remainingLength = Math.max(0, options.length - guaranteedChars.length);

  for (let i = 0; i < remainingLength; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result.push(charset[randomIndex]);
  }

  // Shuffle the result array
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.join('');
}

// -------------------------------------------------------------
// Secure Clipboard Utility
// -------------------------------------------------------------
let clearClipboardTimeout: ReturnType<typeof setTimeout> | null = null;

export async function copyToClipboardSecurely(
  text: string,
  autoClearSeconds: number = 45
): Promise<void> {
  await Clipboard.setStringAsync(text);

  if (clearClipboardTimeout) {
    clearTimeout(clearClipboardTimeout);
  }

  if (autoClearSeconds > 0) {
    clearClipboardTimeout = setTimeout(async () => {
      try {
        const currentContent = await Clipboard.getStringAsync();
        if (currentContent === text) {
          await Clipboard.setStringAsync('');
        }
      } catch (err) {
        console.error('Error clearing clipboard:', err);
      }
    }, autoClearSeconds * 1000);
  }
}
