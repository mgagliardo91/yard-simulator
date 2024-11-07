import { TruckObject } from './Truck'

export class DriverObject {
  driver: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  isDriving: boolean = false
  truck: TruckObject | undefined = undefined
  velocity: number

  constructor(x: number, y: number, scene: Phaser.Scene) {
    const driver = scene.add.sprite(x, y, 'worker')
    this.driver = scene.physics.add.existing(
      driver,
    ) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    this.driver.body.setCollideWorldBounds(true)
    this.driver.body.pushable = false
    this.velocity = 300 + scene.registry.get('workerSpeed') * 100
  }

  onTruckCollision = (truck: TruckObject) => () => {
    this.truck = truck
  }

  setDriveMode = (driving: boolean) => {
    this.driver.body.setVelocityX(0)
    this.driver.body.setVelocityY(0)

    this.isDriving = driving
    if (!driving) {
      this.driver.setActive(true)
      this.driver.body.setEnable(true)
      if (this.truck) {
        if (this.truck.truck.anims.currentAnim?.key == 'up') {
          this.driver.body.x =
            this.truck.truck.x -
            this.truck.truck.body.width / 2 -
            this.driver.body.width / 2 -
            15
          this.driver.body.y =
            this.truck.truck.y - this.truck.truck.body.height / 2
        } else if (this.truck.truck.anims.currentAnim?.key == 'down') {
          this.driver.body.x =
            this.truck.truck.x -
            this.truck.truck.body.width / 2 -
            this.driver.body.width / 2 -
            15
          this.driver.body.y =
            this.truck.truck.y +
            this.truck.truck.body.height / 2 -
            this.driver.body.height
        } else if (this.truck.truck.anims.currentAnim?.key == 'right') {
          this.driver.body.x =
            this.truck.truck.x +
            this.truck.truck.body.width / 2 -
            this.driver.body.width / 2 +
            15
          this.driver.body.y =
            this.truck.truck.y - this.truck.truck.body.height / 2
        } else if (this.truck.truck.anims.currentAnim?.key == 'left') {
          this.driver.body.x =
            this.truck.truck.x -
            this.truck.truck.body.width / 2 -
            this.driver.body.width / 2 -
            15
          this.driver.body.y =
            this.truck.truck.y - this.truck.truck.body.height / 2
        }
      }
      this.truck = undefined
    } else {
      this.driver.setActive(false)
      this.driver.body.setEnable(false)
      this.driver.setVisible(false)
    }
  }

  update = (cursors: Phaser.Types.Input.Keyboard.CursorKeys) => {
    this.driver.body.setVelocityX(0)
    this.driver.body.setVelocityY(0)

    if (this.isDriving) {
      return
    }

    this.driver.setVisible(true)

    this.truck = undefined
    if (cursors.left.isDown) {
      this.driver.body.setVelocityX(-1 * this.velocity)
      this.driver.anims.play('worker_left', true)
    } else if (cursors.right.isDown) {
      this.driver.body.setVelocityX(this.velocity)
      this.driver.anims.play('worker_right', true)
    } else if (cursors.up.isDown) {
      this.driver.body.setVelocityY(-1 * this.velocity)
      this.driver.anims.play('worker_up', true)
    } else if (cursors.down.isDown) {
      this.driver.body.setVelocityY(this.velocity)
      this.driver.anims.play('worker_down', true)
    } else {
      this.driver.anims.stop()
    }
  }
}

