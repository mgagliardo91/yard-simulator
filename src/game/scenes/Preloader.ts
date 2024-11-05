import { Scene } from 'phaser';
import { registerUpgradeConfigs } from '../../config/upgrades'

export class Preloader extends Scene {
  constructor() {
    super('Preloader')
  }

  init() {
    this.registry
    //  We loaded this image in our Boot Scene, so we can display it here
    // this.add.image(0, 0, 'background');

    //  A simple progress bar. This is the outline of the bar.
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff)

    //  This is the progress bar itself. It will increase in size from the left based on the % of progress.
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff)

    //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
    this.load.on('progress', (progress: number) => {
      //  Update the progress bar (our bar is 464px wide, so 100% = 464px)
      bar.width = 4 + 460 * progress
    })

    this.createGameState()
  }

  createGameState() {
    this.registry.set('coins', 0)
    this.registry.set('day', 1)

    registerUpgradeConfigs(this.registry)
  }

  preload() {
    //  Load the assets for the game - Replace with your own assets
    this.load.setPath('assets')

    // Common images
    this.load.image('coin', 'coin.png')
    this.load.image('title-background', 'yard-sim-bg.jpg')
    this.load.image('background', 'background.png')
    this.load.image('yard', 'yard_space.png')

    // Level Art
    this.load.image('warehouse', 'level/Warehouse.png')
    this.load.image('dock_door', 'level/dock_door.png')
    this.load.image('dock_door_open', 'level/dock_door_open.png')
    this.load.image('yard_parking', 'level/yard_parking.png')
    this.load.image('dock_separator', 'level/dock_space_separator.png')
    this.load.image('yard_separator', 'level/yard_space_separator.png')
    this.load.image('yard_fence', 'level/yard_fence.png')
    this.load.image('check_in_booth', 'level/check_in.png')
    this.load.image('main_road', 'level/main_road.png')
    this.load.spritesheet('exit', 'level/enter_exit.png', {frameWidth: 100, frameHeight: 140, endFrame: 0})
    this.load.spritesheet('enter', 'level/enter_exit.png', {
      frameWidth: 100,
      frameHeight: 140,
      startFrame: 1,
    })

    // Sprites
    this.load.spritesheet('trailer', 'trailer.png', {
      frameWidth: 320,
      frameHeight: 320,
    })

    this.load.spritesheet('worker', 'workerSpritesheet.png', {
      frameWidth: 32,
      frameHeight: 32,
    })

    const uniqueCars = 4
    this.registry.set('uniqueCars', uniqueCars)
    for (let i = 0; i < uniqueCars; i++) {
      this.load.spritesheet(`car${i}`, `cars/car-${i}.png`, {
        frameWidth: 320,
        frameHeight: 105,
      })
    }
  }

  create() {
    //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
    //  For example, you can define global animations here, so we can use them in other scenes.

    //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
    this.scene.start('MainMenu')
  }












}