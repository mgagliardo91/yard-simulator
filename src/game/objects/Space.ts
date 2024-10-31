import { TruckMetadata } from './Truck'
import { v4 as uuidv4 } from 'uuid';

type OnFullfilledHandler = (truckId: string) => void
type OnTruckDockedHandler = (truckId: string, spaceId: string) => void

export type SpaceObjectConfig = {
  isDock?: boolean
  fullfillmentTime?: number
  onFullfilledHandler?: OnFullfilledHandler
  onTruckDockedHandler?: OnTruckDockedHandler
}


const Colors = {
  contained: 0xFF0000,
  fullfilled: 0x808B8D,
}

export class SpaceObject {
  space: Phaser.GameObjects.Rectangle
  config: SpaceObjectConfig
  scene: Phaser.Scene
  text: Phaser.GameObjects.Text
  id = `${uuidv4()}`
  private truckId: string
  
  private isContained: boolean = false
  private containmentTimer: Phaser.Time.TimerEvent | undefined
  private containedTime: number = 0
  private isFullfilled: boolean = false

  constructor(x: number, y: number, scene: Phaser.Scene, config: SpaceObjectConfig = {}) {
    this.config = config
    this.scene = scene
    const { isDock } = this
    this.space = new Phaser.GameObjects.Rectangle(scene, x + 40, y + (!isDock ? 50 : 150), 80, 100)
    scene.add.existing(this.space)
    scene.physics.add.existing(this.space, true)

    if (!isDock) {
      this.space.setFillStyle(0x2DDF5D)
    } else {
      scene.add.rectangle(x + 40, y + 50, 80, 100, 0x2DDF5D)
      this.text = scene.add.text(x + 40, y + 215, `00:${`${this.fullfillmentTime! - this.containedTime}`.padStart(2, '0')}`, { color: 'black' }).setOrigin(0.5)
      this.text.setVisible(false)
    }

  }

  get isDockSpace() {
    return this.config.isDock ?? true
  }

  containsTruck = (truckId: string) => {
    return this.truckId == truckId && this.isContained
  }

  countUp = () => {
    if (this.fullfillmentTime && this.containedTime < this.fullfillmentTime) {
      this.containedTime = this.containedTime + 1
      this.text.setText(`00:${`${this.fullfillmentTime - this.containedTime}`.padStart(2, '0')}`)
    }
    this.setColor()
    this.checkFullfillment()
  }

  startTimer = () => {
    this.text.setVisible(true)
    this.clearTimer()
    this.containmentTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: this.countUp,
      loop: true,
    })
  }

  setColor = () => {
    this.space.isFilled = true

    if (this.isFullfilled) {
      this.space.fillColor = Colors.fullfilled
    } else if (this.isContained) {
      this.space.fillColor = Colors.contained
    } else {
      this.space.isFilled = false
    }
  }

  checkFullfillment = () => {
    if (!this.isFullfilled && this.fullfillmentTime && this.containedTime >= this.fullfillmentTime) {
      this.isFullfilled = true
      this.clearTimer()
      this.config.onFullfilledHandler?.(this.truckId)
    }

    return this.isFullfilled
  }

  clearTimer = () => {
    if (this.containmentTimer) this.scene.time.removeEvent(this.containmentTimer)
    this.containmentTimer = undefined
  }
  
  get fullfillmentTime() {
    return this.isDock ? 5 : undefined
  }

  get isDock() {
    return this.config.isDock ?? true 
  }

  checkParking: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (s, t) => {
    const truck = t as Phaser.Types.Physics.Arcade.GameObjectWithBody & { x: number; y: number }
    const space = s as Phaser.Types.Physics.Arcade.GameObjectWithBody & { x: number; y: number }
    const truckId: string = truck.getData('id')
    const fullfilled: string = truck.getData('fullfilled')
    const spaceId: string = truck.getData('spaceId')

    if (this.truckId && this.truckId !== truckId) {
      return
    } else if (!this.truckId && fullfilled) {
      return
    } else if (!this.truckId && spaceId) {
      return
    }

    const width = space.body.width + 10
    const height = space.body.height + 10

    const contained = Phaser.Geom.Rectangle.ContainsRect(
      new Phaser.Geom.Rectangle(space.x - (width / 2), space.y - (height / 2), width, height),
      new Phaser.Geom.Rectangle(truck.x - (truck.body.width / 2), truck.y - (truck.body.height / 2), truck.body.width, truck.body.height)
    )

    if (!this.isContained && contained) {
      this.isContained = true
      this.truckId = truckId
      this.config.onTruckDockedHandler?.(this.truckId, this.id)
      this.setColor()
      if (this.isDock) {
        this.startTimer()
      }
    } else if (this.isContained && !contained) {
      this.isContained = false
      this.setColor()
      if (this.isDock) { 
        this.clearTimer()
      }
    }
  }
}