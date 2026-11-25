import { NativeModules, Platform } from 'react-native';
import { VaultItem } from '../types/vault';

const { PassManageAutofill } = NativeModules;

export interface AutofillStatus {
  isSupported: boolean;
  isEnabled: boolean;
}

/**
 * Checks whether Android Autofill framework (API 26+) is supported
 * and whether PassManage is currently chosen as the active Autofill provider.
 */
export async function checkAutofillStatus(): Promise<AutofillStatus> {
  if (Platform.OS !== 'android' || !PassManageAutofill) {
    return { isSupported: false, isEnabled: false };
  }
  try {
    const isSupported = await PassManageAutofill.isAutofillSupported();
    if (!isSupported) {
      return { isSupported: false, isEnabled: false };
    }
    const isEnabled = await PassManageAutofill.isAutofillServiceEnabled();
    return { isSupported: true, isEnabled: !!isEnabled };
  } catch (error) {
    console.error('Error checking autofill status:', error);
    return { isSupported: false, isEnabled: false };
  }
}

/**
 * Opens the native Android OS Autofill service selector dialog,
 * prompting the user to select PassManage as their system autofill provider.
 */
export async function requestEnableAutofill(): Promise<boolean> {
  if (Platform.OS !== 'android' || !PassManageAutofill) return false;
  try {
    return await PassManageAutofill.requestSetAutofillService();
  } catch (error) {
    console.error('Error opening autofill settings:', error);
    return false;
  }
}

/**
 * Syncs the local vault items to the Android native Autofill store
 * so PassManageAutofillService can immediately serve onFillRequests in third-party apps.
 */
export async function syncVaultToAutofill(items: VaultItem[]): Promise<boolean> {
  if (Platform.OS !== 'android' || !PassManageAutofill) return false;
  try {
    const json = JSON.stringify(items);
    return await PassManageAutofill.syncVaultData(json);
  } catch (error) {
    console.error('Error syncing vault to autofill:', error);
    return false;
  }
}

/**
 * Fetches credentials captured by PassManageAutofillService via onSaveRequest
 * when the user logged into or registered on any external app or browser.
 */
export async function fetchPendingAutoSavedItems(): Promise<VaultItem[]> {
  if (Platform.OS !== 'android' || !PassManageAutofill) return [];
  try {
    const pendingJson = await PassManageAutofill.getPendingSavedItems();
    if (!pendingJson || pendingJson === '[]') return [];
    const items = JSON.parse(pendingJson) as VaultItem[];
    return items;
  } catch (error) {
    console.error('Error fetching pending auto-saved items:', error);
    return [];
  }
}

/**
 * Clears pending auto-saved items once they are merged into the encrypted vault.
 */
export async function clearPendingAutoSavedItems(): Promise<boolean> {
  if (Platform.OS !== 'android' || !PassManageAutofill) return false;
  try {
    return await PassManageAutofill.clearPendingSavedItems();
  } catch (error) {
    console.error('Error clearing pending auto-saved items:', error);
    return false;
  }
}
