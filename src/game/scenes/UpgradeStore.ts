import { GameObjects, Scene } from 'phaser'
import { EventBus } from '../EventBus'
import { getUpgradeConfig, getUpgrades, Upgrades } from '../../config/upgrades'

export default class UpgradeStore extends Scene {
  title: GameObjects.Text

  buyButtons: GameObjects.Image

  headerHeight: number = 30

  coinCount: GameObjects.Text

  constructor() {
    super('UpgradeStore')
  }

  preload() {
    this.load.image('buy-button', 'assets/buyButton.png')
    this.load.image('cursor', 'assets/cursor.png')
    this.load.image('coin', 'assets/coin.png')
  }

  create() {
    this.renderTitle()
    this.renderCoinCount()
    this.renderUpgradeList()
    this.renderStartNextDay()

    EventBus.emit('current-scene-ready', this)
  }

  renderTitle() {
    const { width } = this.scale
    this.title = this.add
      .text(width / 2, this.headerHeight, 'Upgrades', {
        fontFamily: 'Arial Black',
        fontSize: 38,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(100)
  }

  renderCoinCount() {
    const { width } = this.scale

    const coinSprite = this.add.image(width - 60, this.headerHeight, 'coin')

    this.coinCount = this.add
      .text(coinSprite.x - 50, coinSprite.y, this.registry.get('coins'), {
        fontSize: 20,
        color: '#000',
      })
      .setOrigin(0.5)

    this.registry.events.on(
      'changedata',
      (_: unknown, key: string, value: string) => {
        if (key === 'coins') {
          this.coinCount.setText(value)
        }
      },
    )
  }

  hasRequiredDeps(key: Upgrades) {
    return (getUpgradeConfig(key).deps ?? []).every(([upgrade, lvl]) => {
      return this.registry.get(upgrade) >= lvl
    })
  }

  renderUpgradeList() {
    const xOrigin = 100
    const yOrigin = 200
    const height = 100

    getUpgrades().forEach((key, i) => {
      this.renderUpgrade([xOrigin, yOrigin + height * i], key)
    })
  }

  renderUpgrade([x, y]: [number, number], upgradeKey: Upgrades) {
    const config = getUpgradeConfig(upgradeKey)
    const { width } = this.scale

    const labelObj = this.add
      .text(x, y, '?', { fontSize: 20, color: '#000', align: 'right' })
      .setOrigin(0, 0.5)

    const upgradeStateObj = this.add
      .text(width * 0.5, y, '', {
        fontSize: 20,
        color: '#000',
      })
      .setOrigin(0.5, 0.5)

    const refreshLabel = () => {
      const hasDeps = this.hasRequiredDeps(upgradeKey)

      if (hasDeps) {
        labelObj.setText(config.label)
      } else {
        labelObj.setText('?')
      }
    }
    const refreshUpgradeState = () => {
      const hasDeps = this.hasRequiredDeps(upgradeKey)

      if (hasDeps) {
        const currentLvl = this.registry.get(upgradeKey)
        const upgradeText = Array(config.upgrades)
          .fill(null)
          .map((_, i) => {
            if (currentLvl >= i + 1) {
              return '+'
            }
            return '_'
          })
          .join(' ')
        upgradeStateObj.setText(upgradeText)
      } else {
        upgradeStateObj.setText('?')
      }
    }

    if (config.deps) {
      const deps = config.deps.map(([dep]) => dep)
      this.registry.events.on('changedata', (_: unknown, key: Upgrades) => {
        if (deps.includes(key)) {
          refreshLabel()
          refreshUpgradeState()
        }
      })
    }

    this.registry.events.on('changedata', (_: unknown, key: string) => {
      if (key === upgradeKey) {
        refreshUpgradeState()
      }
    })

    refreshLabel()
    refreshUpgradeState()
    this.renderBuyButton([width - 100, y], upgradeKey)
  }

  renderBuyButton([x, y]: [number, number], upgradeKey: Upgrades) {
    const config = getUpgradeConfig(upgradeKey)
    const buyButton = this.add
      .image(x - 75, y, 'buy-button')
      .setDisplaySize(150, 50)
      .setOrigin(0.5)

    const buttonTextObj = this.add
      .text(buyButton.x, buyButton.y, '', {
        fontSize: 20,
        color: '#000',
        align: 'center',
      })
      .setOrigin(0.5)

    const calcCost = () => {
      const currentUpgrade = this.registry.get(upgradeKey)
      return (
        config.baseCost + config.baseCost * (currentUpgrade * config.costMult)
      )
    }

    const refreshButton = () => {
      const currentUpgrade = this.registry.get(upgradeKey)
      const coins = this.registry.get('coins')
      const cost = calcCost()
      const canAfford = coins >= cost
      const hasDeps = this.hasRequiredDeps(upgradeKey)

      if (!hasDeps) {
        buyButton.disableInteractive()
        buttonTextObj.setText(`?`)
      } else if (currentUpgrade >= config.upgrades) {
        buyButton.disableInteractive()
        buyButton.setTint(0xb4afaf)
        buttonTextObj.setText(`Max`)
      } else if (canAfford) {
        buyButton.setInteractive()
        buttonTextObj.setText(`Buy (${cost})`)
      } else {
        buyButton.disableInteractive()
        buyButton.setTint(0xffa965)
        buttonTextObj.setText(`Buy (${cost})`)
      }
    }

    buyButton.on('pointerover', () => buyButton.setTint(0x66ff7f))
    buyButton.on('pointerout', () => buyButton.clearTint())
    buyButton.on('pointerdown', () => {
      const cost = calcCost()

      this.registry.set('coins', this.registry.get('coins') - cost)
      this.registry.set(upgradeKey, this.registry.get(upgradeKey) + 1)
    })

    this.registry.events.on('changedata', (_: unknown, key: string) => {
      if (['coins', upgradeKey].includes(key)) {
        refreshButton()
      }
    })

    if (config.deps) {
      const deps = config.deps.map(([dep]) => dep)
      this.registry.events.on('changedata', (_: unknown, key: Upgrades) => {
        if (deps.includes(key)) {
          refreshButton()
        }
      })
    }

    refreshButton()
  }

  renderStartNextDay() {
    const { width, height } = this.scale
    const nextDayButton = this.add
      .image(width - 75, height - 50, 'buy-button')
      .setDisplaySize(100, 33)
      .setOrigin(0.5)
      .setInteractive()

    this.add
      .text(nextDayButton.x, nextDayButton.y, 'Start Next Day', {
        fontSize: 10,
        color: '#000',
        align: 'center',
      })
      .setOrigin(0.5)

    nextDayButton.on('pointerover', () => nextDayButton.setTint(0x66ff7f))
    nextDayButton.on('pointerout', () => nextDayButton.clearTint())
    nextDayButton.on('pointerdown', () => {
      this.scene.start('Yard')
    })
  }
}

