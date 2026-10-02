import { WeaponData, WeaponType } from '../types/game';

export const WEAPON_REGISTRY: Record<WeaponType, WeaponData> = {
  ak47: {
    id: 'ak47',
    name: 'AK47',
    category: 'AR',
    damage: 38,
    headshotMultiplier: 2.2,
    fireRate: 8.5, // 8.5 rps
    magazineSize: 30,
    currentAmmo: 30,
    reserveAmmo: 120,
    reloadTime: 2.1,
    range: 90,
    spread: 0.035,
    color: '#d97706',
    scopeZoom: 2,
    description: 'High caliber assault rifle with massive firepower and iconic recoil.'
  },
  mp40: {
    id: 'mp40',
    name: 'MP40',
    category: 'SMG',
    damage: 22,
    headshotMultiplier: 2.0,
    fireRate: 15.0, // 15 rps (lightning fast!)
    magazineSize: 28,
    currentAmmo: 28,
    reserveAmmo: 160,
    reloadTime: 1.6,
    range: 45,
    spread: 0.055,
    color: '#06b6d4',
    scopeZoom: 1.3,
    description: 'Legendary submachine gun with extreme close-range burst rate.'
  },
  awm: {
    id: 'awm',
    name: 'AWM',
    category: 'SNIPER',
    damage: 150,
    headshotMultiplier: 3.0, // 450 instant kill!
    fireRate: 1.1,
    magazineSize: 5,
    currentAmmo: 5,
    reserveAmmo: 25,
    reloadTime: 2.8,
    range: 220,
    spread: 0.005,
    color: '#10b981',
    scopeZoom: 4,
    description: 'Devastating bolt-action military sniper rifle for supreme long-distance kills.'
  },
  m1887: {
    id: 'm1887',
    name: 'M1887',
    category: 'SHOTGUN',
    damage: 100, // pellet spread total
    headshotMultiplier: 1.8,
    fireRate: 2.2,
    magazineSize: 2,
    currentAmmo: 2,
    reserveAmmo: 40,
    reloadTime: 1.8,
    range: 25,
    spread: 0.09,
    color: '#ef4444',
    scopeZoom: 1,
    description: 'High-impact double-barrel shotgun. Lethal at point-blank range.'
  },
  pan: {
    id: 'pan',
    name: 'Pan',
    category: 'MELEE',
    damage: 65,
    headshotMultiplier: 1.5,
    fireRate: 1.8,
    magazineSize: 1,
    currentAmmo: 1,
    reserveAmmo: 1,
    reloadTime: 0.1,
    range: 4,
    spread: 0.01,
    color: '#94a3b8',
    scopeZoom: 1,
    description: 'Bulletproof frying pan that deflects shots from behind and bashes foes.'
  }
};
