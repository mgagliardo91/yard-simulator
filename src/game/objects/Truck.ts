import { v4 as uuidv4 } from 'uuid';

export class TruckObject {
  truck: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  id = `${uuidv4()}`
  fullfilled: boolean = false
  spaceId: string | undefined = undefined

  constructor(x: number, y: number, scene: Phaser.Scene) {
    const truck = scene.add.sprite(x, y, 'trailer').setScale(.25)
    this.truck = scene.physics.add.existing(truck) as Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
    this.truck.body.setSize(this.truck.width * 0.60, this.truck.height)
    this.truck.body.pushable = false
    this.truck.setData('id', this.id)
  }

  setActive = (active: boolean) => {
    if (active) {
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
  }

  update = (cursors: Phaser.Types.Input.Keyboard.CursorKeys) => {
    this.truck.body.setVelocityX(0);
    this.truck.body.setVelocityY(0);

    const velocity = 300
    if (cursors.left.isDown) {
      this.truck.body.setVelocityX(-1 * velocity);
      this.truck.anims.play('left', true);
      this.truck.body.setSize(this.truck.width, this.truck.height * 0.60)
    }
    else if (cursors.right.isDown) {
      this.truck.body.setVelocityX(velocity);
      this.truck.anims.play('right', true);
      this.truck.body.setSize(this.truck.width, this.truck.height * 0.60)
    }
    else if (cursors.up.isDown) {
      this.truck.body.setVelocityY(-1 * velocity);
      this.truck.anims.play('up', true);
      this.truck.body.setSize(this.truck.width * 0.60, this.truck.height)
    }
    else if (cursors.down.isDown) {
      this.truck.body.setVelocityY(velocity);
      this.truck.anims.play('down', true);
      this.truck.body.setSize(this.truck.width * 0.60, this.truck.height)
    }
    else {
      this.truck.anims.stop();
    }
  }
}