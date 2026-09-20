import { NativeModules } from 'react-native';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { roomObjectList } from '../data/room-objects';
import type { RoomObjectId } from '../state/types';

export type VisionLabel = { text: string; confidence: number };

type NativeLabeler = { label: (uri: string) => Promise<VisionLabel[]> };

/**
 * On device recognition needs a native module, so it is present in a real build
 * and absent in Expo Go. The module is read straight off `NativeModules` rather
 * than imported, because the package's default export is a proxy that throws on
 * any property access when the native side is missing.
 */
const nativeLabeler = (NativeModules as Record<string, unknown>).ImageLabeling as
  | NativeLabeler
  | undefined;

export const onDeviceVisionAvailable = typeof nativeLabeler?.label === 'function';

/**
 * Raw labeller output for one image, or an empty list when there is no native
 * module. Exposed so the outdoor finder can share this one lookup rather than
 * reaching for `NativeModules` a second time.
 */
export async function label(uri: string): Promise<VisionLabel[]> {
  if (!nativeLabeler) return [];
  try {
    return await nativeLabeler.label(uri);
  } catch (error) {
    if (__DEV__) console.warn('[vision] labelling failed', error);
    return [];
  }
}

/** Below this the labeller is guessing, and a wrong object ruins the mission. */
const MIN_CONFIDENCE = 0.45;
/** Labelling runs on a downscaled copy: same answers, far less memory. */
const ANALYSIS_WIDTH = 640;

/**
 * Maps one labeller output onto our object vocabulary. Everything the app does
 * not have a mission for (rooms, walls, "furniture") is dropped on the floor.
 */
export function matchLabels(labels: VisionLabel[]): RoomObjectId[] {
  const found = new Set<RoomObjectId>();
  for (const entry of labels) {
    if (entry.confidence < MIN_CONFIDENCE) continue;
    const text = entry.text.toLowerCase();
    for (const object of roomObjectList) {
      if (object.keywords.some((keyword) => text.includes(keyword))) found.add(object.id);
    }
  }
  return [...found];
}

/**
 * Reads one frame and returns the objects in it.
 *
 * The frame never leaves the phone: it is downscaled locally, handed to the
 * on device labeller, and both copies are deleted before this resolves.
 */
export async function detectObjects(uri: string): Promise<RoomObjectId[]> {
  if (!nativeLabeler) return [];

  let smallUri: string | null = null;
  try {
    const rendered = await ImageManipulator.manipulate(uri)
      .resize({ width: ANALYSIS_WIDTH })
      .renderAsync();
    const saved = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
    smallUri = saved.uri;

    return matchLabels(await label(smallUri));
  } catch (error) {
    if (__DEV__) console.warn('[vision] labelling failed', error);
    return [];
  } finally {
    discard(smallUri);
  }
}

/** Labels that mean the photo is of a screen rather than of the room. */
const SCREEN_WORDS = ['screen', 'monitor', 'television', 'laptop', 'computer', 'mobile phone', 'smartphone', 'tablet computer'];
/** A screen has to be clearly there to count, not a telly in the corner of a shot. */
const SCREEN_CONFIDENCE = 0.7;

export type PhotoRead = {
  /** Objects from the room vocabulary. */
  tags: RoomObjectId[];
  /** The labeller ran on this phone and recognised anything at all. */
  read: boolean;
  /** It thought the photo was of a screen: a picture of a picture. */
  screen: boolean;
};

/**
 * One pass of the labeller, read three ways, for the 6-9 photo check.
 *
 * `read` is deliberately loose. The labeller cannot judge a paper bridge, and
 * nobody wants it to; what it can establish is that a real scene was in front
 * of the camera. A photo of a phone showing a picture off the internet is the
 * one thing worth catching, and that is what `screen` is for.
 */
export async function readPhoto(uri: string): Promise<PhotoRead> {
  if (!nativeLabeler) return { tags: [], read: false, screen: false };

  let smallUri: string | null = null;
  try {
    const rendered = await ImageManipulator.manipulate(uri)
      .resize({ width: ANALYSIS_WIDTH })
      .renderAsync();
    const saved = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
    smallUri = saved.uri;

    const labels = await label(smallUri);
    return {
      tags: matchLabels(labels),
      read: labels.some((entry) => entry.confidence >= MIN_CONFIDENCE),
      screen: labels.some(
        (entry) =>
          entry.confidence >= SCREEN_CONFIDENCE &&
          SCREEN_WORDS.some((word) => entry.text.toLowerCase().includes(word)),
      ),
    };
  } catch (error) {
    if (__DEV__) console.warn('[vision] reading photo failed', error);
    return { tags: [], read: false, screen: false };
  } finally {
    discard(smallUri);
  }
}

/** Removes a temporary image. Failing to delete a cache file is not worth an error. */
export function discard(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // The cache directory is cleaned by the OS anyway.
  }
}
