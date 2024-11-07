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
    this.load.image('title', 'assets/title.png')
    this.load.image('geolithic', 'assets/geolithic_studios.png')
  }

  create() {
    this.add.image(1024 / 2, 768 / 2, 'title-background')
    this.gameTitle()
    this.startButton()
    this.quit()
    this.geolithicStudios()

    EventBus.emit('current-scene-ready', this)
  }

  gameTitle() {
    const { width, height } = this.scale

    this.add.image(width * 0.5, height * 0.2, 'title').setOrigin(0.5)
  }

  startButton() {
    const { width, height } = this.scale

    const startBtn = this.add
      .image(width * 0.5, height * 0.5, 'menu-button')
      .setDisplaySize(300, 100)
      .setOrigin(0.5)
      .setInteractive()

    this.add
      .text(startBtn.x, startBtn.y, 'Start', {
        fontSize: 50,
        fontFamily: 'verdana',
        fontStyle: 'bold',
        shadow: {
          offsetX: 4,
          offsetY: 4,
          blur: 5,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5)

    startBtn.on('pointerover', () => startBtn.setTint(0x66ff7f))
    startBtn.on('pointerout', () => startBtn.clearTint())

    startBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0)
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          this.scene.start('Yard')
        },
      )
      this.registry.set('sequence', { totalTrucks: 5 })
    })
  }

  quit() {
    const { width, height } = this.scale

    const quit = this.add
      .image(width * 0.5, height * 0.7, 'menu-button')
      .setDisplaySize(300, 100)
      .setOrigin(0.5)
      .setInteractive()

    this.add
      .text(quit.x, quit.y, 'Quit', {
        fontSize: 50,
        fontFamily: 'verdana',
        fontStyle: 'bold',
        shadow: {
          offsetX: 4,
          offsetY: 4,
          blur: 5,
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5)

    quit.on('pointerover', () => quit.setTint(0x66ff7f))
    quit.on('pointerout', () => quit.clearTint())

    quit.on('pointerdown', () => {
      this.scene.start('Yard')
    })
  }

  geolithicStudios() {
    const { width, height } = this.scale

    this.add
      .image(width * 0.5, height * 0.9, 'geolithic')
      .setOrigin(0.5)
      .setScale(0.5)
  }
}
