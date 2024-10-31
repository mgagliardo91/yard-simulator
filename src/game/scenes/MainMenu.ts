import { GameObjects, Scene } from 'phaser';

import { EventBus } from '../EventBus';

export class MainMenu extends Scene {
  background: GameObjects.Image
  logo: GameObjects.Image
  title: GameObjects.Text
  logoTween: Phaser.Tweens.Tween | null

  constructor() {
    super('MainMenu')
  }

  preload() {
    this.load.image('menu-button', 'assets/buyButton.png')
  }

  create() {
    this.startButton()
    this.quit()

    EventBus.emit('current-scene-ready', this)
  }

  startButton() {
    const { width, height } = this.scale

    const start = this.add
      .image(width * 0.5, height * 0.5 - 75, 'menu-button')
      .setDisplaySize(300, 100)
      .setOrigin(0.5)
      .setInteractive()

    start.on('pointerover', () => start.setTint(0x66ff7f))
    start.on('pointerout', () => start.clearTint())

    start.on('pointerdown', () => {
      this.registry.set('sequence', { totalTrucks: 1 })
      this.scene.start('Yard')
    })
  }

  quit() {
    const { width, height } = this.scale

    const quit = this.add
      .image(width * 0.5, height * 0.5 + 75, 'menu-button')
      .setDisplaySize(300, 100)
      .setOrigin(0.5)
      .setInteractive()

    quit.on('pointerover', () => quit.setTint(0x66ff7f))
    quit.on('pointerout', () => quit.clearTint())

    quit.on('pointerdown', () => {
      this.scene.start('Yard')
    })
  }
}



























