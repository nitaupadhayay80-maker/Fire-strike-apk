import * as THREE from 'three';
import { ThreeEngine, HitResult } from './threeEngine';
import {
  PlayerStats,
  EnemyBot,
  LootItem,
  GlooWallObject,
  DamageNumber,
  DamageIndicator,
  KillFeedEntry,
  SafeZoneState,
  WeaponType,
  WeaponData,
  GameSettings,
  Vehicle,
} from '../types/game';
import { WEAPON_REGISTRY } from '../data/weapons';
import { soundManager } from '../audio/soundManager';

export class GameController {
  public engine: ThreeEngine;
  public settings: GameSettings;
  public isRunning: boolean = false;
  public isGameOver: boolean = false;
  public isVictory: boolean = false;

  // Player State
  public playerStats: PlayerStats;
  public playerPos: { x: number; y: number; z: number } = { x: 0, y: 0, z: 25 };
  public playerVelocity: THREE.Vector3 = new THREE.Vector3();
  public isGrounded: boolean = true;
  public keysPressed: Record<string, boolean> = {};
  public isFiring: boolean = false;
  private lastFireTime: number = 0;

  // Vehicles
  public vehicles: Vehicle[] = [];
  public nearbyVehicleId: string | null = null;

  // Enemies & World State
  public enemies: EnemyBot[] = [];
  public lootItems: LootItem[] = [];
  public glooWalls: GlooWallObject[] = [];
  public damageNumbers: DamageNumber[] = [];
  public damageIndicators: DamageIndicator[] = [];
  public killFeed: KillFeedEntry[] = [];
  public aliveCount: number = 50;
  public playerKills: number = 0;
  public totalDamageDealt: number = 0;
  public matchTime: number = 0;

  // Safe Zone
  public safeZone: SafeZoneState = {
    currentCenter: { x: 0, z: 10 },
    currentRadius: 150,
    targetCenter: { x: 5, z: 0 },
    targetRadius: 90,
    phase: 1,
    maxPhases: 4,
    shrinkTimer: 75,
    isShrinking: false,
    damagePerSec: 4,
  };

  // Bot names for realistic Free Fire lobby
  private botNames: string[] = [
    '꧁Hêadshøt꧂', '⚡Thunder_Pro⚡', 'Bermuda_King', 'CR7_Strike', 'Ninja_Girl',
    'Bad_Boy_99', 'Skyler_Pro', 'Kla_MuayThai', 'Moco_Hacker', 'Kelly_Sprint',
    'Vampire_FF', 'ShadowHunter', 'FreeFire_Legend', 'Alok_Fan', 'RaiStar_Vibe'
  ];

  // Callbacks for React HUD
  public onStateUpdate?: () => void;
  public onGameOver?: (isWin: boolean, kills: number, damage: number, survivalTime: number) => void;

  constructor(engine: ThreeEngine, settings: GameSettings) {
    this.engine = engine;
    this.settings = settings;

    // Initial loadout
    const ak = JSON.parse(JSON.stringify(WEAPON_REGISTRY.ak47)) as WeaponData;
    const mp = JSON.parse(JSON.stringify(WEAPON_REGISTRY.mp40)) as WeaponData;
    const pan = JSON.parse(JSON.stringify(WEAPON_REGISTRY.pan)) as WeaponData;

    this.playerStats = {
      hp: 200,
      maxHp: 200,
      ep: 150,
      maxEp: 200,
      armorLevel: 2,
      helmetLevel: 2,
      medkits: 3,
      glooWalls: 3,
      activeWeaponIndex: 0,
      weapons: [ak, mp, pan],
      isReloading: false,
      reloadProgress: 0,
      isHealing: false,
      healProgress: 0,
      isScoped: false,
      isSprinting: false,
      isCrouching: false,
      skillActive: false,
      skillTimeLeft: 0,
      skillCooldownLeft: 0,
      inVehicle: false,
      currentVehicleId: undefined,
      vehicleSpeed: 0,
      vehicleHp: 0,
      vehicleMaxHp: 0,
      vehicleFuel: 100,
    };

    this.engine.viewMode = settings.viewMode;
    this.spawnInitialLoot();
    this.spawnInitialEnemies();
    this.spawnInitialVehicles();
  }

  // Populate map with weapons, ammo, medkits, and gloo walls
  private spawnInitialLoot() {
    const lootTypes: { type: LootItem['type']; weaponId?: WeaponType; name: string }[] = [
      { type: 'weapon', weaponId: 'awm', name: 'AWM Sniper Rifle' },
      { type: 'weapon', weaponId: 'm1887', name: 'M1887 Shotgun' },
      { type: 'weapon', weaponId: 'ak47', name: 'AK47 AR' },
      { type: 'weapon', weaponId: 'mp40', name: 'MP40 SMG' },
      { type: 'medkit', name: 'First Aid Medkit' },
      { type: 'gloo', name: 'Gloo Wall Grenade' },
      { type: 'ammo', name: 'Heavy AR Ammo (x60)' },
      { type: 'ammo', name: 'Sniper Ammo (x10)' },
    ];

    const spawnSpots = [
      { x: 3, z: 22 },
      { x: -12, z: 8 },
      { x: 15, z: -12 },
      { x: -68, z: -52 },
      { x: 60, z: -35 },
      { x: -32, z: 38 },
      { x: 42, z: 46 },
      { x: -48, z: -12 },
      { x: 28, z: -75 },
      { x: 2, z: 58 },
      { x: -18, z: -18 },
      { x: 20, z: 20 },
    ];

    spawnSpots.forEach((spot, i) => {
      const sample = lootTypes[i % lootTypes.length];
      this.lootItems.push({
        id: `loot_${i}_${Date.now()}`,
        type: sample.type,
        weaponId: sample.weaponId,
        name: sample.name,
        amount: sample.type === 'ammo' ? 60 : 1,
        position: { x: spot.x, y: 0.1, z: spot.z },
      });
    });
  }

