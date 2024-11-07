import { GameObjects, Scene } from 'phaser'
import Coins from '../Coins'
import { TruckOrder } from '../types/order'

interface OrderDetail {
  label: string
  award: number
  bonus: number
}

export default class DayOverview extends Scene {
  clipboard: GameObjects.Image
  constructor() {
    super('DayOverview')
  }

  preload() {
    this.load.image('overviewBtn', 'assets/buyButton.png')
    this.load.image('clipboard', 'assets/clipboard.png')
  }

  create() {
    const { width, height } = this.scale

    this.add.image(1024 / 2, 768 / 2, 'title-background')

    this.clipboard = this.add
      .image(width * 0.5, height * 0.45, 'clipboard')
      .setOrigin(0.5, 0.5)

    this.add
      .text(
        this.clipboard.x,
        this.clipboard.y - this.clipboard.height * 0.25,
        'Daily Report',
        {
          fontSize: 20,
          color: '#000',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
    this.scoreDetails()
    //this.scoreInfo()
    this.upgradeStore()
    this.startNextDay()

    new Coins(this)
  }

  async scoreDetails() {
    const paperWidth = this.clipboard.width * 0.4

    const paperLeft = this.clipboard.x - paperWidth * 0.5
    //const paperRight = this.clipboard.x + paperWidth * 0.5

    const baseHeight = this.clipboard.y - this.clipboard.height * 0.22

    const completedOrders = this.registry.get('completedOrders') as {
      [truckId: string]: { idleTime: number; order: TruckOrder }
    }

    const dailyOrders = Object.values(completedOrders ?? {})

    const { details, earnings } = dailyOrders.reduce<{
      details: OrderDetail[]
      earnings: number
    }>(
      (acc, { idleTime, order }) => {
        const label = `Order # ${order.number}: ${order.cargo}`
        const award = 5 + order.duration
        const bonus =
          order.duration - idleTime > 0 ? order.duration - idleTime : 0

        acc.details.push({
          label,
          award,
          bonus,
        })
        acc.earnings += award + bonus
        return acc
      },
      { details: [], earnings: 0 },
    )

    const detailsPromise = details.reduce<Promise<void>>(
      (renderPromise, order, i) => {
        const y = i * 70
        const yOffset = 18
        return renderPromise
          .then(() => {
            return this.animateText(
              this.add
                .text(paperLeft, baseHeight + y, order.label, {
                  fontSize: 14,
                  color: '#000',
                })
                .setOrigin(0)
                .setVisible(false),
            )
          })
          .then(() => {
            return this.animateText(
              this.add
                .text(
                  paperLeft,
                  baseHeight + y + yOffset,
                  `Earnings: ${order.award}`,
                  {
                    fontSize: 12,
                    color: '#000',
                  },
                )
                .setOrigin(0)
                .setVisible(false),
            )
          })
          .then(() => {
            return this.animateText(
              this.add
                .text(
                  paperLeft,
                  baseHeight + y + yOffset * 2,
                  `Time Bonus: ${order.bonus}`,
                  {
                    fontSize: 12,
                    color: '#000',
                  },
                )
                .setOrigin(0)
                .setVisible(false),
            )
          })
      },
      Promise.resolve(),
    )

    detailsPromise
      .then(() => {
        return this.animateText(
          this.add
            .text(
              this.clipboard.x,
              this.clipboard.height * 0.82,
              `Total Earnings: ${earnings}`,
              {
                fontSize: 15,
                color: '#000',
              },
            )
            .setOrigin(0.2)
            .setVisible(false),
        )
      })
      .then(() => {
        this.registry.inc('coins', earnings)
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
    this.registry.events.removeListener('changedata')
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

