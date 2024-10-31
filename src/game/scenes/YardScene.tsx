import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { SpaceObject } from '../objects/Space';
import { TruckObject } from '../objects/Truck';
import { DriverObject } from '../objects/Driver';
import { CapturedKeys } from '../types/capturedKeys';
import { ExitObject } from '../objects/Exit';

class YardState {
  activeTruck: TruckObject | undefined
  enterLock: boolean = false
}

export class YardScene extends Scene {
  platforms: Phaser.Physics.Arcade.StaticGroup
  truckGroup: Phaser.Physics.Arcade.Group
  cursors: Phaser.Types.Input.Keyboard.CursorKeys
  yardSpaces: Phaser.Physics.Arcade.StaticGroup
  spaceSeparators: Phaser.Physics.Arcade.StaticGroup
  score = 0;
  scoreText: Phaser.GameObjects.Text
  gameOver = false
  reverseKey: Phaser.Input.Keyboard.Key
  capturedKeys: CapturedKeys

  state: YardState = new YardState()
  driver: DriverObject
  spaces: SpaceObject[] = []
  trucks: TruckObject[] = []
  exitArea: ExitObject

  constructor() {
    super('Yard');
  }


  create() {
    this.add.image(1024 / 2, 768 / 2, 'background');

    // this.physics.world.defaults.debugShowBody = true;
    // this.physics.world.defaults.bodyDebugColor = 0xff00ff;

    this.platforms = this.physics.add.staticGroup();

    this.add.image(1024 / 2, 768 / 2, 'yard').setScale(0.25)
    this.add.image(1024 / 2, 768 / 2, 'dock').setScale(0.25)

    this.capturedKeys = {
      enter: this.input.keyboard!.addKey('E')
    }

    this.platforms.add(new Phaser.GameObjects.Rectangle(this, 1024 / 2, 50, 1024, 100))
    this.platforms.add(new Phaser.GameObjects.Rectangle(this, 380 / 2, 718 + 25, 380, 50))
    this.platforms.add(new Phaser.GameObjects.Rectangle(this, 644 + 380 / 2, 718 + 25, 380, 50))

    this.spaceSeparators = this.physics.add.staticGroup()

    // Dock
    this.spaceSeparators.add(new Phaser.GameObjects.Rectangle(this, 15, 150, 10, 100))
    for (let i = 20; i < 1024; i += 90) {
      if (i + 80 > 1024) {
        break;
      }
      this.spaces.push(new SpaceObject(i, 0, this, { onFullfilledHandler: this.onTruckFullfilled, onTruckDockedHandler: this.onTruckDocked }))
      this.spaceSeparators.add(new Phaser.GameObjects.Rectangle(this, i + 85, 150, 10, 100))
    }

    // Yard
    this.spaceSeparators.add(new Phaser.GameObjects.Rectangle(this, 15, 618 + 50, 10, 100))
    for (let i = 0; i < 4; i++) {
      this.spaces.push(new SpaceObject((i * 90 + 20), 568 + 50, this, { isDock: false }))
      this.spaceSeparators.add(new Phaser.GameObjects.Rectangle(this, (i * 90 + 20) + 85, 618 + 50, 10, 100))
    }

    this.spaceSeparators.add(new Phaser.GameObjects.Rectangle(this, 649, 618 + 50, 10, 100))
    for (let i = 0; i < 4; i++) {
      this.spaces.push(new SpaceObject((i * 90 + 654), 568 + 50, this, { isDock: false }))
      this.spaceSeparators.add(new Phaser.GameObjects.Rectangle(this, (i * 90 + 654) + 85, 618 + 50, 10, 100))
    }

    // Exit
    this.exitArea = new ExitObject(480, 768, this, { onDepatureHandler: this.onDeparture })

    // Driver
    this.driver = new DriverObject(1024 / 2, 768 / 2, this)
    this.physics.add.collider(this.driver.driver, this.spaceSeparators)
    this.physics.add.collider(this.driver.driver, this.platforms)

    // Trucks
    this.truckGroup = this.physics.add.group()
    this.trucks.push(new TruckObject(100, 450, this))
    this.trucks.push(new TruckObject(200, 450, this))
    this.trucks.forEach((t) => {
      this.physics.add.collider(this.driver.driver, t.truck, this.driver.onTruckCollision(t), undefined, this);
      this.truckGroup.add(t.truck)
      t.truck.body.setCollideWorldBounds(true);
    })

    this.physics.add.collider(this.truckGroup, this.platforms)
    this.physics.add.collider(this.truckGroup, this.truckGroup)
    this.physics.add.collider(this.truckGroup, this.spaceSeparators)

    // Space -> Truck Overlap
    this.spaces.forEach((space) => {
      this.physics.add.overlap(this.truckGroup, space.space, space.checkParking, undefined, this);
    })
    this.physics.add.overlap(this.truckGroup, this.exitArea.exitArea, this.exitArea.checkTruckDeparture)



    this.anims.create({
      key: 'left',
      frames: [{ key: 'trailer', frame: 1 }],
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'right',
      frames: [{ key: 'trailer', frame: 3 }],
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'up',
      frames: [{ key: 'trailer', frame: 0 }],
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'down',
      frames: [{ key: 'trailer', frame: 2 }],
      frameRate: 10,
      repeat: -1
    });


    // eslint-disable-next-line @typescript-eslint/no-extra-non-null-assertion
    this.cursors = this.input.keyboard!!.createCursorKeys();
    // eslint-disable-next-line @typescript-eslint/no-extra-non-null-assertion
    this.reverseKey = this.input.keyboard!!.addKey("R")

    // this.stars = this.physics.add.group({
    //   key: 'star',
    //   repeat: 11,
    //   setXY: { x: 12, y: 0, stepX: 70 }
    // });

    // this.stars.children.iterate((child) => {
    //   (child as Phaser.Physics.Arcade.Sprite).setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    //   return null

    // });
    // this.physics.add.collider(this.stars, this.platforms);
    // this.physics.add.overlap(this.player, this.stars, this.collectStar, undefined, this);
    // this.scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', color: '#000' });

    // this.bombs = this.physics.add.group();
    // this.physics.add.collider(this.bombs, this.platforms);
    // this.physics.add.collider(this.player, this.bombs, this.hitBomb, undefined, this);
    // this.physics.add.collider(this.player, this.dockArea, this.onCollide, undefined, this)
    EventBus.emit('current-scene-ready', this);
  }