  // Spawn AI bots in compounds across Bermuda
  private spawnInitialEnemies() {
    const enemyColors = [0xd97706, 0xdc2626, 0x4f46e5, 0x059669, 0x9333ea, 0xe11d48];
    const spawnLocations = [
      { x: -28, z: 12 },
      { x: 25, z: 30 },
      { x: -65, z: -35 },
      { x: 50, z: -25 },
      { x: -10, z: -50 },
      { x: 18, z: -60 },
      { x: -45, z: 55 },
      { x: 38, z: 65 },
      { x: -80, z: 15 },
      { x: 75, z: 10 },
      { x: 0, z: -30 },
    ];

    spawnLocations.forEach((loc, idx) => {
      const name = this.botNames[idx % this.botNames.length];
      const weapon: WeaponType = idx % 2 === 0 ? 'ak47' : 'mp40';
      const bot: EnemyBot = {
        id: `bot_${idx}`,
        name,
        position: { x: loc.x, y: 0, z: loc.z },
        rotationY: Math.random() * Math.PI * 2,
        hp: 180,
        maxHp: 180,
        weapon,
        isAlive: true,
        targetPos: { x: loc.x, y: 0, z: loc.z },
        state: 'patrol',
        lastShotTime: 0,
        color: enemyColors[idx % enemyColors.length],
      };
      this.enemies.push(bot);
    });
  }

  public start() {
    this.isRunning = true;
    this.isGameOver = false;
    this.isVictory = false;
  }

  public stop() {
    this.isRunning = false;
  }

  // Active Weapon Getter
  public getActiveWeapon(): WeaponData | null {
    return this.playerStats.weapons[this.playerStats.activeWeaponIndex];
  }

  // Switch Active Weapon slot (1, 2, 3)
  public selectWeaponSlot(index: number) {
    if (index >= 0 && index < this.playerStats.weapons.length && this.playerStats.weapons[index]) {
      this.playerStats.activeWeaponIndex = index;
      this.playerStats.isReloading = false;
      this.playerStats.reloadProgress = 0;
      const w = this.getActiveWeapon();
      if (w) {
        this.engine.rebuildWeaponMesh(w.id);
        soundManager.playGunshot('mp40'); // Quick weapon equip click
      }
    }
  }

  // Reload current weapon
  public reloadCurrentWeapon() {
    const w = this.getActiveWeapon();
    if (!w || this.playerStats.isReloading || w.currentAmmo === w.magazineSize || w.reserveAmmo <= 0) {
      return;
    }
    this.playerStats.isReloading = true;
    this.playerStats.reloadProgress = 0;
    soundManager.playReload();
  }

  // Deploy iconic Gloo Wall (ग्लू वाल)
  public deployGlooWall() {
    if (this.playerStats.glooWalls <= 0) return;

    this.playerStats.glooWalls--;
    soundManager.playGlooWallDeploy();

    // Place wall 2.8m in front of player
    const spawnDist = 2.8;
    const yaw = this.engine.cameraYaw;
    const wallX = this.playerPos.x + Math.sin(yaw) * spawnDist;
    const wallZ = this.playerPos.z + Math.cos(yaw) * spawnDist;

    const wall: GlooWallObject = {
      id: `gloo_${Date.now()}`,
      position: { x: wallX, y: 0, z: wallZ },
      rotationY: yaw,
      hp: 400,
      maxHp: 400,
      createdTime: Date.now(),
    };

    this.glooWalls.push(wall);
    this.engine.spawnGlooWall(wall);

    // Auto despawn after 35 seconds
    setTimeout(() => {
      this.removeGlooWall(wall.id);
    }, 35000);
  }

  private removeGlooWall(id: string) {
    const idx = this.glooWalls.findIndex((w) => w.id === id);
    if (idx !== -1) {
      this.glooWalls.splice(idx, 1);
      this.engine.removeGlooWall(id);
    }
  }

  // Use First Aid Medkit
  public useMedkit() {
    if (this.playerStats.medkits <= 0 || this.playerStats.hp >= this.playerStats.maxHp || this.playerStats.isHealing) {
      return;
    }
    this.playerStats.isHealing = true;
    this.playerStats.healProgress = 0;
    soundManager.playMedkit();
  }

