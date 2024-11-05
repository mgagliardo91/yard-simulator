import { Scene } from 'phaser';

type Direction = 'right' | 'left'

type CarDirectionVectors = { start: Phaser.Math.Vector2, end: Phaser.Math.Vector2 }

const carDirections: { [direction in Direction]: CarDirectionVectors } = {
  left: {
    start: new Phaser.Math.Vector2(1024 + 50, 680),
    end: new Phaser.Math.Vector2(-50, 680)
  },
  right: {
    start: new Phaser.Math.Vector2(-50, 740),
    end: new Phaser.Math.Vector2(1024 + 50, 740)
  }
}

class BackgroundCar {
  direction: Direction
  car: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  driveVectors: CarDirectionVectors
  onComplete: () => void
  private cleanup: () => void


  constructor(carIndex: number, scene: Phaser.Scene, container: Phaser.GameObjects.Container, direction: Direction) {
    this.direction = direction
    this.driveVectors = carDirections[direction]
    this.car = scene.physics.add.sprite(this.driveVectors.start.x, this.driveVectors.start.y, `car${carIndex}`)
    this.car.setScale(.25).anims.play(`car${carIndex}_${direction}`, true)
    container.add(this.car)

    scene.physics.moveTo(this.car, this.driveVectors.end.x, this.driveVectors.end.y, 150)
    scene.events.on('postupdate', this.update)
    this.cleanup = () => {
      scene.events.off('postupdate', this.update)
      this.car.destroy()
      this.onComplete?.()
    }
  }

  update = () => {
    const distance = this.car.x - this.driveVectors.end.x
    if ((this.direction == 'right' && distance > 0) || (this.direction == 'left' && distance < 0)) {
      this.car.body.reset(this.driveVectors.end.x, this.driveVectors.end.y)
      this.cleanup()
    }
  }
}

export class BackgroundCars {
  container: Phaser.GameObjects.Container
  uniqueCars: number = 1
  cars: BackgroundCar[] = []
  scene: Scene
  generationTimer: Phaser.Time.TimerEvent

  constructor(uniqueCars: number, scene: Scene) {
    this.uniqueCars = uniqueCars
    this.container = scene.add.container()

    for (let i = 0; i < uniqueCars; i++) {
      scene.anims.create({
        key: `car${i}_right`,
        frames: [{ key: `car${i}`, frame: 1}],
        frameRate: 10,
        repeat: -1,
      })
      scene.anims.create({
        key: `car${i}_left`,
        frames: [{ key: `car${i}`, frame: 0 }],
        frameRate: 10,
        repeat: -1,
      })
    }
    this.scene = scene
    this.createTimedEvent()
  }

  createTimedEvent = () => {
    this.generationTimer = this.scene.time.addEvent({
      delay: Math.floor(Math.random() * (7000 - 2500 + 1)) + 2500,
      callback: this.generateCar,
      loop: false,
    })
  }

  generateCar = () => {
    const carIndex = Math.max(Math.floor(Math.random() * (this.uniqueCars + 1)) - 1, 0)
    const car = new BackgroundCar(carIndex, this.scene, this.container, Math.random() < 0.5 ? 'right' : 'left')
    this.cars.push(car)

    car.onComplete = () => {
      this.cars.filter((c) => c != car)
    }
    this.createTimedEvent()
  }
}