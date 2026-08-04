/**
 * Saving an exported file onto the device itself, rather than handing it to the
 * share sheet. The three platforms disagree about where a file may land, so the
 * result says which place it was, and the caller words the toast accordingly.
 */

import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { EncodingType, StorageAccessFramework, writeAsStringAsync } from 'expo-file-system/legacy';
import { Asset, requestPermissionsAsync } from 'expo-media-library';

import type { Strings } from '../i18n/strings';

export type SaveResult =
  /** Added to the photo library. */
  | 'gallery'
  /** Written into the folder the user picked (Android). */
  | 'folder'
  /** Written into the app's own folder, which the Files app lists (iOS). */
  | 'files'
  /** The user backed out of the folder picker. */
  | 'cancelled'
  /** Photo library access was refused. */
  | 'denied';

/** The formats the photo library will take; everything else is a document. */
const isPhoto = (mimeType: string): boolean => mimeType === 'image/png' || mimeType === 'image/jpeg';

/**
 * Saves an existing local file onto the device.
 *
 * Images reach the photo library on iOS only. Doing the same on Android means
 * holding READ_MEDIA_IMAGES, which Google Play grants to apps whose core
 * function is browsing the user's photos — this one only ever writes an image
 * out, so it would be claiming an access it does not need. On Android an image
 * is saved like every other file: into the folder the user picks.
 */
export async function saveToDevice(file: File, mimeType: string): Promise<SaveResult> {
  if (Platform.OS === 'android') {
    const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permission.granted) return 'cancelled';
    // SAF derives the extension from the mime type, so the base name goes in
    // without one — otherwise the file comes out as "report.csv.csv".
    const base = file.name.replace(/\.[^.]+$/, '');
    const target = await StorageAccessFramework.createFileAsync(permission.directoryUri, base, mimeType);
    await writeAsStringAsync(target, file.base64Sync(), { encoding: EncodingType.Base64 });
    return 'folder';
  }

  if (isPhoto(mimeType)) {
    // Write-only access: the app adds a photo and never reads the library.
    const { granted } = await requestPermissionsAsync(true);
    if (!granted) return 'denied';
    await Asset.create(file.uri);
    return 'gallery';
  }

  // iOS has no shared Downloads folder. The app's own document directory is the
  // one place a file can be put and still be found afterwards — the Files app
  // lists it under "On My iPhone" because of UIFileSharingEnabled and
  // LSSupportsOpeningDocumentsInPlace in app.json.
  const target = new File(Paths.document, file.name);
  if (target.exists) target.delete();
  await file.copy(target);
  return 'files';
}

/**
 * Downloads a file and saves it onto the device. The download streams straight
 * to disk, so a CSV of a million rows never has to fit in memory.
 */
export async function saveDownloadToDevice(
  url: string,
  filename: string,
  mimeType: string,
): Promise<SaveResult> {
  const target = new File(Paths.cache, filename);
  if (target.exists) target.delete();
  const downloaded = await File.downloadFileAsync(url, target);
  return saveToDevice(downloaded, mimeType);
}

/**
 * Saves a file that only exists as a uri — expo-print hands back a temporary
 * name like `.../Print/xyz.pdf`, so it is copied under a readable one first.
 */
export async function saveUriToDevice(uri: string, filename: string, mimeType: string): Promise<SaveResult> {
  const named = new File(Paths.cache, filename);
  if (named.exists) named.delete();
  await new File(uri).copy(named);
  return saveToDevice(named, mimeType);
}

/** What to tell the user once the save has finished (or not). */
export function saveMessage(result: SaveResult, t: Strings): string {
  switch (result) {
    case 'gallery':
      return t.savedToGallery;
    case 'folder':
      return t.savedToFolder;
    case 'files':
      return t.savedToFiles;
    case 'denied':
      return t.saveDenied;
    case 'cancelled':
      return t.saveCancelled;
  }
}

/** Writes text to the cache under `filename`, then saves it onto the device. */
export async function saveTextToDevice(
  filename: string,
  contents: string,
  mimeType: string,
): Promise<SaveResult> {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  file.write(contents);
  return saveToDevice(file, mimeType);
}
