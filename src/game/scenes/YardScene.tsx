import { Scene } from 'phaser'
import { EventBus } from '../EventBus'
import { SpaceObject } from '../objects/Space'
import { TruckObject } from '../objects/Truck'
import { DriverObject } from '../objects/Driver'
import { CapturedKeys } from '../types/capturedKeys'
import { ExitObject } from '../objects/Exit'

class YardState {
  activeTruck: TruckObject | undefined
  enterLock: boolean = false
  truckFullfillment: { [truckId: string]: { idleTime: number } } = {}
}

class YardSequence {
  totalTrucks: number
  enabledSpaces: {
    dockIndexes: number[]
    yardIndexes: number[]
  }
}

export class YardScene extends Scene {
  platforms: Phaser.Physics.Arcade.StaticGroup
  truckGroup: Phaser.Physics.Arcade.Group
  cursors: Phaser.Types.Input.Keyboard.CursorKeys
  spaceSeparators: Phaser.Physics.Arcade.StaticGroup
  capturedKeys: CapturedKeys
  yardSequence: YardSequence

  state: YardState = new YardState()
  driver: DriverObject
  spaces: SpaceObject[] = []
  trucks: TruckObject[] = []
  exitArea: ExitObject

  constructor() {
    super('Yard')
  }

  create() {
    this.add.image(1024 / 2, 768 / 2, 'background')
    this.platforms = this.physics.add.staticGroup()
    this.yardSequence = this.registry.get('sequence')

    // this.add.image(1024 / 2, 768 / 2, 'yard').setScale(0.25)
    // this.add.image(1024 / 2, 768 / 2, 'dock').setScale(0.25)

    this.capturedKeys = {
      enter: this.input.keyboard!.addKey('E'),
    }

    const yardY = 460 //568

    this.platforms.add(
      this.add.image(1024 / 2, 50, 'warehouse').setDisplaySize(1024, 100),
    )
    this.platforms.add(this.add.image(380 / 2, yardY + 170, 'yard_fence'))
    this.platforms.add(this.add.image(644 + 380 / 2, yardY + 170, 'yard_fence'))

    this.spaceSeparators = this.physics.add.staticGroup()

    // Dock
    this.spaceSeparators.add(this.add.image(15, 150, 'dock_separator'))
    for (let i = 20; i < 1024; i += 90) {
      if (i + 80 > 1024) {
        break
      }
      this.spaces.push(
        new SpaceObject(i, 0, this, {
          onFullfilledHandler: this.onTruckFullfilled,
          onTruckDockedHandler: this.onTruckDocked,
        }),
      )
      this.spaceSeparators.add(this.add.image(i + 85, 150, 'dock_separator'))
    }

    // Yard
    this.spaceSeparators.add(this.add.image(15, yardY + 100, 'yard_separator'))
    for (let i = 0; i < 4; i++) {
      this.spaces.push(
        new SpaceObject(i * 90 + 20, yardY + 50, this, { isDock: false }),
      )
      this.spaceSeparators.add(
        this.add.image(i * 90 + 20 + 85, yardY + 100, 'yard_separator'),
      )
    }

    this.spaceSeparators.add(this.add.image(649, yardY + 100, 'yard_separator'))
    for (let i = 0; i < 4; i++) {
      this.spaces.push(
        new SpaceObject(i * 90 + 654, yardY + 50, this, { isDock: false }),
      )
      this.spaceSeparators.add(
        this.add.image(i * 90 + 654 + 85, yardY + 100, 'yard_separator'),
      )
    }

    // Exit
    this.exitArea = new ExitObject(480, yardY + 300, this, {
      onDepatureHandler: this.onDeparture,
    })

    this.platforms.add(
      this.add.image(515, yardY + 120, 'check_in_booth').setOrigin(0.5),
    )

    this.add.image(1024 / 2, 768 - 60, 'main_road')

    this.add.image(595, yardY + 120, 'enter')

    // Driver
    this.driver = new DriverObject(1024 / 2, 768 / 2, this)
    this.physics.add.collider(this.driver.driver, this.spaceSeparators)
    this.physics.add.collider(this.driver.driver, this.platforms)

    // Trucks
    this.truckGroup = this.physics.add.group()
    this.physics.add.collider(this.truckGroup, this.platforms)
    this.physics.add.collider(this.truckGroup, this.truckGroup)
    this.physics.add.collider(this.truckGroup, this.spaceSeparators)

    // Space -> Truck Overlap
    this.spaces.forEach((space) => {
      this.physics.add.overlap(
        this.truckGroup,
        space.space,
        space.checkParking,
        undefined,
        this,
      )
    })
    this.physics.add.overlap(
      this.truckGroup,
      this.exitArea.exitArea,
      this.exitArea.checkTruckDeparture,
    )

    this.anims.create({
      key: 'left',
      frames: [{ key: 'trailer', frame: 1 }],
      frameRate: 10,
      repeat: -1,
    })
    this.anims.create({
      key: 'right',
      frames: [{ key: 'trailer', frame: 3 }],
      frameRate: 10,
      repeat: -1,
    })
    this.anims.create({
      key: 'up',
      frames: [{ key: 'trailer', frame: 0 }],
      frameRate: 10,
      repeat: -1,
    })
    this.anims.create({
      key: 'down',
      frames: [{ key: 'trailer', frame: 2 }],
      frameRate: 10,
      repeat: -1,
    })

    this.anims.create({
      key: 'worker_left',
      frames: this.anims.generateFrameNumbers('worker', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1,
    })
    this.anims.create({
      key: 'worker_right',
      frames: this.anims.generateFrameNumbers('worker', { start: 6, end: 8 }),
      frameRate: 10,
      repeat: -1,
    })
    this.anims.create({
      key: 'worker_up',
      frames: this.anims.generateFrameNumbers('worker', { start: 9, end: 11 }),
      frameRate: 10,
      repeat: -1,
    })
    this.anims.create({
      key: 'worker_down',
      frames: this.anims.generateFrameNumbers('worker', { start: 3, end: 5 }),
      frameRate: 10,
      repeat: -1,
    })

    // eslint-disable-next-line @typescript-eslint/no-extra-non-null-assertion
    this.cursors = this.input.keyboard!!.createCursorKeys()

    // Generate
    this.generateTruck()
    this.dayTimer()
    EventBus.emit('current-scene-ready', this)
  }

  dayTimer = () => {
    const { width, height } = this.scale
    const day = this.registry.get('day')
    const endHour = 17

    const time: { hour: number; min: number } = { hour: 9, min: 0 }

    const timeDisplay = this.add.text(
      width - 125,
      height - 35,
      `Day: ${day} 9:00`,
    )

    new Promise<void>((resolve) => {
      const timer = this.time.addEvent({
        delay: 500,
        loop: true,
        callback() {
          if (time.hour >= endHour) {
            timer.destroy()
            return resolve()
          }

          time.min += 5

          if (time.min >= 60) {
            time.min = 0
            time.hour += 1
          }

          if (endHour - time.hour === 2) {
            timeDisplay.setColor('orange')
          } else if (endHour - time.hour <= 1) {
            timeDisplay.setColor('red')
          }

          timeDisplay.setText(
            `Day: ${day} ${time.hour}:${
              time.min >= 10 ? time.min : '0' + `${time.min}`
            }`,
          )
        },
      })
    }).then(() => {
      this.endDay()
    })
  }

  generateTruck = () => {
    if (this.trucks.length < this.yardSequence.totalTrucks) {
      const truck = new TruckObject(600, 570, this)
      this.physics.add.collider(
        this.driver.driver,
        truck.truck,
        this.driver.onTruckCollision(truck),
        undefined,
        this,
      )
      this.trucks.push(truck)
      this.truckGroup.add(truck.truck)
      truck.truck.body.setCollideWorldBounds(true)
      truck.setIdleStatus(true)
    }
  }

  update() {
    if (
      !this.state.enterLock &&
      this.capturedKeys.enter.isDown &&
      this.driver.truck
    ) {
      if (
        this.state.activeTruck &&
        this.spaces.find((s) => s.containsTruck(this.state.activeTruck!.id))
      ) {
        this.triggerTruckExit()
        this.generateTruck()
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

  onTruckFullfilled = (truckId: string) => {
    this.trucks.find((t) => t.id == truckId)?.markFullfilled()
  }

  onDeparture = (truckId: string) => {
    const truckIndex = this.trucks.findIndex((t) => t.id == truckId)
    if (truckIndex < 0) {
      return
    }

    const truck = this.trucks[truckIndex]
    if (truck.fullfilled) {
      this.triggerTruckExit()
      this.state.truckFullfillment[truck.id] = {
        idleTime: truck.idleTime,
      }
      this.truckGroup.remove(truck.truck)
      truck.truck.destroy()
      this.trucks.splice(truckIndex, 1)
    }

    if (this.trucks.length == 0) {
      this.endDay()
    }
  }

  endDay = () => {
    this.registry.set('day', this.registry.get('day') + 1)
    this.registry.set('completedOrders', this.state.truckFullfillment)
    this.scene.start('DayOverview')
  }
}

