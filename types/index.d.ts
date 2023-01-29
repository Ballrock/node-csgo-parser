export interface Weapon {
    name: string
    techName: string
    type: string
    defIndex: string
    skins: SkinPaint[]
}

export interface SkinPaint {
    name: string
    techName: string
    weaponTechName: string
    fullName: string
    defIndex: string
    rarity: string
}

export interface Sticker {
    name: string
    techName: string
    defIndex: string
    rarity: string
}

export interface Rarity {
    techName: string
    weaponName: string
    miscName: string
    defIndex: string
    color: string
}

export interface Prefab {
    name: string
    techName: string
    defIndex: string
    type: string
}

export interface MusicKit {
    name: string
    techName: string
    defIndex: string
}

export interface Collection {
    name: string
    techName: string
    content: SkinPaint[]
}