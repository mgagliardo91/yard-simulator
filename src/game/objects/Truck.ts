import { v4 as uuidv4 } from 'uuid';
import { TruckOrder } from '../types/order';

export class TruckObject {
  truck: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  id = `${uuidv4()}`
  fullfilled: boolean = false
  spaceId: string | undefined = undefined
  isIdle: boolean = false
  idleTime: number = 0
  time: Phaser.Time.Clock
  velocity: number
  order: TruckOrder

  private idleTimer: Phaser.Time.TimerEvent | undefined

  constructor(x: number, y: number, scene: Phaser.Scene, order: TruckOrder) {
    const truck = scene.add.sprite(x, y, 'trailer').setScale(.25)
    this.truck = scene.physics.add.existing(truck) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    this.truck.body.setSize(this.truck.width * 0.60, this.truck.height)
    this.truck.body.pushable = false
    this.truck.setData('id', this.id)
    this.time = scene.time
    this.velocity = 300 + (scene.registry.get('truckSpeed') * 100)
    this.order = order
    this.truck.setData('order', this.order)
  }

  setIdleStatus = (idle: boolean) => {
    this.isIdle = idle
    if (idle) {
      this.startTimer()
    } else {
      this.clearTimer()
    }
  }

  private incrementIdleness = () => {
    this.idleTime = this.idleTime + 1
  }

  private startTimer = () => {
    this.clearTimer()
    this.idleTimer = this.time.addEvent({
      delay: 1000,
      callback: this.incrementIdleness,
      loop: true,
    })
  }

  private clearTimer = () => {
    if (this.idleTimer) this.time.removeEvent(this.idleTimer)
    this.idleTimer = undefined
  }

  setActive = (active: boolean) => {
    if (active) {
      this.clearTimer()
      this.truck.setTint(0xBCE3E9)
    } else {
      this.truck.setTint()
    }
  }

  setDockSpace = (spaceId: string) => {
    this.spaceId = spaceId
    this.truck.setData({ spaceId: this.spaceId })
  }

  markFullfilled = () => {
    this.fullfilled = true
    console.log(`Truck ${this.id} fullfilled`)
    this.truck.setData({ fullfilled: this.fullfilled })
    this.startTimer()
  }

  update = (cursors: Phaser.Types.Input.Keyboard.CursorKeys) => {
    this.truck.body.setVelocityX(0);
    this.truck.body.setVelocityY(0);

    if (cursors.left.isDown) {
      this.truck.body.setVelocityX(-1 * this.velocity);
      this.truck.anims.play('left', true);
      this.truck.body.setSize(this.truck.width, this.truck.height * 0.60)
    }
    else if (cursors.right.isDown) {
      this.truck.body.setVelocityX(this.velocity);
      this.truck.anims.play('right', true);
      this.truck.body.setSize(this.truck.width, this.truck.height * 0.60)
    }
    else if (cursors.up.isDown) {
      this.truck.body.setVelocityY(-1 * this.velocity);
      this.truck.anims.play('up', true);
      this.truck.body.setSize(this.truck.width * 0.60, this.truck.height)
    }
    else if (cursors.down.isDown) {
      this.truck.body.setVelocityY(this.velocity);
      this.truck.anims.play('down', true);
      this.truck.body.setSize(this.truck.width * 0.60, this.truck.height)
    }
    else {
      this.truck.anims.stop();
    }
  }
}