  // Activate DJ Alok / Character Skill
  public activateCharacterSkill() {
    if (this.playerStats.skillCooldownLeft > 0 || this.playerStats.skillActive) return;

    this.playerStats.skillActive = true;
    this.playerStats.skillTimeLeft = 10;
    this.playerStats.skillCooldownLeft = 45;
    soundManager.playAlokSkill();
  }

  // Shoot weapon
  public shoot() {
    const w = this.getActiveWeapon();
    if (!w || this.playerStats.isReloading || this.playerStats.isHealing) return;

    const now = performance.now() / 1000;
    const fireInterval = 1 / w.fireRate;
    if (now - this.lastFireTime < fireInterval) return;

    if (w.currentAmmo <= 0) {
      this.reloadCurrentWeapon();
      return;
    }

    w.currentAmmo--;
    this.lastFireTime = now;

    // Sound effect
    soundManager.playGunshot(w.id === 'pan' ? 'm1887' : w.id);
    this.engine.triggerMuzzleFlash();

    // Raycast bullet
    const spread = this.playerStats.isScoped ? w.spread * 0.25 : w.spread;
    const hitResult: HitResult = this.engine.castBullet(spread, w.range);

    // Tracer line
    const barrelPos = this.engine.playerGroup.position.clone().add(new THREE.Vector3(0.2, 1.2, 0.4));
    if (hitResult.point) {
      this.engine.spawnBulletTracer(barrelPos, hitResult.point);
      this.engine.spawnImpactSparks(
        hitResult.point,
        hitResult.targetType === 'enemy' ? 0xff2222 : 0x00ffff
      );
    }

    // Process Hit
    if (hitResult.hit && hitResult.targetType === 'enemy' && hitResult.enemyId) {
      const enemy = this.enemies.find((e) => e.id === hitResult.enemyId);
      if (enemy && enemy.isAlive) {
        soundManager.playHitConfirm();
        if (hitResult.isHeadshot) {
          soundManager.playHeadshotDing();
        }

        const rawDmg = hitResult.isHeadshot ? w.damage * w.headshotMultiplier : w.damage;
        const damage = Math.round(rawDmg);
        enemy.hp -= damage;
        this.totalDamageDealt += damage;

        // Spawn floating damage text
        const hitCoord = hitResult.point || new THREE.Vector3(enemy.position.x, 1.5, enemy.position.z);
        this.addDamageNumber(damage, hitResult.isHeadshot || false, hitCoord);

        // Bot died
        if (enemy.hp <= 0) {
          this.eliminateEnemy(enemy, true, w.name, hitResult.isHeadshot || false);
        }
      }
    } else if (hitResult.hit && hitResult.targetType === 'gloo') {
      soundManager.playHitConfirm();
    }
  }

  // Add floating damage number over hit
  private addDamageNumber(amount: number, isHeadshot: boolean, worldPos: THREE.Vector3) {
    const screenCoord = this.engine.toScreenXY(worldPos);
    this.damageNumbers.push({
      id: `dmg_${Date.now()}_${Math.random()}`,
      amount,
      isHeadshot,
      position: { x: worldPos.x, y: worldPos.y, z: worldPos.z },
      screenX: screenCoord.x,
      screenY: screenCoord.y,
      opacity: 1,
      scale: isHeadshot ? 1.5 : 1.0,
    });
  }

  // Handle enemy death
  private eliminateEnemy(enemy: EnemyBot, isPlayerKill: boolean, weaponName: string, isHeadshot: boolean) {
    enemy.isAlive = false;
    enemy.hp = 0;
    this.aliveCount = Math.max(1, this.aliveCount - 1);

    if (isPlayerKill) {
      this.playerKills++;
      this.killFeed.unshift({
        id: `kill_${Date.now()}`,
        killer: 'You',
        victim: enemy.name,
        weapon: weaponName,
        isHeadshot,
        isPlayerKill: true,
        timestamp: Date.now(),
      });
    }

    // Drop death loot crate
    this.lootItems.push({
      id: `drop_${Date.now()}`,
      type: 'medkit',
      name: 'First Aid Kit (Survivor Drop)',
      position: { x: enemy.position.x, y: 0.1, z: enemy.position.z },
    });
    this.lootItems.push({
      id: `drop_gloo_${Date.now()}`,
      type: 'gloo',
      name: 'Gloo Wall Grenade (Drop)',
      position: { x: enemy.position.x + 0.8, y: 0.1, z: enemy.position.z },
    });

    // Check for Victory!
    if (this.aliveCount <= 1) {
      this.triggerVictory();
    }
  }

