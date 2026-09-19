import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { findKinds } from '../data/finds';
import type { FindKindId } from '../state/types';
import { label, onDeviceVisionAvailable, type VisionLabel } from './detector';

/**
 * Recognising what a child is pointing at outdoors.
 *
 * This asks the labeller for far less than the room scanner does. It only has
 * to answer "plant, creature, sky or stone", which the built in model is good
 * at, and it is allowed to answer "I have no idea" without breaking anything:
 * the child simply picks the card themselves. Nothing downstream depends on it
 * being right, so nothing downstream breaks when it is wrong.
 */

/** A named kind is worth having at lower confidence than a generic one. */
const STRONG_CONFIDENCE = 0.4;
const WEAK_CONFIDENCE = 0.55;
/** Outdoor scenes are busy, so the frame is kept a little larger than a scan. */
const ANALYSIS_WIDTH = 800;

export type FindGuess = {
  kind: FindKindId;
  /** The labeller's own words, kept so a parent can see what the phone thought. */
  label: string;
  confidence: number;
};

/**
 * Picks one kind out of a set of labels.
 *
 * Labels are read strongest first. A keyword that names a kind outright wins
 * immediately; the vaguer ones only get a say once nothing specific has
 * matched, which stops a photo of a leaf coming back as "plant".
 */
export function matchFindKind(labels: VisionLabel[]): FindGuess | null {
  const ranked = [...labels].sort((a, b) => b.confidence - a.confidence);

  for (const entry of ranked) {
    if (entry.confidence < STRONG_CONFIDENCE) break;
    const text = entry.text.toLowerCase();
    for (const kind of findKinds) {
      if (kind.keywords.some((keyword) => text.includes(keyword))) {
        return { kind: kind.id, label: entry.text, confidence: entry.confidence };
      }
    }
  }

  for (const entry of ranked) {
    if (entry.confidence < WEAK_CONFIDENCE) break;
    const text = entry.text.toLowerCase();
    for (const kind of findKinds) {
      if (kind.weak.some((keyword) => text.includes(keyword))) {
        return { kind: kind.id, label: entry.text, confidence: entry.confidence };
      }
    }
  }

  return null;
}

/**
 * Looks at one photo and guesses what the child found.
 *
 * Returns null whenever it is not sure, which is a perfectly good outcome: the
 * caller shows the twelve cards and lets the child say. The photo itself never
 * leaves the phone, and the downscaled copy used for labelling is deleted here.
 */
export async function guessFind(uri: string): Promise<FindGuess | null> {
  if (!onDeviceVisionAvailable) return null;

  let smallUri: string | null = null;
  try {
    const rendered = await ImageManipulator.manipulate(uri).resize({ width: ANALYSIS_WIDTH }).renderAsync();
    const saved = await rendered.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
    smallUri = saved.uri;

    return matchFindKind(await label(smallUri));
  } catch (error) {
    if (__DEV__) console.warn('[finder] guess failed', error);
    return null;
  } finally {
    if (smallUri) remove(smallUri);
  }
}

/* --------------------------------------------------------------- the album */

/**
 * Where a child's own photographs live.
 *
 * Everything else the camera touches is deleted within seconds. These are the
 * exception, because the photo is the point: it becomes the picture on the
 * collection card and the frame in the tree strip. It is copied out of the
 * camera cache, which the system is free to empty, into the app's own folder,
 * which it is not. It still never leaves the phone, it is still covered by the
 * parent's export and by "delete everything", and there is no gallery write,
 * so nothing appears in the phone's photo roll either.
 */
const ALBUM = 'finds';

function album(): Directory {
  const directory = new Directory(Paths.document, ALBUM);
  // `idempotent` as well as the guard: the check and the call are two separate
  // trips to the filesystem, and an album that already exists is not an error.
  if (!directory.exists) directory.create({ intermediates: true, idempotent: true });
  return directory;
}

/**
 * Copies a camera frame into the album and returns the lasting uri.
 *
 * Falls back to the original uri if the copy fails. A find with a photo that
 * later disappears is a card without a picture, which is survivable; losing the
 * find itself over a filesystem hiccup is not.
 */
export function keepPhoto(uri: string, prefix = 'find'): string {
  try {
    const source = new File(uri);
    if (!source.exists) return uri;

    const extension = source.extension || '.jpg';
    const name = `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}${extension}`;
    const destination = new File(album(), name);
    source.copy(destination);
    return destination.uri;
  } catch (error) {
    if (__DEV__) console.warn('[finder] could not keep photo', error);
    return uri;
  }
}

/** Deletes one kept photo. Used when a find is removed or the app is reset. */
export function remove(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // A stray image in the app's own folder goes with the app when it is
    // uninstalled, so failing to delete one is not worth surfacing.
  }
}

/** Empties the album. Part of wiping the app from the parent area. */
export function clearAlbum(): void {
  try {
    const directory = new Directory(Paths.document, ALBUM);
    if (directory.exists) directory.delete();
  } catch (error) {
    if (__DEV__) console.warn('[finder] could not clear album', error);
  }
}
