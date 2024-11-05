import { v4 as uuidv4 } from 'uuid'
import { TruckOrder } from '../types/order'

type OnFullfilledHandler = (truckId: string) => void
type OnTruckDockedHandler = (truckId: string, spaceId: string) => void

export type SpaceObjectConfig = {
  isDock?: boolean
  fullfillmentTime?: number
  onFullfilledHandler?: OnFullfilledHandler
  onTruckDockedHandler?: OnTruckDockedHandler
}

const Colors = {
  contained: 0xC5FEB6,
  fullfilled: 0x26BA00,
}

export class SpaceObject {
  space: Phaser.GameObjects.Rectangle
  config: SpaceObjectConfig
  time: Phaser.Time.Clock
  text: Phaser.GameObjects.Text
  doorOpen: Phaser.GameObjects.Image
  doorClosed: Phaser.GameObjects.Image
  id = `${uuidv4()}`
  fullfillmentDuration = 0
  private truckId: string

  private isContained: boolean = false
  private containmentTimer: Phaser.Time.TimerEvent | undefined
  private containedTime: number = 0
  private isFullfilled: boolean = false

  constructor(
    x: number,
    y: number,
    scene: Phaser.Scene,
    config: SpaceObjectConfig = {},
  ) {
    this.config = config
    this.time = scene.time
    const { isDock } = this
    this.space = new Phaser.GameObjects.Rectangle(
      scene,
      x + 40,
      y + (!isDock ? 50 : 150),
      80,
      100,
    )
    scene.add.existing(this.space)
    scene.physics.add.existing(this.space, true)

    if (!isDock) {
      scene.add.image(x + 40, y + 50, 'yard_parking')
      //this.space.setFillStyle(0x2ddf5d)
    } else {
      this.doorClosed = scene.add.image(x + 40, y + 65, 'dock_door').setOrigin(0.5, 0.5)
      this.doorOpen = scene.add.image(x + 40, y + 65, 'dock_door_open').setOrigin(0.5, 0.5).setVisible(false)
      //scene.add.rectangle(x + 40, y + 65, 80, 70, 0x2ddf5d).setOrigin(0.5, 0.5)
      this.text = scene.add
        .text(
          x + 40,
          y + 215,
          `00:${`${this.fullfillmentTime! - this.containedTime}`.padStart(
            2,
            '0',
          )}`,
          { color: 'black' },
        )
        .setOrigin(0.5)
      this.text.setVisible(false)
    }
  }

  get isDockSpace() {
    return this.config.isDock ?? true
  }

  setDockDoor = () => {
    if (this.isDock) {
      this.doorClosed.setVisible(this.isFullfilled || !this.isContained)
      this.doorOpen.setVisible(!this.isFullfilled && this.isContained)
    }
  }

  containsTruck = (truckId: string) => {
    return this.truckId == truckId && this.isContained
  }

  countUp = () => {
    if (this.fullfillmentTime && this.containedTime < this.fullfillmentTime) {
      this.containedTime = this.containedTime + 1
      this.setTimerText()
    }
    this.setColor()
    this.checkFullfillment()
  }

  setTimerText = () => {
    if (this.fullfillmentTime) {
      this.text.setText(
        `00:${`${this.fullfillmentTime - this.containedTime}`.padStart(
          2,
          '0',
        )}`,
      )
    }
  }

  startTimer = () => {
    this.setTimerText()
    this.text.setVisible(true)
    this.clearTimer()
    this.containmentTimer = this.time.addEvent({
      delay: 1000,
      callback: this.countUp,
      loop: true,
    })
  }

  setContainment = () => {
    this.setColor()
    this.setDockDoor()

    if (this.isDock) {
      if (this.isContained) {
        this.startTimer()
      } else {
        this.clearTimer()
      }
    }
  }

  setColor = () => {
    if (this.isFullfilled) {
      this.space.fillColor = Colors.fullfilled
    } else if (this.isContained) {
      this.space.fillColor = Colors.contained
    } else if (!this.isDock) {
      this.space.setFillStyle(0x2ddf5d)
    }

    this.space.isFilled = true
  }

  checkFullfillment = () => {
    if (
      !this.isFullfilled &&
      this.fullfillmentTime &&
      this.containedTime >= this.fullfillmentTime
    ) {
      this.isFullfilled = true
      this.clearTimer()
      this.config.onFullfilledHandler?.(this.truckId)
      this.setDockDoor()
      this.setColor()
    }

    return this.isFullfilled
  }

  clearTimer = () => {
    if (this.containmentTimer) this.time.removeEvent(this.containmentTimer)
    this.containmentTimer = undefined
  }

  get fullfillmentTime() {
    return this.isDock ? this.fullfillmentDuration : undefined
  }

  get isDock() {
    return this.config.isDock ?? true
  }

  checkParking: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (s, t) => {
    const truck = t as Phaser.Types.Physics.Arcade.GameObjectWithBody & {
      x: number
      y: number
    }
    const space = s as Phaser.Types.Physics.Arcade.GameObjectWithBody & {
      x: number
      y: number
    }
    const truckId: string = truck.getData('id')
    const fullfilled: string = truck.getData('fullfilled')
    const spaceId: string = truck.getData('spaceId')
    const order: TruckOrder = truck.getData('order')

    const width = space.body.width + 10
    const height = space.body.height + 10

    const contained = Phaser.Geom.Rectangle.ContainsRect(
      new Phaser.Geom.Rectangle(
        space.x - width / 2,
        space.y - height / 2,
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

    if (this.truckId && this.truckId !== truckId) {
      if (contained) {
        this.space.setFillStyle(0xFE6D6D)
      } else {
        this.space.isFilled = false
      }
      return
    } else if (!this.truckId && fullfilled) {
      return
    } else if (!this.truckId && spaceId) {
      if (contained) {
        this.space.setFillStyle(0xFE6D6D)
      } else {
        this.space.isFilled = false
      }
      return
    }

    if (!this.isContained && contained) {
      this.isContained = true
      this.truckId = truckId
      this.fullfillmentDuration = order.duration
      this.config.onTruckDockedHandler?.(this.truckId, this.id)
      this.setContainment()
    } else if (this.isContained && !contained) {
      this.isContained = false
      this.setContainment()
    } else if (!this.isContained && !this.isDockSpace) {
      this.space.isFilled = false
    }
  }
}