  // Loot pickup check
  private checkLootPickup() {
    for (let i = this.lootItems.length - 1; i >= 0; i--) {
      const item = this.lootItems[i];
      const dx = this.playerPos.x - item.position.x;
      const dz = this.playerPos.z - item.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 2.2) {
        // Collect item
        let collected = false;
        if (item.type === 'medkit') {
          this.playerStats.medkits++;
          collected = true;
        } else if (item.type === 'gloo') {
          this.playerStats.glooWalls++;
          collected = true;
        } else if (item.type === 'ammo') {
          const w = this.getActiveWeapon();
          if (w) w.reserveAmmo += 60;
          collected = true;
        } else if (item.type === 'weapon' && item.weaponId) {
          const newW = JSON.parse(JSON.stringify(WEAPON_REGISTRY[item.weaponId])) as WeaponData;
          this.playerStats.weapons[1] = newW; // Equip in slot 2
          this.playerStats.activeWeaponIndex = 1;
          this.engine.rebuildWeaponMesh(newW.id);
          collected = true;
        }

        if (collected) {
          soundManager.playPickup();
          this.lootItems.splice(i, 1);
        }
      }
    }
  }

  // Update Game Loop
  public update(delta: number) {
    if (!this.isRunning || this.isGameOver) return;
    this.matchTime += delta;

    // 1. Process Vehicles (physics, driving, collisions)
    this.updateVehicles(delta);

    // 2. Process Player Movement & Firing (only if on foot)
    if (!this.playerStats.inVehicle) {
      this.updatePlayerMovement(delta);

      if (this.isFiring) {
        this.shoot();
      }
    }

    // 3. Reloading timer
    if (this.playerStats.isReloading) {
      const w = this.getActiveWeapon();
      if (w) {
        this.playerStats.reloadProgress += delta / w.reloadTime;
        if (this.playerStats.reloadProgress >= 1) {
          const needed = w.magazineSize - w.currentAmmo;
          const take = Math.min(needed, w.reserveAmmo);
          w.currentAmmo += take;
          w.reserveAmmo -= take;
          this.playerStats.isReloading = false;
          this.playerStats.reloadProgress = 0;
        }
      }
    }

    // 4. Healing timer
    if (this.playerStats.isHealing) {
      this.playerStats.healProgress += delta / 3.0; // 3 seconds to heal
      if (this.playerStats.healProgress >= 1) {
        this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + 75);
        this.playerStats.medkits = Math.max(0, this.playerStats.medkits - 1);
        this.playerStats.isHealing = false;
        this.playerStats.healProgress = 0;
      }
    }

    // 5. EP to HP gradual conversion (Free Fire signature mechanism!)
    if (this.playerStats.hp < this.playerStats.maxHp && this.playerStats.ep > 0) {
      const epConvert = delta * 2; // 2 EP converted per sec
      const hpGain = Math.min(this.playerStats.maxHp - this.playerStats.hp, epConvert);
      this.playerStats.ep = Math.max(0, this.playerStats.ep - hpGain);
      this.playerStats.hp += hpGain;
    }

    // 6. Character Skill Tick (Alok Drop The Beat)
    if (this.playerStats.skillActive) {
      this.playerStats.skillTimeLeft -= delta;
      // Heal 5 HP/sec
      this.playerStats.hp = Math.min(this.playerStats.maxHp, this.playerStats.hp + 5 * delta);
      if (this.playerStats.skillTimeLeft <= 0) {
        this.playerStats.skillActive = false;
      }
    }
    if (this.playerStats.skillCooldownLeft > 0) {
      this.playerStats.skillCooldownLeft = Math.max(0, this.playerStats.skillCooldownLeft - delta);
    }

    // 7. Safe Zone Logic
    this.updateSafeZone(delta);

    // 8. Enemy AI logic
    this.updateEnemies(delta);

    // 9. Simulated background eliminations
    this.updateSimulatedCombat(delta);

    // 10. Check Loot items
    this.checkLootPickup();
    this.engine.syncLootMeshes(this.lootItems);

    // 11. Update Floating Damage Numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.opacity -= delta * 1.3;
      d.position.y += delta * 1.5;
      const screenCoord = this.engine.toScreenXY(new THREE.Vector3(d.position.x, d.position.y, d.position.z));
      d.screenX = screenCoord.x;
      d.screenY = screenCoord.y;
      if (d.opacity <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }

    // 12. Update Directional Damage Hit Indicators
    for (let i = this.damageIndicators.length - 1; i >= 0; i--) {
      const ind = this.damageIndicators[i];
      ind.opacity -= delta * 0.75; // Fades smoothly over ~1.3s
      if (ind.opacity <= 0) {
        this.damageIndicators.splice(i, 1);
      }
    }

    // 13. Engine update (3D visual sync)
    const isMoving = Math.abs(this.playerVelocity.x) > 0.1 || Math.abs(this.playerVelocity.z) > 0.1;
    const activeVeh = this.playerStats.inVehicle && this.playerStats.currentVehicleId
      ? this.vehicles.find((v) => v.id === this.playerStats.currentVehicleId)
      : null;

    this.engine.update(
      delta,
      this.playerPos,
      isMoving,
      this.playerStats.isSprinting,
      this.playerStats.isCrouching,
      this.playerStats.skillActive,
      this.safeZone,
      this.playerStats.inVehicle,
      activeVeh?.rotationY
    );

    // 14. Notify React HUD
    if (this.onStateUpdate) {
      this.onStateUpdate();
    }
  }

  // Safe Zone storm shrink
  private updateSafeZone(delta: number) {
    this.safeZone.shrinkTimer -= delta;

    if (this.safeZone.shrinkTimer <= 0) {
      if (!this.safeZone.isShrinking) {
        // Start shrinking to target
        this.safeZone.isShrinking = true;
      }

      // Smoothly shrink radius towards target
      const shrinkSpeed = 3.5 * delta;
      if (this.safeZone.currentRadius > this.safeZone.targetRadius) {
        this.safeZone.currentRadius = Math.max(
          this.safeZone.targetRadius,
          this.safeZone.currentRadius - shrinkSpeed
        );
      } else {
        // Phase finished, set next phase
        this.safeZone.phase++;
        this.safeZone.isShrinking = false;
        this.safeZone.shrinkTimer = 60;
        this.safeZone.targetRadius = Math.max(15, this.safeZone.currentRadius - 35);
        this.safeZone.damagePerSec += 3;
      }
    }

    // Check if player is outside safe zone
    const distToCenter = Math.sqrt(
      Math.pow(this.playerPos.x - this.safeZone.currentCenter.x, 2) +
      Math.pow(this.playerPos.z - this.safeZone.currentCenter.z, 2)
    );

    if (distToCenter > this.safeZone.currentRadius) {
      // Outside storm: take damage
      const dmg = this.safeZone.damagePerSec * delta;
      this.playerStats.hp -= dmg;
      soundManager.playZoneDamage();

      if (this.playerStats.hp <= 0) {
        this.triggerDefeat();
      }
    }
  }

  // Update Player Movement & Collisions
  private updatePlayerMovement(delta: number) {
    let moveForward = 0;
    let moveRight = 0;

    if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) moveForward += 1;
    if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) moveForward -= 1;
    if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) moveRight -= 1;
    if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) moveRight += 1;

    this.playerStats.isSprinting = !!this.keysPressed['ShiftLeft'] || !!this.keysPressed['ShiftRight'];
    this.playerStats.isCrouching = !!this.keysPressed['KeyC'];

    let speed = 6.2; // Base walk speed
    if (this.playerStats.isSprinting) speed = 10.5;
    if (this.playerStats.isCrouching) speed = 3.8;
    if (this.playerStats.skillActive) speed *= 1.15; // Alok speed boost

    const forwardDir = new THREE.Vector3(
      Math.sin(this.engine.cameraYaw),
      0,
      Math.cos(this.engine.cameraYaw)
    ).normalize();

    const rightDir = new THREE.Vector3(
      Math.cos(this.engine.cameraYaw),
      0,
      -Math.sin(this.engine.cameraYaw)
    ).normalize();

    const moveVector = new THREE.Vector3();
    if (moveForward !== 0 || moveRight !== 0) {
      moveVector.addScaledVector(forwardDir, moveForward);
      moveVector.addScaledVector(rightDir, moveRight);
      moveVector.normalize().multiplyScalar(speed);
    }

    // Apply horizontal velocity with smooth damping
    this.playerVelocity.x += (moveVector.x - this.playerVelocity.x) * 0.25;
    this.playerVelocity.z += (moveVector.z - this.playerVelocity.z) * 0.25;

    // Jump physics
    if (this.keysPressed['Space'] && this.isGrounded) {
      this.playerVelocity.y = 8.5;
      this.isGrounded = false;
    }

    // Gravity
    this.playerVelocity.y -= 22 * delta;

    // Apply movement
    this.playerPos.x += this.playerVelocity.x * delta;
    this.playerPos.y += this.playerVelocity.y * delta;
    this.playerPos.z += this.playerVelocity.z * delta;

    // Ground check
    if (this.playerPos.y <= 0) {
      this.playerPos.y = 0;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }

    // Island boundary clamp
    this.playerPos.x = Math.max(-280, Math.min(280, this.playerPos.x));
    this.playerPos.z = Math.max(-280, Math.min(280, this.playerPos.z));
  }

  // Update Enemy AI Bots
  private updateEnemies(delta: number) {
    const now = performance.now() / 1000;

    this.enemies.forEach((bot) => {
      if (!bot.isAlive) {
        this.engine.updateEnemyMesh(bot.id, bot.position, bot.rotationY, bot.color, false);
        return;
      }

      const dx = this.playerPos.x - bot.position.x;
      const dz = this.playerPos.z - bot.position.z;
      const distToPlayer = Math.sqrt(dx * dx + dz * dz);

      // AI States: Patrol, Chase, Shoot
      if (distToPlayer < 45) {
        bot.state = 'attack';
        // Face player
        bot.rotationY = Math.atan2(dx, dz);

        // Shoot at player
        if (now - bot.lastShotTime > (bot.weapon === 'mp40' ? 0.35 : 0.75)) {
          bot.lastShotTime = now;
          soundManager.playGunshot(bot.weapon === 'pan' ? 'm1887' : bot.weapon);

          // Bullet tracer towards player
          const botBarrel = new THREE.Vector3(bot.position.x, 1.2, bot.position.z);
          const aimPos = new THREE.Vector3(
            this.playerPos.x + (Math.random() - 0.5) * 1.5,
            this.playerPos.y + 1.2 + (Math.random() - 0.5) * 0.8,
            this.playerPos.z + (Math.random() - 0.5) * 1.5
          );
          this.engine.spawnBulletTracer(botBarrel, aimPos);

          // Did it hit player?
          const hitChance = Math.max(0.2, 0.6 - distToPlayer * 0.01);
          if (Math.random() < hitChance) {
            const rawDmg = bot.weapon === 'mp40' ? 14 : 22;
            this.registerPlayerDamage(
              rawDmg,
              { x: bot.position.x, z: bot.position.z },
              bot.name,
              bot.weapon.toUpperCase()
            );
          }
        }

        // Advance towards player if far
        if (distToPlayer > 18) {
          bot.position.x += Math.sin(bot.rotationY) * 3.5 * delta;
          bot.position.z += Math.cos(bot.rotationY) * 3.5 * delta;
        }
      } else {
        // Gentle patrol around initial zone
        bot.state = 'patrol';
        bot.rotationY += (Math.random() - 0.5) * 0.5 * delta;
        bot.position.x += Math.sin(bot.rotationY) * 1.8 * delta;
        bot.position.z += Math.cos(bot.rotationY) * 1.8 * delta;
      }

      this.engine.updateEnemyMesh(bot.id, bot.position, bot.rotationY, bot.color, true);
    });
  }

  // Simulated background bot eliminations (Bermuda alive counter decreasing)
  private simTimer = 0;
  private nextSimInterval = 3.5;
  private updateSimulatedCombat(delta: number) {
    this.simTimer += delta;
    if (this.simTimer >= this.nextSimInterval && this.aliveCount > 2) {
      this.simTimer = 0;
      this.nextSimInterval = 3.0 + Math.random() * 2.5; // Every 3 - 5.5s
      this.aliveCount--;

      const killer = this.botNames[Math.floor(Math.random() * this.botNames.length)];
      let victim = this.botNames[Math.floor(Math.random() * this.botNames.length)];
      while (victim === killer) {
        victim = this.botNames[Math.floor(Math.random() * this.botNames.length)];
      }
      const weapons = ['AK47', 'MP40', 'AWM', 'M1887', 'M4A1', 'SCAR'];
      const weapon = weapons[Math.floor(Math.random() * weapons.length)];

      this.killFeed.unshift({
        id: `sim_kill_${Date.now()}_${Math.random()}`,
        killer,
        victim,
        weapon,
        isHeadshot: Math.random() > 0.65,
        isPlayerKill: false,
        timestamp: Date.now(),
      });

      if (this.killFeed.length > 10) {
        this.killFeed.pop();
      }
    }
  }

  // Register incoming damage with optional attacker position for directional feedback
  public registerPlayerDamage(
    rawDamage: number,
    attackerPos?: { x: number; z: number },
    attackerName?: string,
    weaponName?: string
  ) {
    let finalDmg = rawDamage;
    if (this.playerStats.armorLevel > 0) finalDmg *= 0.7; // Armor reduction
    const damage = Math.round(finalDmg);
    this.playerStats.hp = Math.max(0, this.playerStats.hp - damage);
    soundManager.playHitConfirm();

    if (attackerPos) {
      this.damageIndicators.push({
        id: `dmg_ind_${Date.now()}_${Math.random()}`,
        attackerPos: { x: attackerPos.x, z: attackerPos.z },
        timestamp: Date.now(),
        opacity: 1,
        damage,
      });
    }

    if (this.playerStats.hp <= 0) {
      this.killFeed.unshift({
        id: `player_elim_${Date.now()}`,
        killer: attackerName || 'Bermuda Survivor',
        victim: 'You',
        weapon: weaponName || 'Assault Rifle',
        isHeadshot: false,
        isPlayerKill: false,
        isPlayerVictim: true,
        timestamp: Date.now(),
      });
      this.triggerDefeat();
    }
  }

  // Trigger Victory (BOOYAH!)
  private triggerVictory() {
    this.isVictory = true;
    this.isGameOver = true;
    this.isRunning = false;
    soundManager.playBooyahFanfare();
    if (this.onGameOver) {
      this.onGameOver(true, this.playerKills, this.totalDamageDealt, Math.floor(this.matchTime));
    }
  }

  // Spawn drivable vehicles across Bermuda Island
  private spawnInitialVehicles() {
    this.vehicles = [
      {
        id: 'veh_jeep_1',
        type: 'jeep',
        name: 'Military 4x4 Jeep',
        position: { x: 18, y: this.engine.getTerrainHeight(18, 28), z: 28 },
        rotationY: 0.5,
        speed: 0,
        steerAngle: 0,
        hp: 600,
        maxHp: 600,
        fuel: 100,
        maxSpeed: 22,
        acceleration: 18,
        reverseSpeed: -8,
        turnSpeed: 2.2,
        isOccupied: false,
        color: '#2e4024',
      },
      {
        id: 'veh_sport_1',
        type: 'sportscar',
        name: 'Draco GT Sports Car',
        position: { x: -60, y: this.engine.getTerrainHeight(-60, -40), z: -40 },
        rotationY: -1.2,
        speed: 0,
        steerAngle: 0,
        hp: 450,
        maxHp: 450,
        fuel: 100,
        maxSpeed: 28,
        acceleration: 24,
        reverseSpeed: -10,
        turnSpeed: 2.8,
        isOccupied: false,
        color: '#ef4444',
      },
      {
        id: 'veh_bike_1',
        type: 'bike',
        name: 'Cobra Street Bike',
        position: { x: 50, y: this.engine.getTerrainHeight(50, -25), z: -25 },
        rotationY: 2.1,
        speed: 0,
        steerAngle: 0,
        hp: 350,
        maxHp: 350,
        fuel: 100,
        maxSpeed: 30,
        acceleration: 26,
        reverseSpeed: -6,
        turnSpeed: 3.2,
        isOccupied: false,
        color: '#f59e0b',
      },
      {
        id: 'veh_jeep_2',
        type: 'jeep',
        name: 'Desert Storm Jeep',
        position: { x: -30, y: this.engine.getTerrainHeight(-30, 50), z: 50 },
        rotationY: 1.5,
        speed: 0,
        steerAngle: 0,
        hp: 600,
        maxHp: 600,
        fuel: 100,
        maxSpeed: 22,
        acceleration: 18,
        reverseSpeed: -8,
        turnSpeed: 2.2,
        isOccupied: false,
        color: '#78350f',
      },
      {
        id: 'veh_sport_2',
        type: 'sportscar',
        name: 'Cyber Neon Supercar',
        position: { x: 35, y: this.engine.getTerrainHeight(35, 12), z: 12 },
        rotationY: -0.4,
        speed: 0,
        steerAngle: 0,
        hp: 450,
        maxHp: 450,
        fuel: 100,
        maxSpeed: 28,
        acceleration: 24,
        reverseSpeed: -10,
        turnSpeed: 2.8,
        isOccupied: false,
        color: '#06b6d4',
      },
    ];

    this.vehicles.forEach((v) => this.engine.createOrUpdateVehicleMesh(v));
  }

  // Toggle Enter / Exit Vehicle
  public toggleVehicle(): boolean {
    if (this.playerStats.inVehicle && this.playerStats.currentVehicleId) {
      // Exit vehicle
      const v = this.vehicles.find((veh) => veh.id === this.playerStats.currentVehicleId);
      if (v) {
        v.isOccupied = false;
        this.playerPos.x = v.position.x - Math.cos(v.rotationY) * 2.2;
        this.playerPos.z = v.position.z + Math.sin(v.rotationY) * 2.2;
        this.playerPos.y = this.engine.getTerrainHeight(this.playerPos.x, this.playerPos.z) + 0.1;
      }
      this.playerStats.inVehicle = false;
      this.playerStats.currentVehicleId = undefined;
      this.playerStats.vehicleSpeed = 0;
      soundManager.playPickup();
      return false;
    }

    if (this.nearbyVehicleId) {
      // Enter vehicle
      const v = this.vehicles.find((veh) => veh.id === this.nearbyVehicleId);
      if (v) {
        v.isOccupied = true;
        this.playerStats.inVehicle = true;
        this.playerStats.currentVehicleId = v.id;
        this.playerStats.vehicleHp = v.hp;
        this.playerStats.vehicleMaxHp = v.maxHp;
        this.playerStats.vehicleFuel = Math.round(v.fuel);
        this.playerStats.isScoped = false;
        soundManager.playAlokSkill(); // Engine ignition chime
        return true;
      }
    }
    return false;
  }

  // Vehicle driving physics, steering, drag, terrain alignment, and ramming
  private updateVehicles(delta: number) {
    let nearestVehId: string | null = null;
    let minDist = 4.8;

    for (let v of this.vehicles) {
      if (v.isOccupied) {
        // --- DRIVING CONTROLS & ACCELERATION ---
        const isAccelerating = !!this.keysPressed['KeyW'] || !!this.keysPressed['ArrowUp'];
        const isReversing = !!this.keysPressed['KeyS'] || !!this.keysPressed['ArrowDown'];
        const isSteeringLeft = !!this.keysPressed['KeyA'] || !!this.keysPressed['ArrowLeft'];
        const isSteeringRight = !!this.keysPressed['KeyD'] || !!this.keysPressed['ArrowRight'];
        const isBoosting = (!!this.keysPressed['ShiftLeft'] || !!this.keysPressed['ShiftRight']) && v.fuel > 0;
        const isHandbrake = !!this.keysPressed['Space'];

        // Nitro Boost multiplier
        let currentMaxSpeed = v.maxSpeed;
        let currentAccel = v.acceleration;
        if (isBoosting) {
          currentMaxSpeed *= 1.45;
          currentAccel *= 1.5;
          v.fuel = Math.max(0, v.fuel - delta * 12);
        }

        // Target Steer Angle
        let targetSteer = 0;
        if (isSteeringLeft) targetSteer -= 0.52;
        if (isSteeringRight) targetSteer += 0.52;
        v.steerAngle += (targetSteer - v.steerAngle) * Math.min(1, delta * 10);

        // Acceleration & Braking
        if (isAccelerating) {
          v.speed = Math.min(currentMaxSpeed, v.speed + currentAccel * delta);
        } else if (isReversing) {
          v.speed = Math.max(v.reverseSpeed, v.speed - currentAccel * 0.8 * delta);
        } else {
          // Coasting drag
          v.speed *= Math.pow(0.85, delta * 5);
          if (Math.abs(v.speed) < 0.1) v.speed = 0;
        }

        if (isHandbrake) {
          v.speed *= Math.pow(0.4, delta * 10);
        }

        // Turning yaw depends on speed
        if (Math.abs(v.speed) > 0.2) {
          const steerFactor = (v.speed > 0 ? 1 : -1) * (v.turnSpeed * (isHandbrake ? 1.6 : 1.0));
          v.rotationY += v.steerAngle * steerFactor * delta;
        }

        // Apply forward movement
        const nextX = v.position.x + Math.sin(v.rotationY) * v.speed * delta;
        const nextZ = v.position.z + Math.cos(v.rotationY) * v.speed * delta;

        // Boundary constraint
        const distFromCenter = Math.hypot(nextX, nextZ);
        if (distFromCenter < 280) {
          v.position.x = nextX;
          v.position.z = nextZ;
        } else {
          v.speed = -v.speed * 0.5; // Bounce off sea boundary
        }

        // Ground elevation alignment
        v.position.y = this.engine.getTerrainHeight(v.position.x, v.position.z);

        // Keep player pinned to vehicle
        this.playerPos.x = v.position.x;
        this.playerPos.y = v.position.y;
        this.playerPos.z = v.position.z;

        // Camera follow smoothly
        this.engine.cameraYaw += (v.rotationY - this.engine.cameraYaw) * 0.08;

        // Update playerStats vehicle telemetry
        this.playerStats.vehicleSpeed = Math.round(Math.abs(v.speed) * 3.6);
        this.playerStats.vehicleHp = v.hp;
        this.playerStats.vehicleMaxHp = v.maxHp;
        this.playerStats.vehicleFuel = Math.round(v.fuel);

        // --- ENEMY RAMMING COLLISION ---
        if (Math.abs(v.speed) > 5) {
          this.enemies.forEach((enemy) => {
            if (!enemy.isAlive) return;
            const distToEnemy = Math.hypot(enemy.position.x - v.position.x, enemy.position.z - v.position.z);
            if (distToEnemy < 2.5) {
              const ramDmg = Math.round(Math.abs(v.speed) * 7.5);
              enemy.hp -= ramDmg;

              // Knockback enemy
              enemy.position.x += Math.sin(v.rotationY) * 7;
              enemy.position.z += Math.cos(v.rotationY) * 7;

              // Floating damage
              this.damageNumbers.push({
                id: `ram_${Date.now()}_${Math.random()}`,
                amount: ramDmg,
                isHeadshot: false,
                position: { ...enemy.position, y: enemy.position.y + 1.2 },
                opacity: 1,
                scale: 1.4,
              });

              soundManager.playHitConfirm();

              if (enemy.hp <= 0) {
                this.eliminateEnemy(enemy, true, 'VEHICLE ROADKILL', false);
              }
            }
          });
        }
      } else {
        // Friction on parked vehicles
        v.speed *= 0.9;
        v.position.y = this.engine.getTerrainHeight(v.position.x, v.position.z);

        // Check if player is near
        const d = Math.hypot(this.playerPos.x - v.position.x, this.playerPos.z - v.position.z);
        if (d < minDist) {
          minDist = d;
          nearestVehId = v.id;
        }
      }

      this.engine.createOrUpdateVehicleMesh(v);
    }

    this.nearbyVehicleId = nearestVehId;
  }

  // Trigger Defeat
  private triggerDefeat() {
    this.isVictory = false;
    this.isGameOver = true;
    this.isRunning = false;
    if (this.onGameOver) {
      this.onGameOver(false, this.playerKills, this.totalDamageDealt, Math.floor(this.matchTime));
    }
  }

  public resetGame() {
    this.playerStats.hp = 200;
    this.playerStats.ep = 150;
    this.playerStats.medkits = 3;
    this.playerStats.glooWalls = 3;
    this.playerStats.inVehicle = false;
    this.playerStats.currentVehicleId = undefined;
    this.playerStats.vehicleSpeed = 0;
    this.playerPos = { x: 0, y: 0, z: 25 };
    this.aliveCount = 50;
    this.playerKills = 0;
    this.totalDamageDealt = 0;
    this.matchTime = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.damageIndicators = [];

    // Reset safe zone
    this.safeZone.currentRadius = 150;
    this.safeZone.targetRadius = 90;
    this.safeZone.phase = 1;
    this.safeZone.shrinkTimer = 75;
    this.safeZone.isShrinking = false;

    // Clear and respawn enemies & vehicles
    this.enemies.forEach((e) => this.engine.removeEnemyMesh(e.id));
    this.enemies = [];
    this.spawnInitialEnemies();

    this.vehicles.forEach((v) => this.engine.removeVehicleMesh(v.id));
    this.vehicles = [];
    this.spawnInitialVehicles();

    this.start();
  }
}
