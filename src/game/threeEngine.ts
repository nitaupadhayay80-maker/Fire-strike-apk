import * as THREE from 'three';
import { WeaponType, LootItem, GlooWallObject, SafeZoneState, Vehicle } from '../types/game';

export interface HitResult {
  hit: boolean;
  distance: number;
  point?: THREE.Vector3;
  targetType?: 'enemy' | 'wall' | 'ground' | 'gloo';
  enemyId?: string;
  isHeadshot?: boolean;
}

export class ThreeEngine {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private container: HTMLElement;

  // Player meshes & rigs
  public playerGroup: THREE.Group;
  private playerTorso!: THREE.Mesh;
  private playerHead!: THREE.Mesh;
  private playerLeftArm!: THREE.Group;
  private playerRightArm!: THREE.Group;
  private playerLeftLeg!: THREE.Group;
  private playerRightLeg!: THREE.Group;
  private weaponMeshGroup!: THREE.Group;
  private panBackMesh!: THREE.Mesh;
  private muzzleFlashMesh!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  private muzzleLight!: THREE.PointLight;
  private alokAuraMesh!: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;

  // World objects
  private colliders: THREE.Object3D[] = [];
  private groundMesh!: THREE.Mesh;
  private glooWallMeshes: Map<string, THREE.Group> = new Map();
  private enemyMeshes: Map<string, THREE.Group> = new Map();
  private lootMeshes: Map<string, THREE.Group> = new Map();
  public vehicleMeshes: Map<string, THREE.Group> = new Map();
  public vehicleWheelMeshes: Map<string, THREE.Mesh[]> = new Map();
  private safeZoneMesh!: THREE.Mesh;
  private airdropGroup!: THREE.Group;
  private smokeParticles!: THREE.Points;

  // Bullet tracers & effects
  private activeTracers: { mesh: THREE.Line; age: number; maxAge: number }[] = [];
  private activeSparks: { particles: THREE.Points; velocities: THREE.Vector3[]; age: number }[] = [];

  // Camera settings
  public viewMode: 'tpp' | 'fpp' = 'tpp';
  public isAiming: boolean = false;
  public cameraPitch: number = 0; // vertical look angle
  public cameraYaw: number = 0;   // horizontal look angle

