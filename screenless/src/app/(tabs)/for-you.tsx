import { useExperience } from '../../experience';
import { JuniorForYou } from '../../junior/screens/JuniorForYou';
import { LittleForYou } from '../../little/screens/LittleForYou';
import { TeenForYou } from '../../teen/screens/TeenForYou';

/**
 * The tab of missions that exist only for this child.
 *
 * Like every other child facing route, it is a switch: the three tiers draw
 * the same numbers completely differently, and only the drawing differs.
 * `classic` has no version of its own, so it borrows the 6-9 one; no age
 * band maps to `classic` any more, and it exists only so an unreadable
 * stored profile renders something.
 */
export default function ForYouRoute() {
  const experience = useExperience();
  if (experience === 'little') return <LittleForYou />;
  if (experience === 'teen') return <TeenForYou />;
  return <JuniorForYou />;
}
