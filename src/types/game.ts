export type WeaponType = 'ak47' | 'mp40' | 'awm' | 'm1887' | 'pan';

export interface WeaponData {
  id: WeaponType;
  name: string;
  category: 'AR' | 'SMG' | 'SNIPER' | 'SHOTGUN' | 'MELEE';
  damage: number;
  headshotMultiplier: number;
  fireRate: number; // bullets per sec
  magazineSize: number;
  currentAmmo: number;
  reserveAmmo: number;
  reloadTime: number; // seconds
  range: number;
  spread: number;
  color: string;
  scopeZoom: number; // 1 for none, 2 for AR, 4 for AWM
  description: string;
}

export interface Character {
  id: string;
  name: string;
  title: string;
  skillName: string;
  skillCooldown: number; // seconds
  skillDuration: number;
  skillDesc: string;
  avatarUrl: string;
  perk: string;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  ep: number;
  maxEp: number;
  armorLevel: number; // 0, 1, 2, 3
  helmetLevel: number;
  medkits: number;
  glooWalls: number;
  activeWeaponIndex: number;
  weapons: (WeaponData | null)[];
  isReloading: boolean;
  reloadProgress: number;
  isHealing: boolean;
  healProgress: number;
  isScoped: boolean;
  isSprinting: boolean;
  isCrouching: boolean;
  skillActive: boolean;
  skillTimeLeft: number;
  skillCooldownLeft: number;
  inVehicle: boolean;
  currentVehicleId?: string;
  vehicleSpeed?: number;
  vehicleHp?: number;
  vehicleMaxHp?: number;
  vehicleFuel?: number;
}

export type VehicleType = 'jeep' | 'sportscar' | 'bike';

export interface Vehicle {
  id: string;
  type: VehicleType;
  name: string;
  position: { x: number; y: number; z: number };
  rotationY: number;
  speed: number;
  steerAngle: number;
  hp: number;
  maxHp: number;
  fuel: number;
  maxSpeed: number;
  acceleration: number;
  reverseSpeed: number;
  turnSpeed: number;
  isOccupied: boolean;
  color: string;
}

export interface EnemyBot {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotationY: number;
  hp: number;
  maxHp: number;
  weapon: WeaponType;
  isAlive: boolean;
  targetPos: { x: number; y: number; z: number };
  state: 'patrol' | 'chase' | 'attack' | 'flee';
  lastShotTime: number;
  color: number;
}

export interface LootItem {
  id: string;
  type: 'weapon' | 'ammo' | 'medkit' | 'gloo' | 'armor';
  weaponId?: WeaponType;
  name: string;
  amount?: number;
  position: { x: number; y: number; z: number };
}

export interface GlooWallObject {
  id: string;
  position: { x: number; y: number; z: number };
  rotationY: number;
  hp: number;
  maxHp: number;
  createdTime: number;
}

export interface DamageNumber {
  id: string;
  amount: number;
  isHeadshot: boolean;
  position: { x: number; y: number; z: number };
  screenX?: number;
  screenY?: number;
  opacity: number;
  scale: number;
}

export interface KillFeedEntry {
  id: string;
  killer: string;
  victim: string;
  weapon: string;
  isHeadshot: boolean;
  isPlayerKill: boolean; // Player secured the elimination
  isPlayerVictim?: boolean; // Player was eliminated
  timestamp: number;
}

export interface DamageIndicator {
  id: string;
  attackerPos: { x: number; z: number };
  timestamp: number;
  opacity: number;
  damage: number;
}

export interface SafeZoneState {
  currentCenter: { x: number; z: number };
  currentRadius: number;
  targetCenter: { x: number; z: number };
  targetRadius: number;
  phase: number;
  maxPhases: number;
  shrinkTimer: number; // seconds until next shrink
  isShrinking: boolean;
  damagePerSec: number;
}

export interface GameSettings {
  mouseSensitivity: number;
  soundVolume: number;
  musicVolume: number;
  fieldOfView: number;
  viewMode: 'tpp' | 'fpp';
  graphicsQuality: 'high' | 'medium' | 'low';
}
