import { Character } from '../types/game';

export const CHARACTERS: Character[] = [
  {
    id: 'alok',
    name: 'DJ Alok',
    title: 'Beat Maestro',
    skillName: 'Drop the Beat',
    skillCooldown: 45,
    skillDuration: 10,
    skillDesc: 'Creates a 5m rhythmic healing aura that restores 5 HP/sec and increases move speed by 15% for 10 seconds.',
    avatarUrl: '/src/assets/images/ff_character_alok_1790912315345.jpg',
    perk: '+15% Sprint Speed & +50 Total HP Heal'
  },
  {
    id: 'chrono',
    name: 'Chrono',
    title: 'Time Enforcer',
    skillName: 'Time Turner',
    skillCooldown: 60,
    skillDuration: 8,
    skillDesc: 'Creates an impenetrable electromagnetic force field dome that deflects 600 damage from incoming enemy bullets.',
    avatarUrl: '/src/assets/images/ff_character_alok_1790912315345.jpg',
    perk: 'Bulletproof Energy Shield'
  },
  {
    id: 'kelly',
    name: 'Kelly',
    title: 'Swift Runner',
    skillName: 'Dash',
    skillCooldown: 25,
    skillDuration: 6,
    skillDesc: 'Adrenaline surge increases maximum sprint speed by 25% and reduces incoming damage while sprinting by 10%.',
    avatarUrl: '/src/assets/images/ff_character_alok_1790912315345.jpg',
    perk: '+25% Overdrive Sprint Velocity'
  },
  {
    id: 'hayato',
    name: 'Hayato',
    title: 'Samurai Defender',
    skillName: 'Bushido',
    skillCooldown: 30,
    skillDuration: 10,
    skillDesc: 'For every 10% decrease in maximum HP, armor penetration increases by 10% and front damage is reduced by 5%.',
    avatarUrl: '/src/assets/images/ff_character_alok_1790912315345.jpg',
    perk: '+Bushido Lethal Armor Piercing'
  }
];
