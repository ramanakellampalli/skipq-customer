import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: false });
const KEYCHAIN_SERVICE = 'com.skipqcustomer.biometrics';

export async function isBiometricAvailable(): Promise<boolean> {
  const { available } = await rnBiometrics.isSensorAvailable();
  return available;
}

export async function getBiometricLabel(): Promise<string> {
  const { biometryType } = await rnBiometrics.isSensorAvailable();
  if (biometryType === BiometryTypes.FaceID) return 'Face ID';
  if (biometryType === BiometryTypes.TouchID) return 'Touch ID';
  return 'Fingerprint';
}

export async function promptBiometric(promptMessage: string): Promise<boolean> {
  const { success } = await rnBiometrics.simplePrompt({ promptMessage });
  return success;
}

export async function saveCredentials(email: string, password: string): Promise<void> {
  await Keychain.setGenericPassword(email, password, {
    service: KEYCHAIN_SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getCredentials(): Promise<{ email: string; password: string } | null> {
  const result = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
  if (!result) return null;
  return { email: result.username, password: result.password };
}

export async function clearCredentials(): Promise<void> {
  await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
}

export async function hasSavedCredentials(): Promise<boolean> {
  const result = await Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE });
  return !!result;
}