  update() {
    if (!this.state.enterLock && this.capturedKeys.enter.isDown && this.driver.truck) {
      if (this.state.activeTruck) {
        this.triggerTruckExit()
      } else if (this.driver.truck) {
        this.triggerTruckStart()
      }
      this.state.enterLock = true
    } else if (this.capturedKeys.enter.isUp && this.state.enterLock) {
      this.state.enterLock = false
    }

    this.state.activeTruck?.update(this.cursors)

    if (!this.driver.isDriving) {
      this.driver.update(this.cursors)
    }
  }

  triggerTruckExit = () => {
    this.driver.setDriveMode(false)
    this.state.activeTruck?.setActive(false)
    this.state.activeTruck = undefined
  }
  
  triggerTruckStart = () => {
    this.state.activeTruck = this.driver.truck
    this.state.activeTruck!.setActive(true)
    this.driver.setDriveMode(true)
  }

  onTruckDocked = (truckId: string, spaceId: string) => {
    this.trucks.find((t) => t.id == truckId)?.setDockSpace(spaceId)
  }

  onTruckFullfilled = (truckId: string) =>  {
    this.trucks.find((t) => t.id == truckId)?.markFullfilled()
  }

  onDeparture = (truckId: string) =>  {
    const truckIndex = this.trucks.findIndex((t) => t.id == truckId)
    if (truckIndex < 0) {
      return
    }

    if (this.trucks[truckIndex].fullfilled) {
      this.triggerTruckExit()
      this.truckGroup.remove(this.trucks[truckIndex].truck)
      this.trucks[truckIndex].truck.destroy()
      this.trucks.splice(truckIndex, 1);
    }
  }
}