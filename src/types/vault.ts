export type VaultCategory = 'bundles' | 'weapons' | 'gloowall' | 'backpacks';

export type ItemRarity = 'mythic' | 'legendary' | 'epic' | 'rare';

export interface VaultItem {
  id: string;
  name: string;
  category: VaultCategory;
  rarity: ItemRarity;
  description: string;
  perk?: string;
  targetId?: string; // e.g. 'ak47', 'mp40', 'gloo', 'alok'
  previewColor: string;
  secondaryColor?: string;
  icon: string;
  isEquipped: boolean;
}
