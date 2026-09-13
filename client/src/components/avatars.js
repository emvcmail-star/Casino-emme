import { Crown, Spade, Club, Diamond, Heart, Gem, Flame, Rocket, Trophy, Ghost } from 'lucide-react';

export const AVATAR_ICONS = {
  crown: Crown,
  spade: Spade,
  club: Club,
  diamond: Diamond,
  heart: Heart,
  gem: Gem,
  flame: Flame,
  rocket: Rocket,
  trophy: Trophy,
  ghost: Ghost,
};

export const AVATAR_KEYS = Object.keys(AVATAR_ICONS);

export function initialOf(username) {
  return (username || '?').trim().charAt(0).toUpperCase() || '?';
}
