import { Data } from 'phaser'

export type Upgrades =
  | 'yardLevel'
  | 'truckSpeed'
  | 'workerSpeed'
  | 'dockSpaces'
  | 'yardSpaces'

export interface UpgradeConfig {
  label: string
  upgrades: number
  baseCost: number
  costMult: number
  deps?: [Upgrades, number][]
}

export const UpgradeConfigs: { [key in Upgrades]: UpgradeConfig } = {
  yardLevel: {
    label: 'Yard Level',
    upgrades: 5,
    baseCost: 50,
    costMult: 2,
  },
  truckSpeed: {
    deps: [['yardLevel', 1]],
    label: 'Yard Speed Limit',
    upgrades: 4,
    baseCost: 25,
    costMult: 1,
  },
  workerSpeed: {
    deps: [
      ['yardLevel', 1],
      ['truckSpeed', 2],
    ],
    label: 'Worker Speed',
    upgrades: 4,
    baseCost: 20,
    costMult: 1.5,
  },
  yardSpaces: {
    deps: [
      ['yardLevel', 1],
      ['workerSpeed', 2],
    ],
    label: 'Yard Spaces',
    upgrades: 4,
    baseCost: 50,
    costMult: 1.5,
  },
  dockSpaces: {
    deps: [
      ['yardLevel', 2],
      ['yardSpaces', 1],
    ],
    label: 'Dock Spaces',
    upgrades: 4,
    baseCost: 100,
    costMult: 1.5,
  },
}

export const getUpgradeConfig = (key: Upgrades) => {
  return UpgradeConfigs[key]
}

export const getUpgrades = () => {
  return Object.keys(UpgradeConfigs).map((key) => key as Upgrades)
}

export const registerUpgradeConfigs = (gameRegistry: Data.DataManager) => {
  Object.keys(UpgradeConfigs).forEach((key) => {
    gameRegistry.set(key, 0)
  })
}

