import { GameObjects, Scene } from 'phaser'
import Coins from '../Coins'

export default class DayOverview extends Scene {
  constructor() {
    super('DayOverview')
  }

  preload() {
    this.load.image('overviewBtn', 'assets/buyButton.png')
  }

  create() {
    this.scoreInfo()

    this.upgradeStore()
    this.startNextDay()

    new Coins(this)
  }

  async scoreInfo() {
    const { width, height } = this.scale
    const completedOrders = this.registry.get('completedOrders') as {
      [truckId: string]: { idleTime: number }
    }

    const totalCompleted = Object.keys(completedOrders ?? {}).length

    const totalIdleTime = Object.values(completedOrders ?? {}).reduce<number>(
      (total, { idleTime }) => {
        return total + idleTime
      },
      0,
    )

    const completed = this.add
      .text(width * 0.5, height * 0.3, `Completed Orders: ${totalCompleted}`, {
        fontSize: 20,
        color: '#000',
      })
      .setOrigin(0.5)
      .setVisible(false)

    const idleTime = this.add
      .text(width * 0.5, height * 0.4, `Total Idle Time: ${totalIdleTime}`, {
        fontSize: 20,
        color: '#000',
      })
      .setOrigin(0.5)
      .setVisible(false)

    const completedEarning = totalCompleted * 20
    const idlePenalty = Math.floor(totalIdleTime * 0.5)
    const totalEarnings = completedEarning - idlePenalty

    const earnings = this.add
      .text(width * 0.5, height * 0.5, `Total Earnings: ${totalEarnings}`, {
        fontSize: 20,
        color: '#000',
      })
      .setOrigin(0.5)
      .setVisible(false)

    this.animateText(completed)
      .then(() => {
        return this.animateText(idleTime)
      })
      .then(() => {
        return this.animateText(earnings)
      })
      .then(() => {
        this.registry.inc('coins', totalEarnings)
      })
  }

  upgradeStore() {
    const { width, height } = this.scale

    const toUpgradeStoreBtn = this.add
      .image(width * 0.25, height - 75, 'overviewBtn')
      .setDisplaySize(200, 50)
      .setInteractive()

    this.add
      .text(toUpgradeStoreBtn.x, toUpgradeStoreBtn.y, 'Visit Store', {
        fontSize: 20,
        color: '#000',
        align: 'center',
      })
      .setOrigin(0.5)

    toUpgradeStoreBtn.on('pointerover', () =>
      toUpgradeStoreBtn.setTint(0x66ff7f),
    )
    toUpgradeStoreBtn.on('pointerout', () => toUpgradeStoreBtn.clearTint())
    toUpgradeStoreBtn.on('pointerdown', () => {
      this.startNextScene('UpgradeStore')
    })
  }

  startNextDay() {
    const { width, height } = this.scale

    const toNextDayBtn = this.add
      .image(width * 0.75, height - 75, 'overviewBtn')
      .setDisplaySize(200, 50)
      .setInteractive()

    this.add
      .text(toNextDayBtn.x, toNextDayBtn.y, 'Start Next Day', {
        fontSize: 20,
        color: '#000',
        align: 'center',
      })
      .setOrigin(0.5)

    toNextDayBtn.on('pointerover', () => toNextDayBtn.setTint(0x66ff7f))
    toNextDayBtn.on('pointerout', () => toNextDayBtn.clearTint())
    toNextDayBtn.on('pointerdown', () => {
      const baseTrucks = 5
      const yardLevel = this.registry.get('yardLevel')
      const totalTrucks = baseTrucks + Math.floor(yardLevel * 1.5)
      this.registry.set('sequence', { totalTrucks })
      this.startNextScene('Yard')
    })
  }

  startNextScene(sceneKey: string) {
    //this.registry.events.removeListener('changedata')
    this.scene.start(sceneKey)
  }

  animateText(target: GameObjects.Text, speedInMs = 25) {
    // store original text
    const message = target.text
    const invisibleMessage = message.replace(/[^ ]/g, ' ')

    // clear text on screen
    target.text = ''
    target.setVisible(true)

    // mutable state for visible text
    let visibleText = ''

    // use a Promise to wait for the animation to complete
    return new Promise<void>((resolve) => {
      const timer = target.scene.time.addEvent({
        delay: speedInMs,
        loop: true,
        callback() {
          // if all characters are visible, stop the timer
          if (target.text === message) {
            timer.destroy()
            return resolve()
          }

          // add next character to visible text
          visibleText += message[visibleText.length]

          // right pad with invisibleText
          const invisibleText = invisibleMessage.substring(visibleText.length)

          // update text on screen
          target.text = visibleText + invisibleText
        },
      })
    })
  }
}










