type OnDepatureHandler = (truckId: string) => void

export type ExitConfig = {
  onDepatureHandler?: OnDepatureHandler
}

export class ExitObject {
  exitArea: Phaser.Types.Physics.Arcade.GameObjectWithStaticBody
  isContained: boolean = false
  exitConfig: ExitConfig

  constructor(
    x: number,
    y: number,
    scene: Phaser.Scene,
    exitConfig: ExitConfig,
  ) {
    const exitArea = scene.add.image(x - 50, y - 180, 'exit')
    // const ea =
    // const exitArea = new Phaser.GameObjects.Rectangle(
    //   scene,
    //   x - 50,
    //   y - 180,
    //   100,
    //   140,
    //   0x078a7b,
    // )
    scene.add.existing(exitArea)
    this.exitArea = scene.physics.add.existing(
      exitArea,
    ) as Phaser.Types.Physics.Arcade.GameObjectWithStaticBody
    this.exitArea.body.pushable = false
    this.exitConfig = exitConfig
  }

  checkTruckDeparture: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (
    e,
    t,
  ) => {
    const truck = t as Phaser.Types.Physics.Arcade.GameObjectWithBody & {
      x: number
      y: number
    }
    const exitArea = e as Phaser.Types.Physics.Arcade.GameObjectWithBody & {
      x: number
      y: number
    }
    const fullfilled: boolean = truck.getData('fullfilled')
    const truckId: string = truck.getData('id')

    const width = exitArea.body.width + 10
    const height = exitArea.body.height + 10

    const contained = Phaser.Geom.Rectangle.ContainsRect(
      new Phaser.Geom.Rectangle(
        exitArea.x - width / 2,
        exitArea.y - height / 2,
        width,
        height,
      ),
      new Phaser.Geom.Rectangle(
        truck.x - truck.body.width / 2,
        truck.y - truck.body.height / 2,
        truck.body.width,
        truck.body.height,
      ),
    )

    if (!this.isContained && contained) {
      this.isContained = true
      if (fullfilled) {
        this.exitConfig.onDepatureHandler?.(truckId)
      }
    } else if (this.isContained && !contained) {
      this.isContained = false
    }
  }
}

