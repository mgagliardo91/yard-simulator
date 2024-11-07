// Update to Generate Header
// Add CoinFont color override
// Add show day number
// Optional: Implement Pause menu

export default class Coins extends Phaser.GameObjects.Container {
  scene: Phaser.Scene

  coinSprite: Phaser.GameObjects.Image
  coinCount: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene, textColor = '#000') {
    super(scene)

    this.scene = scene

    const { width } = this.scene.scale

    const coinSprite = this.scene.add.image(width - 60, 30, 'coin')

    this.coinCount = this.scene.add
      .text(coinSprite.x - 60, coinSprite.y, this.scene.registry.get('coins'), {
        fontSize: 20,
        color: textColor,
      })
      .setOrigin(0.5)

    this.scene.add.existing(this)

    this.scene.registry.events.on(
      'changedata',
      (_: unknown, key: string, value: number) => {
        if (key === 'coins') {
          this.animate(value)
        }
      },
    )
  }

  animate(newCount: number) {
    let currentCount = Number(this.coinCount.text)

    const change = newCount > currentCount ? 1 : -1

    const totalChange = Math.abs(newCount - currentCount)

    const setCoins = (count: number) => {
      this.coinCount.setText(`${count}`)
    }

    const baseDelay = 50

    // use a Promise to wait for the animation to complete
    return new Promise<void>((resolve) => {
      const timer = this.scene.time.addEvent({
        delay: baseDelay,
        loop: true,
        callback() {
          // reduce delay
          const currentChange = Math.abs(newCount - currentCount)
          this.delay =
            baseDelay - (baseDelay - 1) * (currentChange / totalChange)
          if (currentCount === newCount) {
            timer.destroy()
            return resolve()
          }

          currentCount += change

          setCoins(currentCount)
        },
      })
    })
  }
}