  // Animation states
  private animTimer: number = 0;
  private recoilAmount: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb); // Tropical sky
    this.scene.fog = new THREE.FogExp2(0x8ec5e8, 0.0035);

    // 2. Camera setup
    this.camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);

    // 3. Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    container.appendChild(this.renderer.domElement);

    // 4. Lights
    this.setupLighting();

    // 5. Environment & Map
    this.setupEnvironment();

    // 6. Player Rig
    this.playerGroup = new THREE.Group();
    this.setupPlayerRig();
    this.scene.add(this.playerGroup);

    // 7. Safe Zone Barrier
    this.setupSafeZone();

    // 8. Airdrop Crate with Smoke Pillar
    this.setupAirdrop();

    // Resize event
    window.addEventListener('resize', this.onResize);
  }

  private setupLighting() {
    const ambientLight = new THREE.HemisphereLight(0xfff5e6, 0x556b2f, 0.65);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 1.25);
    sunLight.position.set(80, 150, 70);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -120;
    sunLight.shadow.camera.right = 120;
    sunLight.shadow.camera.top = 120;
    sunLight.shadow.camera.bottom = -120;
    sunLight.shadow.bias = -0.0005;
    this.scene.add(sunLight);
  }

  private setupEnvironment() {
    // Large Bermuda Island ground with texture canvas
    const islandSize = 600;
    const groundGeo = new THREE.PlaneGeometry(islandSize, islandSize, 64, 64);

    // Procedural gentle undulations
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const distFromCenter = Math.sqrt(x * x + y * y);
      // Island profile: higher in middle, sloping into water at borders
      const hill = Math.sin(x * 0.02) * Math.cos(y * 0.02) * 3.5 + Math.sin(x * 0.05) * 1.5;
      const falloff = Math.max(0, 1 - Math.pow(distFromCenter / (islandSize * 0.48), 3));
      posAttr.setZ(i, (hill + 4) * falloff);
    }
    groundGeo.computeVertexNormals();

    // Create stylized grass & dirt texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#4d7c0f'; // Rich Bermuda grass
    ctx.fillRect(0, 0, 512, 512);

    // Dirt noise & trails
    for (let i = 0; i < 6000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(74, 105, 17, 0.4)' : 'rgba(161, 98, 7, 0.25)';
      ctx.fillRect(rx, ry, Math.random() * 6 + 2, Math.random() * 6 + 2);
    }

    const groundTex = new THREE.CanvasTexture(canvas);
    groundTex.wrapS = THREE.RepeatWrapping;
    groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(40, 40);

    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.9,
      metalness: 0.1,
    });

    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.receiveShadow = true;
    this.groundMesh.name = 'ground';
    this.scene.add(this.groundMesh);
    this.colliders.push(this.groundMesh);

    // Sea water surrounding island
    const waterGeo = new THREE.PlaneGeometry(1200, 1200);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.8,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.5;
    this.scene.add(water);

    // Build Bermuda landmarks: Clock Tower, Factory, Houses, Trees, Crates
    this.buildClockTower({ x: 0, y: 0, z: 20 });
    this.buildFactory({ x: -75, y: 0, z: -55 });
    this.buildWarehouse({ x: 65, y: 0, z: -40 });
    this.buildBermudaHouses();
    this.buildCoverStructures();
    this.buildTreesAndFoliage();
  }

  // Iconic Clock Tower
  private buildClockTower(pos: { x: number; y: number; z: number }) {
    const group = new THREE.Group();
    group.position.set(pos.x, pos.y, pos.z);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.8 });
    const brickMat = new THREE.MeshStandardMaterial({ color: 0xa8a29e, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.6 });
    const clockMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xca8a04, emissiveIntensity: 0.3 });

    // Base podium
    const base = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 14), stoneMat);
    base.position.y = 1.5;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Main tower column
    const column = new THREE.Mesh(new THREE.BoxGeometry(8, 28, 8), brickMat);
    column.position.y = 17;
    column.castShadow = true;
    column.receiveShadow = true;
    group.add(column);

    // Balcony section
    const balcony = new THREE.Mesh(new THREE.BoxGeometry(10, 2, 10), stoneMat);
    balcony.position.y = 31;
    balcony.castShadow = true;
    group.add(balcony);

    // Clock faces (4 sides)
    const clockGeo = new THREE.CylinderGeometry(2, 2, 0.4, 24);
    const clockNorth = new THREE.Mesh(clockGeo, clockMat);
    clockNorth.rotation.x = Math.PI / 2;
    clockNorth.position.set(0, 25, 4.1);
    group.add(clockNorth);

    const clockSouth = new THREE.Mesh(clockGeo, clockMat);
    clockSouth.rotation.x = Math.PI / 2;
    clockSouth.position.set(0, 25, -4.1);
    group.add(clockSouth);

    const clockEast = new THREE.Mesh(clockGeo, clockMat);
    clockEast.rotation.z = Math.PI / 2;
    clockEast.position.set(4.1, 25, 0);
    group.add(clockEast);

    const clockWest = new THREE.Mesh(clockGeo, clockMat);
    clockWest.rotation.z = Math.PI / 2;
    clockWest.position.set(-4.1, 25, 0);
    group.add(clockWest);

    // Spire roof
    const spire = new THREE.Mesh(new THREE.ConeGeometry(5.5, 12, 4), roofMat);
    spire.position.y = 38;
    spire.rotation.y = Math.PI / 4;
    spire.castShadow = true;
    group.add(spire);

    this.scene.add(group);
    this.colliders.push(base, column);
  }

  // Iconic Bermuda Factory
  private buildFactory(pos: { x: number; y: number; z: number }) {
    const group = new THREE.Group();
    group.position.set(pos.x, pos.y, pos.z);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.6 });
    const rustMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });

    // Main factory warehouse building
    const mainHall = new THREE.Mesh(new THREE.BoxGeometry(26, 12, 34), metalMat);
    mainHall.position.y = 6;
    mainHall.castShadow = true;
    mainHall.receiveShadow = true;
    group.add(mainHall);

    // Factory pitched roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(28, 2, 36), rustMat);
    roof.position.y = 12.8;
    roof.castShadow = true;
    group.add(roof);

    // Smokestacks
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
    for (let i = 0; i < 2; i++) {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 18, 16), pipeMat);
      stack.position.set(7 - i * 14, 15, 10);
      stack.castShadow = true;
      group.add(stack);
    }

    // Annex hangar
    const annex = new THREE.Mesh(new THREE.BoxGeometry(16, 7, 18), concreteMat);
    annex.position.set(20, 3.5, 0);
    annex.castShadow = true;
    group.add(annex);

    this.scene.add(group);
    this.colliders.push(mainHall, annex);
  }

  // Military warehouse
  private buildWarehouse(pos: { x: number; y: number; z: number }) {
    const group = new THREE.Group();
    group.position.set(pos.x, pos.y, pos.z);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.6, metalness: 0.4 });
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });

    const building = new THREE.Mesh(new THREE.BoxGeometry(22, 9, 28), wallMat);
    building.position.y = 4.5;
    building.castShadow = true;
    building.receiveShadow = true;
    group.add(building);

    // High roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(24, 1.5, 30), frameMat);
    roof.position.y = 9.5;
    group.add(roof);

    this.scene.add(group);
    this.colliders.push(building);
  }

  // Scattered Bermuda houses & compounds
  private buildBermudaHouses() {
    const houseCoords = [
      { x: -35, z: 40, rot: 0.2 },
      { x: 45, z: 50, rot: -0.4 },
      { x: -50, z: -15, rot: 0.8 },
      { x: 30, z: -80, rot: -0.1 },
      { x: -85, z: 30, rot: 0.5 },
      { x: 80, z: 25, rot: 1.2 },
    ];

    const wallColors = [0xfef3c7, 0xf1f5f9, 0xfde047, 0xe2e8f0];
    const roofColors = [0x991b1b, 0x1e3a8a, 0x854d0e];

    houseCoords.forEach((coord, idx) => {
      const group = new THREE.Group();
      group.position.set(coord.x, 0, coord.z);
      group.rotation.y = coord.rot;

      const wallColor = wallColors[idx % wallColors.length];
      const roofColor = roofColors[idx % roofColors.length];

      const houseBody = new THREE.Mesh(
        new THREE.BoxGeometry(10, 6, 12),
        new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.7 })
      );
      houseBody.position.y = 3;
      houseBody.castShadow = true;
      houseBody.receiveShadow = true;
      group.add(houseBody);

      // Sloped Roof
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(8.5, 4, 4),
        new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.5 })
      );
      roof.position.y = 8;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);

      this.scene.add(group);
      this.colliders.push(houseBody);
    });
  }

  // Shipping containers, concrete barriers, sandbags for tactical gunplay
  private buildCoverStructures() {
    const containerColors = [0xd97706, 0x2563eb, 0xdc2626, 0x059669];
    const positions = [
      { x: -15, z: 5, rot: 0.3 },
      { x: 18, z: -10, rot: 1.1 },
      { x: -5, z: -25, rot: -0.5 },
      { x: 22, z: 18, rot: 0.7 },
      { x: -45, z: -40, rot: 0 },
      { x: 50, z: -15, rot: 0.9 },
      { x: 0, z: 60, rot: -1.3 },
      { x: -60, z: 65, rot: 0.4 },
    ];

    positions.forEach((p, idx) => {
      const color = containerColors[idx % containerColors.length];
      const cont = new THREE.Mesh(
        new THREE.BoxGeometry(6, 3, 2.5),
        new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.4 })
      );
      cont.position.set(p.x, 1.5, p.z);
      cont.rotation.y = p.rot;
      cont.castShadow = true;
      cont.receiveShadow = true;
      this.scene.add(cont);
      this.colliders.push(cont);

      // Stacked second container on some
      if (idx % 3 === 0) {
        const topCont = cont.clone();
        topCont.position.y = 4.5;
        topCont.rotation.y += 0.15;
        this.scene.add(topCont);
        this.colliders.push(topCont);
      }
    });

    // Boulders
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.9 });
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const dist = 30 + Math.random() * 80;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.4 + Math.random() * 1.6),
        rockMat
      );
      rock.position.set(Math.cos(angle) * dist, 1.2, Math.sin(angle) * dist);
      rock.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
      rock.castShadow = true;
      this.scene.add(rock);
      this.colliders.push(rock);
    }
  }

  // Palm trees and foliage
  private buildTreesAndFoliage() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });

    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 15 + Math.random() * 120;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Don't place inside central clock tower
      if (Math.abs(x) < 12 && Math.abs(z - 20) < 12) continue;

      const tree = new THREE.Group();
      tree.position.set(x, 0, z);

      // Curved Palm trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 7, 8), trunkMat);
      trunk.position.y = 3.5;
      trunk.rotation.z = (Math.random() - 0.5) * 0.15;
      trunk.castShadow = true;
      tree.add(trunk);

      // Fronds / Palm crown
      for (let j = 0; j < 6; j++) {
        const frond = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.2, 5), leafMat);
        const frondAngle = (j / 6) * Math.PI * 2;
        frond.position.set(Math.cos(frondAngle) * 1.5, 6.8, Math.sin(frondAngle) * 1.5);
        frond.rotation.x = Math.PI / 3;
        frond.rotation.y = frondAngle;
        frond.castShadow = true;
        tree.add(frond);
      }

      this.scene.add(tree);
      this.colliders.push(trunk);
    }
  }

  // Realistic Player 3D Rig
  private setupPlayerRig() {
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf6c59e, roughness: 0.7 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const glassesMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.9, roughness: 0.1 });

    // Torso & Tactical Vest
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.75, 0.35);
    this.playerTorso = new THREE.Mesh(torsoGeo, vestMat);
    this.playerTorso.position.y = 1.25;
    this.playerTorso.castShadow = true;
    this.playerGroup.add(this.playerTorso);

    // Golden shoulder pads (Alok / Heroic rank aesthetic)
    const padL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.32), goldMat);
    padL.position.set(-0.32, 0.32, 0);
    this.playerTorso.add(padL);
    const padR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.32), goldMat);
    padR.position.set(0.32, 0.32, 0);
    this.playerTorso.add(padR);

    // Head
    const headGeo = new THREE.BoxGeometry(0.32, 0.35, 0.32);
    this.playerHead = new THREE.Mesh(headGeo, skinMat);
    this.playerHead.position.set(0, 0.55, 0);
    this.playerHead.castShadow = true;
    this.playerTorso.add(this.playerHead);

    // Cool Hair
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.15, 0.34), hairMat);
    hair.position.set(0, 0.2, 0);
    this.playerHead.add(hair);

    // Sunglasses
    const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.1), glassesMat);
    glasses.position.set(0, 0.02, 0.16);
    this.playerHead.add(glasses);

    // Pan strapped to back (iconic Free Fire armor deflect!)
    const panGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 16);
    const panMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.3 });
    this.panBackMesh = new THREE.Mesh(panGeo, panMat);
    this.panBackMesh.rotation.x = Math.PI / 2;
    this.panBackMesh.position.set(0, 0, -0.22);
    this.playerTorso.add(this.panBackMesh);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.16, 0.65, 0.16);
    this.playerLeftArm = new THREE.Group();
    this.playerLeftArm.position.set(-0.35, 0.3, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
    leftArmMesh.position.y = -0.3;
    leftArmMesh.castShadow = true;
    this.playerLeftArm.add(leftArmMesh);
    this.playerTorso.add(this.playerLeftArm);

    this.playerRightArm = new THREE.Group();
    this.playerRightArm.position.set(0.35, 0.3, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
    rightArmMesh.position.y = -0.3;
    rightArmMesh.castShadow = true;
    this.playerRightArm.add(rightArmMesh);
    this.playerTorso.add(this.playerRightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.85, 0.22);
    this.playerLeftLeg = new THREE.Group();
    this.playerLeftLeg.position.set(-0.16, 0.85, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
    leftLegMesh.position.y = -0.42;
    leftLegMesh.castShadow = true;
    this.playerLeftLeg.add(leftLegMesh);
    this.playerGroup.add(this.playerLeftLeg);

    this.playerRightLeg = new THREE.Group();
    this.playerRightLeg.position.set(0.16, 0.85, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
    rightLegMesh.position.y = -0.42;
    rightLegMesh.castShadow = true;
    this.playerRightLeg.add(rightLegMesh);
    this.playerGroup.add(this.playerRightLeg);

    // Weapon Group held in right hand
    this.weaponMeshGroup = new THREE.Group();
    this.weaponMeshGroup.position.set(0, -0.5, 0.35);
    this.playerRightArm.add(this.weaponMeshGroup);
    this.rebuildWeaponMesh('ak47');

    // Muzzle Flash Quad & Light
    const flashGeo = new THREE.PlaneGeometry(0.4, 0.4);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlashMesh.position.set(0, 0, 0.8);
    this.weaponMeshGroup.add(this.muzzleFlashMesh);

    this.muzzleLight = new THREE.PointLight(0xff9900, 0, 8);
    this.muzzleLight.position.set(0, 0, 0.8);
    this.weaponMeshGroup.add(this.muzzleLight);

    // DJ Alok "Drop the Beat" glowing ring
    const ringGeo = new THREE.RingGeometry(4.8, 5.0, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    this.alokAuraMesh = new THREE.Mesh(ringGeo, ringMat);
    this.alokAuraMesh.rotation.x = -Math.PI / 2;
    this.alokAuraMesh.position.y = 0.05;
    this.playerGroup.add(this.alokAuraMesh);
  }

  // Switch 3D weapon model in hand
  public rebuildWeaponMesh(type: WeaponType) {
    while (this.weaponMeshGroup.children.length > 2) {
      this.weaponMeshGroup.remove(this.weaponMeshGroup.children[0]);
    }

    const gunMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4, metalness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.2 });

    if (type === 'ak47') {
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.6), gunMat);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.35), woodMat);
      stock.position.set(0, -0.04, -0.4);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), gunMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.04, 0.45);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.15), gunMat);
      mag.position.set(0, -0.16, 0.08);
      mag.rotation.x = 0.25;

      this.weaponMeshGroup.add(receiver, stock, barrel, mag);
    } else if (type === 'mp40') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.5), gunMat);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 8), gunMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, 0.4);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.08), goldMat);
      mag.position.set(0, -0.18, 0.12);

      this.weaponMeshGroup.add(body, barrel, mag);
    } else if (type === 'awm') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.8), gunMat);
      const longBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.85, 8), gunMat);
      longBarrel.rotation.x = Math.PI / 2;
      longBarrel.position.set(0, 0.04, 0.7);
      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.35, 12), goldMat);
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.15, 0.1);

      this.weaponMeshGroup.add(body, longBarrel, scope);
    } else if (type === 'm1887') {
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.4), woodMat);
      stock.position.set(0, -0.04, -0.2);
      const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), gunMat);
      barrel1.rotation.x = Math.PI / 2;
      barrel1.position.set(-0.03, 0.03, 0.35);
      const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8), gunMat);
      barrel2.rotation.x = Math.PI / 2;
      barrel2.position.set(0.03, 0.03, 0.35);

      this.weaponMeshGroup.add(stock, barrel1, barrel2);
    } else if (type === 'pan') {
      const panMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16),
        new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.85, roughness: 0.2 })
      );
      panMesh.rotation.x = Math.PI / 2;
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), gunMat);
      handle.position.set(0, -0.3, 0);
      this.weaponMeshGroup.add(panMesh, handle);
    }
  }

  // Safe Zone Electric Cylinder
  private setupSafeZone() {
    const geo = new THREE.CylinderGeometry(150, 150, 80, 48, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00bfff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.28,
      wireframe: false,
    });
    this.safeZoneMesh = new THREE.Mesh(geo, mat);
    this.safeZoneMesh.position.set(0, 40, 0);
    this.scene.add(this.safeZoneMesh);
  }

  // Airdrop Crate with red smoke
  private setupAirdrop() {
    this.airdropGroup = new THREE.Group();
    this.airdropGroup.position.set(-20, 1.25, -15);

    // Red military crate with golden edges
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 2.5, 2.5),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 })
    );
    crate.castShadow = true;
    this.airdropGroup.add(crate);

    const blueTarp = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.6, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 })
    );
    blueTarp.position.y = 1.1;
    this.airdropGroup.add(blueTarp);

    // Billowing red smoke particles
    const particleCount = 120;
    const smokeGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = Math.random() * 45 + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    smokeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const smokeMat = new THREE.PointsMaterial({
      color: 0xef4444,
      size: 1.8,
      transparent: true,
      opacity: 0.65,
    });
    this.smokeParticles = new THREE.Points(smokeGeo, smokeMat);
    this.airdropGroup.add(this.smokeParticles);

    this.scene.add(this.airdropGroup);
    this.colliders.push(crate);
  }

  // Deploy iconic Gloo Wall (ग्लू वाल)
  public spawnGlooWall(wall: GlooWallObject) {
    const group = new THREE.Group();
    group.position.set(wall.position.x, wall.position.y + 1.6, wall.position.z);
    group.rotation.y = wall.rotationY;

    // Curved ice barrier with cyan glow
    const wallGeo = new THREE.CylinderGeometry(3.2, 3.2, 3.2, 16, 1, false, -Math.PI / 3, (Math.PI * 2) / 3);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    wallMesh.name = `gloo_${wall.id}`;
    group.add(wallMesh);

    // Ice crystals at base
    const baseGeo = new THREE.BoxGeometry(4.2, 0.4, 1.2);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xbae6fd, roughness: 0.4 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -1.4;
    group.add(base);

    this.scene.add(group);
    this.glooWallMeshes.set(wall.id, group);
    this.colliders.push(wallMesh);
  }

  public removeGlooWall(id: string) {
    const group = this.glooWallMeshes.get(id);
    if (group) {
      this.scene.remove(group);
      this.glooWallMeshes.delete(id);
    }
  }

  // Update AI bot meshes
  public updateEnemyMesh(
    id: string,
    pos: { x: number; y: number; z: number },
    rotY: number,
    color: number,
    isAlive: boolean
  ) {
    let botGroup = this.enemyMeshes.get(id);

    if (!botGroup) {
      botGroup = new THREE.Group();
      const botMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xf6c59e, roughness: 0.7 });

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.75, 0.35), botMat);
      torso.position.y = 1.25;
      torso.castShadow = true;
      botGroup.add(torso);

      // Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.32), skinMat);
      head.position.set(0, 0.55, 0);
      head.name = `head_${id}`;
      torso.add(head);

      // Limbs
      const armGeo = new THREE.BoxGeometry(0.16, 0.65, 0.16);
      const armL = new THREE.Mesh(armGeo, botMat);
      armL.position.set(-0.35, 0, 0);
      torso.add(armL);
      const armR = new THREE.Mesh(armGeo, botMat);
      armR.position.set(0.35, 0, 0);
      torso.add(armR);

      // Weapon
      const gunMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.12, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7 })
      );
      gunMesh.position.set(0.35, -0.2, 0.3);
      torso.add(gunMesh);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.2, 0.85, 0.22);
      const legL = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
      legL.position.set(-0.16, 0.42, 0);
      botGroup.add(legL);
      const legR = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x1f2937 }));
      legR.position.set(0.16, 0.42, 0);
      botGroup.add(legR);

      botGroup.name = `enemy_${id}`;
      this.scene.add(botGroup);
      this.enemyMeshes.set(id, botGroup);
    }

    botGroup.position.set(pos.x, pos.y, pos.z);
    botGroup.rotation.y = rotY;

    if (!isAlive) {
      // Fallen dead ragdoll posture
      botGroup.rotation.x = Math.PI / 2;
      botGroup.position.y = 0.2;
    } else {
      botGroup.rotation.x = 0;
    }
  }

  public removeEnemyMesh(id: string) {
    const group = this.enemyMeshes.get(id);
    if (group) {
      this.scene.remove(group);
      this.enemyMeshes.delete(id);
    }
  }

  // Ground loot pickup meshes
  public syncLootMeshes(lootList: LootItem[]) {
    const currentIds = new Set(lootList.map((l) => l.id));

    // Remove old
    for (const [id, group] of this.lootMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(group);
        this.lootMeshes.delete(id);
      }
    }

    // Add / animate existing
    lootList.forEach((item) => {
      let group = this.lootMeshes.get(item.id);
      if (!group) {
        group = new THREE.Group();
        group.position.set(item.position.x, item.position.y + 0.5, item.position.z);

        let color = 0xf59e0b; // Yellow ground loot
        if (item.type === 'weapon') color = 0x3b82f6;
        if (item.type === 'medkit') color = 0x10b981;
        if (item.type === 'gloo') color = 0x06b6d4;

        // Rotating loot box icon
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 0.3, 0.4),
          new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4 })
        );
        group.add(box);

        // Ground halo circle
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.5, 0.7, 16),
          new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -0.45;
        group.add(ring);

        this.scene.add(group);
        this.lootMeshes.set(item.id, group);
      }

      // Floating bob & rotation
      group.rotation.y += 0.03;
      group.position.y = item.position.y + 0.5 + Math.sin(this.animTimer * 4 + Number(item.id.slice(-2) || 0)) * 0.1;
    });
  }

  // Terrain height calculation for surface alignment
  public getTerrainHeight(x: number, z: number): number {
    const distFromCenter = Math.sqrt(x * x + z * z);
    const hill = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 3.5 + Math.sin(x * 0.05) * 1.5;
    const falloff = Math.max(0, 1 - Math.pow(distFromCenter / (600 * 0.48), 3));
    return Math.max(0, (hill + 4) * falloff);
  }

  // Drivable Vehicle 3D Meshes & Wheel Rigging
  public createOrUpdateVehicleMesh(vehicle: Vehicle) {
    let group = this.vehicleMeshes.get(vehicle.id);
    let wheels = this.vehicleWheelMeshes.get(vehicle.id) || [];

    if (!group) {
      const vGroup = new THREE.Group();
      wheels = [];

      const wheelMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.8,
        metalness: 0.2,
      });
      const rimMat = new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        roughness: 0.3,
        metalness: 0.8,
      });

      if (vehicle.type === 'jeep') {
        // --- 4x4 OFFROAD MILITARY JEEP ---
        const bodyMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(vehicle.color || 0x2e4024),
          roughness: 0.55,
          metalness: 0.4,
        });

        // Lower Chassis & Bumper
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.9, 4.2), bodyMat);
        chassis.position.y = 0.9;
        chassis.castShadow = true;
        chassis.receiveShadow = true;
        vGroup.add(chassis);

        // Cabin & Windshield
        const glassMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          roughness: 0.1,
          metalness: 0.9,
          transparent: true,
          opacity: 0.85,
        });
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 1.8), glassMat);
        cabin.position.set(0, 1.65, -0.2);
        cabin.castShadow = true;
        vGroup.add(cabin);

        // Rollcage tubular bars
        const rollcageMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.7 });
        const barF = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.1), rollcageMat);
        barF.rotation.z = Math.PI / 2;
        barF.position.set(0, 2.05, 0.7);
        vGroup.add(barF);

        const barR = barF.clone();
        barR.position.set(0, 2.05, -1.1);
        vGroup.add(barR);

        // Front Headlights
        const headLightMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
        const hlL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16), headLightMat);
        hlL.rotation.x = Math.PI / 2;
        hlL.position.set(-0.85, 1.0, 2.12);
        vGroup.add(hlL);

        const hlR = hlL.clone();
        hlR.position.set(0.85, 1.0, 2.12);
        vGroup.add(hlR);

        // Rear Taillights
        const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.05), tailLightMat);
        tlL.position.set(-0.9, 0.95, -2.12);
        vGroup.add(tlL);

        const tlR = tlL.clone();
        tlR.position.set(0.9, 0.95, -2.12);
        vGroup.add(tlR);

        // 4 Large Off-road Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 16);
        const wheelPositions = [
          { x: -1.25, y: 0.55, z: 1.3 },  // Front Left
          { x: 1.25, y: 0.55, z: 1.3 },   // Front Right
          { x: -1.25, y: 0.55, z: -1.3 }, // Rear Left
          { x: 1.25, y: 0.55, z: -1.3 },  // Rear Right
        ];

        wheelPositions.forEach((wp) => {
          const wGroup = new THREE.Group();
          wGroup.position.set(wp.x, wp.y, wp.z);

          const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
          wMesh.rotation.z = Math.PI / 2;
          wMesh.castShadow = true;
          wGroup.add(wMesh);

          // Rim
          const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.46, 8), rimMat);
          rim.rotation.z = Math.PI / 2;
          wGroup.add(rim);

          vGroup.add(wGroup);
          wheels.push(wGroup as any);
        });
      } else if (vehicle.type === 'sportscar') {
        // --- HIGH-SPEED AERODYNAMIC SPORTS CAR ---
        const carMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(vehicle.color || 0xef4444),
          roughness: 0.25,
          metalness: 0.75,
        });

        // Low aerodynamic wedge chassis
        const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.55, 4.4), carMat);
        chassis.position.y = 0.55;
        chassis.castShadow = true;
        vGroup.add(chassis);

        // Sleek Cockpit Roof & Windshield
        const glassMat = new THREE.MeshStandardMaterial({
          color: 0x09090b,
          roughness: 0.1,
          metalness: 0.9,
          transparent: true,
          opacity: 0.9,
        });
        const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.48, 2.2), glassMat);
        cockpit.position.set(0, 1.0, -0.15);
        cockpit.castShadow = true;
        vGroup.add(cockpit);

        // Rear Racing Spoiler
        const spoilerWing = new THREE.Mesh(
          new THREE.BoxGeometry(2.2, 0.08, 0.4),
          new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 })
        );
        spoilerWing.position.set(0, 1.25, -2.0);
        vGroup.add(spoilerWing);

        // Spoiler struts
        const strutL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.06), spoilerWing.material);
        strutL.position.set(-0.7, 1.0, -2.0);
        vGroup.add(strutL);
        const strutR = strutL.clone();
        strutR.position.set(0.7, 1.0, -2.0);
        vGroup.add(strutR);

        // Front Xenon Headlights
        const hlMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.12, 0.05), hlMat);
        hlL.position.set(-0.75, 0.6, 2.21);
        vGroup.add(hlL);
        const hlR = hlL.clone();
        hlR.position.set(0.75, 0.6, 2.21);
        vGroup.add(hlR);

        // 4 Low-Profile Racing Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.35, 16);
        const wheelPositions = [
          { x: -1.15, y: 0.42, z: 1.35 },
          { x: 1.15, y: 0.42, z: 1.35 },
          { x: -1.15, y: 0.42, z: -1.35 },
          { x: 1.15, y: 0.42, z: -1.35 },
        ];

        wheelPositions.forEach((wp) => {
          const wGroup = new THREE.Group();
          wGroup.position.set(wp.x, wp.y, wp.z);

          const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
          wMesh.rotation.z = Math.PI / 2;
          wMesh.castShadow = true;
          wGroup.add(wMesh);

          const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.36, 10), rimMat);
          rim.rotation.z = Math.PI / 2;
          wGroup.add(rim);

          vGroup.add(wGroup);
          wheels.push(wGroup as any);
        });
      } else {
        // --- AGILE MOTORBIKE ---
        const bikeMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(vehicle.color || 0xf59e0b),
          roughness: 0.3,
          metalness: 0.7,
        });

        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 2.3), bikeMat);
        frame.position.y = 0.8;
        frame.castShadow = true;
        vGroup.add(frame);

        // Handlebars
        const hBar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.9),
          new THREE.MeshStandardMaterial({ color: 0x18181b })
        );
        hBar.rotation.z = Math.PI / 2;
        hBar.position.set(0, 1.25, 0.7);
        vGroup.add(hBar);

        // Headlight
        const hl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        hl.position.set(0, 1.15, 1.18);
        vGroup.add(hl);

        // 2 Wheels (Front & Rear)
        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.25, 16);
        const wPos = [
          { x: 0, y: 0.5, z: 1.1 },
          { x: 0, y: 0.5, z: -1.1 },
        ];

        wPos.forEach((wp) => {
          const wGroup = new THREE.Group();
          wGroup.position.set(wp.x, wp.y, wp.z);

          const wMesh = new THREE.Mesh(wheelGeo, wheelMat);
          wMesh.rotation.z = Math.PI / 2;
          wMesh.castShadow = true;
          wGroup.add(wMesh);

          vGroup.add(wGroup);
          wheels.push(wGroup as any);
        });
      }

      this.scene.add(vGroup);
      group = vGroup;
      this.vehicleMeshes.set(vehicle.id, group);
      this.vehicleWheelMeshes.set(vehicle.id, wheels);
    }

    // Update Transform
    group.position.set(vehicle.position.x, vehicle.position.y, vehicle.position.z);
    group.rotation.y = vehicle.rotationY;

    // Steering turn on front wheels (first 2 wheels)
    if (wheels.length >= 2) {
      wheels[0].rotation.y = vehicle.steerAngle;
      wheels[1].rotation.y = vehicle.steerAngle;
    }

    // Spin wheels according to speed
    if (Math.abs(vehicle.speed) > 0.05) {
      wheels.forEach((w) => {
        w.children.forEach((c) => {
          c.rotation.x += vehicle.speed * 0.15;
        });
      });
    }
  }

  public removeVehicleMesh(id: string) {
    const group = this.vehicleMeshes.get(id);
    if (group) {
      this.scene.remove(group);
      this.vehicleMeshes.delete(id);
      this.vehicleWheelMeshes.delete(id);
    }
  }

  // Gun firing flash effect
  public triggerMuzzleFlash() {
    this.muzzleFlashMesh.material.opacity = 0.9;
    this.muzzleFlashMesh.rotation.z = Math.random() * Math.PI;
    this.muzzleLight.intensity = 3.5;
    this.recoilAmount = 0.08;

    setTimeout(() => {
      this.muzzleFlashMesh.material.opacity = 0;
      this.muzzleLight.intensity = 0;
    }, 45);
  }

  // Spawn bullet tracer from barrel to impact
  public spawnBulletTracer(from: THREE.Vector3, to: THREE.Vector3) {
    const points = [from.clone(), to.clone()];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffea00,
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.activeTracers.push({ mesh: line, age: 0, maxAge: 0.09 });
  }

  // Impact spark particle burst
  public spawnImpactSparks(pos: THREE.Vector3, color: number = 0xffaa00) {
    const count = 12;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = pos.x;
      positions[i * 3 + 1] = pos.y;
      positions[i * 3 + 2] = pos.z;
      velocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          Math.random() * 5 + 1,
          (Math.random() - 0.5) * 6
        )
      );
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color,
      size: 0.25,
      transparent: true,
      opacity: 0.9,
    });
    const pMesh = new THREE.Points(geo, mat);
    this.scene.add(pMesh);
    this.activeSparks.push({ particles: pMesh, velocities, age: 0 });
  }

  // Raycast bullet shot from screen center / camera
  public castBullet(spread: number, maxRange: number): HitResult {
    // Center of screen crosshair ray
    const raycaster = new THREE.Raycaster();
    const rayDir = new THREE.Vector3(0, 0, -1);

    // Apply weapon spread
    if (spread > 0) {
      rayDir.x += (Math.random() - 0.5) * spread;
      rayDir.y += (Math.random() - 0.5) * spread;
      rayDir.normalize();
    }

    rayDir.applyQuaternion(this.camera.quaternion);
    raycaster.set(this.camera.position, rayDir);
    raycaster.far = maxRange;

    // Objects to test against: Ground, Colliders, Gloo Walls, Enemies
    const testTargets: THREE.Object3D[] = [...this.colliders];
    this.glooWallMeshes.forEach((g) => testTargets.push(g));
    this.enemyMeshes.forEach((g) => testTargets.push(g));

    const intersects = raycaster.intersectObjects(testTargets, true);

    if (intersects.length > 0) {
      const firstHit = intersects[0];
      let currentObj: THREE.Object3D | null = firstHit.object;
      let targetType: HitResult['targetType'] = 'ground';
      let enemyId: string | undefined;
      let isHeadshot = false;

      while (currentObj && currentObj !== this.scene) {
        if (currentObj.name.startsWith('enemy_')) {
          targetType = 'enemy';
          enemyId = currentObj.name.replace('enemy_', '');
          if (firstHit.object.name.startsWith('head_')) {
            isHeadshot = true;
          }
          break;
        }
        if (currentObj.name.startsWith('gloo_')) {
          targetType = 'gloo';
          break;
        }
        if (currentObj.name === 'ground') {
          targetType = 'ground';
        } else if (currentObj !== this.playerGroup) {
          targetType = 'wall';
        }
        currentObj = currentObj.parent;
      }

      return {
        hit: true,
        distance: firstHit.distance,
        point: firstHit.point,
        targetType,
        enemyId,
        isHeadshot,
      };
    }

    // Miss into sky / maximum range
    const missPoint = this.camera.position.clone().add(rayDir.multiplyScalar(maxRange));
    return {
      hit: false,
      distance: maxRange,
      point: missPoint,
    };
  }

  // Update Camera & Player Movement Animation
  public update(
    delta: number,
    playerPos: { x: number; y: number; z: number },
    isMoving: boolean,
    isSprinting: boolean,
    isCrouching: boolean,
    alokSkillActive: boolean,
    safeZone: SafeZoneState,
    inVehicle: boolean = false,
    vehicleYaw?: number
  ) {
    this.animTimer += delta;

    if (inVehicle) {
      // Driver seated posture
      this.playerGroup.position.set(playerPos.x, playerPos.y + 0.35, playerPos.z);
      this.playerGroup.rotation.y = vehicleYaw !== undefined ? vehicleYaw : this.cameraYaw;
      this.playerLeftLeg.rotation.x = -Math.PI / 3.2;
      this.playerRightLeg.rotation.x = -Math.PI / 3.2;
      this.playerLeftArm.rotation.x = -Math.PI / 3.0;
      this.playerRightArm.rotation.x = -Math.PI / 3.0;
      this.playerTorso.visible = true;

      // Elevated Third-Person Vehicle Chase Camera
      const camDist = 6.8;
      const camHeight = 2.6;
      const cosPitch = Math.cos(this.cameraPitch);
      const sinPitch = Math.sin(this.cameraPitch);

      const offsetX = Math.sin(this.cameraYaw) * (-camDist * cosPitch);
      const offsetZ = Math.cos(this.cameraYaw) * (-camDist * cosPitch);
      const offsetY = camHeight + sinPitch * camDist;

      this.camera.position.set(
        playerPos.x + offsetX,
        playerPos.y + offsetY,
        playerPos.z + offsetZ
      );

      const lookDist = 45;
      const lookTarget = new THREE.Vector3(
        playerPos.x + Math.sin(this.cameraYaw) * lookDist * cosPitch,
        playerPos.y + 1.2 - sinPitch * lookDist,
        playerPos.z + Math.cos(this.cameraYaw) * lookDist * cosPitch
      );
      this.camera.lookAt(lookTarget);

      // Alok skill aura sync
      if (this.alokAuraMesh) {
        this.alokAuraMesh.visible = alokSkillActive;
        if (alokSkillActive) this.alokAuraMesh.rotation.z += delta * 1.5;
      }
      return;
    }

    // 1. Position & rotate player group
    this.playerGroup.position.set(playerPos.x, playerPos.y, playerPos.z);
    this.playerGroup.rotation.y = this.cameraYaw;

    // 2. Crouch posture
    const targetTorsoY = isCrouching ? 0.9 : 1.25;
    this.playerTorso.position.y += (targetTorsoY - this.playerTorso.position.y) * 0.2;

    // 3. Procedural Limb Animation
    if (isMoving) {
      const speedMultiplier = isSprinting ? 14 : 9;
      const swing = Math.sin(this.animTimer * speedMultiplier) * (isSprinting ? 0.65 : 0.4);

      this.playerLeftLeg.rotation.x = swing;
      this.playerRightLeg.rotation.x = -swing;
      this.playerLeftArm.rotation.x = -swing * 0.7;
      this.playerRightArm.rotation.x = swing * 0.4;
    } else {
      // Idle breathing
      this.playerLeftLeg.rotation.x *= 0.85;
      this.playerRightLeg.rotation.x *= 0.85;
      this.playerLeftArm.rotation.x = Math.sin(this.animTimer * 2) * 0.05;
      this.playerRightArm.rotation.x = Math.sin(this.animTimer * 2) * 0.05;
    }

    // Aiming arm lift
    if (this.isAiming) {
      this.playerRightArm.rotation.x = -Math.PI / 2 + this.cameraPitch * 0.5;
      this.playerLeftArm.rotation.x = -Math.PI / 2.3 + this.cameraPitch * 0.5;
    }

    // Recoil recovery
    if (this.recoilAmount > 0) {
      this.cameraPitch += this.recoilAmount * 0.15;
      this.recoilAmount *= 0.7;
    }

    // 4. Camera Follow Logic
    if (this.viewMode === 'tpp') {
      // Third-Person Over-the-Shoulder camera (Free Fire standard)
      const camDist = this.isAiming ? 1.6 : 3.4;
      const camHeight = isCrouching ? 1.3 : 1.8;
      const shoulderOffset = this.isAiming ? 0.45 : 0.65;

      const cosPitch = Math.cos(this.cameraPitch);
      const sinPitch = Math.sin(this.cameraPitch);

      // Camera offset relative to player yaw
      const offsetX = Math.sin(this.cameraYaw) * (-camDist * cosPitch) + Math.cos(this.cameraYaw) * shoulderOffset;
      const offsetZ = Math.cos(this.cameraYaw) * (-camDist * cosPitch) - Math.sin(this.cameraYaw) * shoulderOffset;
      const offsetY = camHeight + sinPitch * camDist;

      this.camera.position.set(
        playerPos.x + offsetX,
        playerPos.y + offsetY,
        playerPos.z + offsetZ
      );

      // Look at target point ahead of player
      const lookDist = 50;
      const lookTarget = new THREE.Vector3(
        playerPos.x + Math.sin(this.cameraYaw) * lookDist * cosPitch,
        playerPos.y + camHeight - sinPitch * lookDist,
        playerPos.z + Math.cos(this.cameraYaw) * lookDist * cosPitch
      );
      this.camera.lookAt(lookTarget);

      this.playerTorso.visible = true;
      this.playerLeftLeg.visible = true;
      this.playerRightLeg.visible = true;
    } else {
      // First-Person Mode
      this.camera.position.set(playerPos.x, playerPos.y + (isCrouching ? 1.0 : 1.6), playerPos.z);
      const cosPitch = Math.cos(this.cameraPitch);
      const sinPitch = Math.sin(this.cameraPitch);
      const lookTarget = new THREE.Vector3(
        playerPos.x + Math.sin(this.cameraYaw) * 50 * cosPitch,
        this.camera.position.y - sinPitch * 50,
        playerPos.z + Math.cos(this.cameraYaw) * 50 * cosPitch
      );
      this.camera.lookAt(lookTarget);

      // Hide player body in FPP
      this.playerTorso.visible = false;
      this.playerLeftLeg.visible = false;
      this.playerRightLeg.visible = false;
    }

    // 5. Alok Aura Animation
    if (alokSkillActive) {
      this.alokAuraMesh.material.opacity = 0.8;
      this.alokAuraMesh.rotation.z += 0.05;
      const pulse = 4.8 + Math.sin(this.animTimer * 8) * 0.2;
      this.alokAuraMesh.scale.set(pulse / 5, pulse / 5, 1);
    } else {
      this.alokAuraMesh.material.opacity = 0;
    }

    // 6. Safe Zone Position & Radius
    this.safeZoneMesh.position.set(safeZone.currentCenter.x, 40, safeZone.currentCenter.z);
    const radiusScale = safeZone.currentRadius / 150;
    this.safeZoneMesh.scale.set(radiusScale, 1, radiusScale);
    this.safeZoneMesh.rotation.y += 0.005;

    // 7. Update Smoke Particles on Airdrop
    const smokePos = this.smokeParticles.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < smokePos.count; i++) {
      let y = smokePos.getY(i) + delta * 8;
      if (y > 50) y = 2;
      smokePos.setY(i, y);
    }
    smokePos.needsUpdate = true;

    // 8. Update Bullet Tracers
    for (let i = this.activeTracers.length - 1; i >= 0; i--) {
      const tracer = this.activeTracers[i];
      tracer.age += delta;
      if (tracer.age >= tracer.maxAge) {
        this.scene.remove(tracer.mesh);
        this.activeTracers.splice(i, 1);
      }
    }

    // 9. Update Sparks
    for (let i = this.activeSparks.length - 1; i >= 0; i--) {
      const spark = this.activeSparks[i];
      spark.age += delta;
      if (spark.age > 0.3) {
        this.scene.remove(spark.particles);
        this.activeSparks.splice(i, 1);
        continue;
      }

      const pPos = spark.particles.geometry.attributes.position as THREE.BufferAttribute;
      for (let j = 0; j < pPos.count; j++) {
        pPos.setX(j, pPos.getX(j) + spark.velocities[j].x * delta);
        pPos.setY(j, pPos.getY(j) + spark.velocities[j].y * delta);
        pPos.setZ(j, pPos.getZ(j) + spark.velocities[j].z * delta);
        spark.velocities[j].y -= 9.8 * delta; // Gravity
      }
      pPos.needsUpdate = true;
    }

    // 10. Render
    this.renderer.render(this.scene, this.camera);
  }

  // Project 3D coordinate to 2D screen coordinate for damage numbers
  public toScreenXY(pos: THREE.Vector3): { x: number; y: number } {
    const p = pos.clone().project(this.camera);
    const hw = this.renderer.domElement.clientWidth / 2;
    const hh = this.renderer.domElement.clientHeight / 2;
    return {
      x: p.x * hw + hw,
      y: -p.y * hh + hh,
    };
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public destroy() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
