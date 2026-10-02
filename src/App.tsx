import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ThreeEngine } from './game/threeEngine';
import { GameController } from './game/gameController';
import { LobbyView } from './components/LobbyView';
import { GameHUD } from './components/GameHUD';
import { GameOverModal } from './components/GameOverModal';
import { ArmoryModal } from './components/ArmoryModal';
import { VaultModal } from './components/VaultModal';
import { SettingsModal } from './components/SettingsModal';
import { Character, GameSettings } from './types/game';
import { VaultItem } from './types/vault';
import { INITIAL_VAULT_ITEMS } from './data/vaultItems';
import { soundManager } from './audio/soundManager';

export default function App() {
  const [currentView, setCurrentView] = useState<'lobby' | 'match'>('lobby');
  const [isArmoryOpen, setIsArmoryOpen] = useState(false);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>(INITIAL_VAULT_ITEMS);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    mouseSensitivity: 0.0025,
    soundVolume: 0.8,
    musicVolume: 0.7,
    fieldOfView: 65,
    viewMode: 'tpp',
    graphicsQuality: 'high',
  });

  // Game over state
  const [gameOverData, setGameOverData] = useState<{
    isOpen: boolean;
    isWin: boolean;
    kills: number;
    damage: number;
    time: number;
  }>({
    isOpen: false,
    isWin: false,
    kills: 0,
    damage: 0,
    time: 0,
  });

  // HUD re-render tick
  const [, setHudTick] = useState(0);

  // 3D Canvas container & instance refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ThreeEngine | null>(null);
  const controllerRef = useRef<GameController | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Touch tracking for mobile
  const touchStartRef = useRef<{ id: number; x: number; y: number } | null>(null);

  // Handle Mute toggle
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundManager.setMuted(next);
      return next;
    });
  }, []);

  // Handle Vault item equip
  const handleEquipVaultItem = useCallback((item: VaultItem) => {
    setVaultItems((prev) =>
      prev.map((i) => {
        if (i.category === item.category) {
          return { ...i, isEquipped: i.id === item.id };
        }
        return i;
      })
    );

    // Apply weapon skin color/enhancements in game if active
    if (item.category === 'weapons' && item.targetId && controllerRef.current) {
      const activeW = controllerRef.current.getActiveWeapon();
      if (activeW && activeW.id === item.targetId) {
        activeW.color = item.previewColor;
        controllerRef.current.engine.rebuildWeaponMesh(activeW.id);
      }
    }
  }, []);

  // Handle Settings update
  const handleUpdateSettings = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    soundManager.setVolume(newSettings.soundVolume);
    if (engineRef.current) {
      engineRef.current.viewMode = newSettings.viewMode;
    }
  }, []);

  // Start Match from Lobby
  const handleStartGame = useCallback((character: Character) => {
    setCurrentView('match');
    setGameOverData((prev) => ({ ...prev, isOpen: false }));

    // Initialize 3D Engine if not created yet
    setTimeout(() => {
      if (!canvasContainerRef.current) return;

      if (!engineRef.current) {
        const engine = new ThreeEngine(canvasContainerRef.current);
        const controller = new GameController(engine, settings);

        controller.onStateUpdate = () => {
          setHudTick((t) => (t + 1) % 1000);
        };

        controller.onGameOver = (isWin, kills, damage, survivalTime) => {
          setGameOverData({
            isOpen: true,
            isWin,
            kills,
            damage,
            time: survivalTime,
          });
        };

        engineRef.current = engine;
        controllerRef.current = controller;
      } else if (controllerRef.current) {
        controllerRef.current.resetGame();
      }

      controllerRef.current?.start();

      // Main Game Loop
      lastTimeRef.current = performance.now();
      const loop = () => {
        const now = performance.now();
        const delta = Math.min((now - lastTimeRef.current) / 1000, 0.1);
        lastTimeRef.current = now;

        if (controllerRef.current && controllerRef.current.isRunning) {
          controllerRef.current.update(delta);
        }

        animFrameIdRef.current = requestAnimationFrame(loop);
      };

      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = requestAnimationFrame(loop);
    }, 50);
  }, [settings]);

  // Restart match from Game Over
  const handlePlayAgain = useCallback(() => {
    setGameOverData((prev) => ({ ...prev, isOpen: false }));
    controllerRef.current?.resetGame();
  }, []);

  // Return to Lobby from Game Over
  const handleReturnLobby = useCallback(() => {
    setGameOverData((prev) => ({ ...prev, isOpen: false }));
    controllerRef.current?.stop();
    setCurrentView('lobby');
  }, []);

  // Deploy Gloo Wall
  const handleDeployGloo = useCallback(() => {
    controllerRef.current?.deployGlooWall();
  }, []);

  // Use Medkit
  const handleUseMedkit = useCallback(() => {
    controllerRef.current?.useMedkit();
  }, []);

  // Activate Skill
  const handleActivateSkill = useCallback(() => {
    controllerRef.current?.activateCharacterSkill();
  }, []);

  // Reload
  const handleReload = useCallback(() => {
    controllerRef.current?.reloadCurrentWeapon();
  }, []);

  // Select Slot
  const handleSelectSlot = useCallback((idx: number) => {
    controllerRef.current?.selectWeaponSlot(idx);
  }, []);

  // Toggle ADS Scope
  const handleToggleScope = useCallback(() => {
    if (controllerRef.current) {
      const current = controllerRef.current.playerStats.isScoped;
      controllerRef.current.playerStats.isScoped = !current;
      controllerRef.current.engine.isAiming = !current;
    }
  }, []);

  // Shoot button on screen
  const handleShootTouchStart = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.isFiring = true;
    }
  }, []);

  const handleShootTouchEnd = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.isFiring = false;
    }
  }, []);

  // Jump button
  const handleJump = useCallback(() => {
    if (controllerRef.current && controllerRef.current.isGrounded) {
      controllerRef.current.playerVelocity.y = 8.5;
      controllerRef.current.isGrounded = false;
    }
  }, []);

  // Crouch button
  const handleCrouch = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.playerStats.isCrouching = !controllerRef.current.playerStats.isCrouching;
    }
  }, []);

  // Pointer lock & Mouse Aim Listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement && engineRef.current) {
        const sens = settings.mouseSensitivity;
        engineRef.current.cameraYaw -= e.movementX * sens;
        engineRef.current.cameraPitch -= e.movementY * sens;

        // Clamp vertical look pitch (-60 deg to +60 deg)
        engineRef.current.cameraPitch = Math.max(
          -Math.PI / 3,
          Math.min(Math.PI / 3, engineRef.current.cameraPitch)
        );
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (currentView !== 'match' || !controllerRef.current?.isRunning) return;

      if (!document.pointerLockElement && canvasContainerRef.current) {
        canvasContainerRef.current.requestPointerLock?.();
      }

      if (e.button === 0) {
        // Left Click Shoot
        controllerRef.current.isFiring = true;
      } else if (e.button === 2) {
        // Right Click Aim Down Sights
        handleToggleScope();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0 && controllerRef.current) {
        controllerRef.current.isFiring = false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentView !== 'match' || !controllerRef.current) return;
      controllerRef.current.keysPressed[e.code] = true;

      if (e.code === 'KeyR') {
        controllerRef.current.reloadCurrentWeapon();
      } else if (e.code === 'KeyG') {
        controllerRef.current.deployGlooWall();
      } else if (e.code === 'KeyF' || e.code === 'KeyE') {
        controllerRef.current.toggleVehicle();
      } else if (e.code === 'Digit4') {
        controllerRef.current.useMedkit();
      } else if (e.code === 'KeyQ') {
        controllerRef.current.activateCharacterSkill();
      } else if (e.code === 'Digit1') {
        controllerRef.current.selectWeaponSlot(0);
      } else if (e.code === 'Digit2') {
        controllerRef.current.selectWeaponSlot(1);
      } else if (e.code === 'Digit3') {
        controllerRef.current.selectWeaponSlot(2);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (controllerRef.current) {
        controllerRef.current.keysPressed[e.code] = false;
      }
    };

    // Touch look controls on right side of mobile screen
    const handleTouchStart = (e: TouchEvent) => {
      if (currentView !== 'match') return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.clientX > window.innerWidth * 0.4) {
          touchStartRef.current = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
          break;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || !engineRef.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchStartRef.current.id) {
          const dx = touch.clientX - touchStartRef.current.x;
          const dy = touch.clientY - touchStartRef.current.y;
          touchStartRef.current.x = touch.clientX;
          touchStartRef.current.y = touch.clientY;

          engineRef.current.cameraYaw -= dx * 0.005;
          engineRef.current.cameraPitch -= dy * 0.005;
          engineRef.current.cameraPitch = Math.max(
            -Math.PI / 3,
            Math.min(Math.PI / 3, engineRef.current.cameraPitch)
          );
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchStartRef.current.id) {
          touchStartRef.current = null;
          break;
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentView, settings.mouseSensitivity, handleToggleScope]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-sans select-none">
      {/* Lobby View */}
      {currentView === 'lobby' && (
        <LobbyView
          onStartGame={handleStartGame}
          onOpenArmory={() => setIsArmoryOpen(true)}
          onOpenVault={() => setIsVaultOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          settings={settings}
          onToggleMute={handleToggleMute}
          isMuted={isMuted}
        />
      )}

      {/* 3D Battle Royale Canvas Container */}
      <div
        ref={canvasContainerRef}
        className={`absolute inset-0 w-full h-full cursor-crosshair ${
          currentView === 'match' ? 'block' : 'hidden'
        }`}
      />

      {/* In-Game HUD Overlay */}
      {currentView === 'match' && controllerRef.current && (
        <GameHUD
          controller={controllerRef.current}
          onDeployGloo={handleDeployGloo}
          onUseMedkit={handleUseMedkit}
          onActivateSkill={handleActivateSkill}
          onReload={handleReload}
          onSelectSlot={handleSelectSlot}
          onToggleScope={handleToggleScope}
          onToggleVehicle={() => controllerRef.current?.toggleVehicle()}
          onShootTouchStart={handleShootTouchStart}
          onShootTouchEnd={handleShootTouchEnd}
          onJump={handleJump}
          onCrouch={handleCrouch}
        />
      )}

      {/* Game Over / Booyah Victory Modal */}
      {gameOverData.isOpen && (
        <GameOverModal
          isWin={gameOverData.isWin}
          kills={gameOverData.kills}
          damage={gameOverData.damage}
          survivalSeconds={gameOverData.time}
          onPlayAgain={handlePlayAgain}
          onReturnLobby={handleReturnLobby}
        />
      )}

      {/* Weapon Armory Modal */}
      {isArmoryOpen && <ArmoryModal onClose={() => setIsArmoryOpen(false)} />}

      {/* Survivor Vault Modal */}
      {isVaultOpen && (
        <VaultModal
          items={vaultItems}
          onEquipItem={handleEquipVaultItem}
          onClose={() => setIsVaultOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
