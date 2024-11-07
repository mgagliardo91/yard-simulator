import { Scene } from 'phaser'
import { EventBus } from '../EventBus'
import { SpaceObject } from '../objects/Space'
import { TruckObject } from '../objects/Truck'
import { DriverObject } from '../objects/Driver'
import { CapturedKeys } from '../types/capturedKeys'
import { ExitObject } from '../objects/Exit'
import { InfoPanel } from '../objects/InfoPanel'
import { generateOrder, TruckOrder } from '../types/order'
import { BackgroundCars } from '../objects/BackgroundCars'

class YardState {
  activeTruck: TruckObject | undefined
  enterLock: boolean = false
  truckFullfillment: {
    [truckId: string]: { idleTime: number; order?: TruckOrder }
  } = {}
  currentTruckId: number = 0
}

class YardSequence {
  totalTrucks: number
  enabledSpaces: {
    dockIndexes: number[]
    yardIndexes: number[]
  }
}

const getEnabledDockSpaces = (dockLvl: number) => {
  //const allSpaces = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  // Default Open Spaces
  const unlockedSpaces = [0, 5, 10]

  if (dockLvl > 0) {
    unlockedSpaces.push(1)
    unlockedSpaces.push(2)
  }

  if (dockLvl > 1) {
    unlockedSpaces.push(8)
    unlockedSpaces.push(9)
  }

  if (dockLvl > 2) {
    unlockedSpaces.push(6)
    unlockedSpaces.push(7)
  }

  if (dockLvl > 3) {
    unlockedSpaces.push(3)
    unlockedSpaces.push(4)
  }

  return unlockedSpaces
}

const getEnabledYardSpaces = (yardSpaceLvl: number) => {
  //const lotSpaces = [0, 1, 2, 3]
  // Default Open Spaces
  const leftLotUnlocked = []
  const rightLotUnlocked = []

  if (yardSpaceLvl > 0) {
    leftLotUnlocked.push(0)
    rightLotUnlocked.push(3)
  }

  if (yardSpaceLvl > 1) {
    leftLotUnlocked.push(1)
    rightLotUnlocked.push(2)
  }

  if (yardSpaceLvl > 2) {
    leftLotUnlocked.push(2)
    rightLotUnlocked.push(1)
  }

  if (yardSpaceLvl > 3) {
    leftLotUnlocked.push(3)
    rightLotUnlocked.push(0)
  }

  return [leftLotUnlocked, rightLotUnlocked]
}

export class YardScene extends Scene {
  platforms: Phaser.Physics.Arcade.StaticGroup
  truckGroup: Phaser.Physics.Arcade.Group
  cursors: Phaser.Types.Input.Keyboard.CursorKeys
  spaceSeparators: Phaser.Physics.Arcade.StaticGroup
  disabledSpaces: Phaser.Physics.Arcade.StaticGroup
  capturedKeys: CapturedKeys
  yardSequence: YardSequence

  state: YardState
  driver: DriverObject
  spaces: SpaceObject[]
  trucks: TruckObject[]
  exitArea: ExitObject
  activeInfoPanel: InfoPanel
  nextInfoPanel: InfoPanel

  constructor() {
    super('Yard')
  }

  create() {
    const bgMusic = this.sound.add('background')
    bgMusic.loop = true
    bgMusic.setVolume(0.05)
    bgMusic.play()

    this.spaces = []
    this.trucks = []
    this.state = new YardState()
    this.add.image(1024 / 2, 768 / 2, 'background')
    this.platforms = this.physics.add.staticGroup()
    this.yardSequence = this.registry.get('sequence')

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
    this.disabledSpaces = this.physics.add.staticGroup()

    // Dock
    const enabledDockSpaces = getEnabledDockSpaces(
      this.registry.get('dockSpaces'),
    )
    this.spaceSeparators.add(this.add.image(15, 150, 'dock_separator'))
    let dockIndex = 0
    for (let i = 20; i < 1024; i += 90) {
      if (i + 80 > 1024) {
        break
      }
      this.spaces.push(
        new SpaceObject(
          i,
          0,
          this,
          {
            onFullfilledHandler: this.onTruckFullfilled,
            onTruckDockedHandler: this.onTruckDocked,
          },
          enabledDockSpaces.includes(i),
        ),
      )

      if (!enabledDockSpaces.includes(dockIndex)) {
        this.disabledSpaces.add(this.add.image(i + 40, 150, 'space_locked'))
      }

      this.spaceSeparators.add(this.add.image(i + 85, 150, 'dock_separator'))
      dockIndex++
    }

    // Yard
    const [enabledParkingLeftLot, enabledParkingRightLot] =
      getEnabledYardSpaces(this.registry.get('yardSpaces'))
    this.spaceSeparators.add(this.add.image(15, yardY + 100, 'yard_separator'))
    for (let i = 0; i < 4; i++) {
      this.spaces.push(
        new SpaceObject(
          i * 90 + 20,
          yardY + 50,
          this,
          { isDock: false },
          enabledParkingLeftLot.includes(i),
        ),
      )
      if (!enabledParkingLeftLot.includes(i)) {
        this.disabledSpaces.add(
          this.add.image(i * 90 + 60, yardY + 100, 'space_locked'),
        )
      }
      this.spaceSeparators.add(
        this.add.image(i * 90 + 20 + 85, yardY + 100, 'yard_separator'),
      )
    }

    this.spaceSeparators.add(this.add.image(649, yardY + 100, 'yard_separator'))
    for (let i = 0; i < 4; i++) {
      this.spaces.push(
        new SpaceObject(
          i * 90 + 654,
          yardY + 50,
          this,
          { isDock: false },
          enabledParkingRightLot.includes(i),
        ),
      )
      if (!enabledParkingRightLot.includes(i)) {
        this.disabledSpaces.add(
          this.add.image(i * 90 + 654 + 40, yardY + 100, 'space_locked'),
        )
      }
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
    this.physics.add.collider(this.driver.driver, this.disabledSpaces)

    // Trucks
    this.truckGroup = this.physics.add.group()
    this.physics.add.collider(this.truckGroup, this.platforms)
    this.physics.add.collider(this.truckGroup, this.truckGroup)
    this.physics.add.collider(this.truckGroup, this.spaceSeparators)
    this.physics.add.collider(this.truckGroup, this.disabledSpaces)

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

    new BackgroundCars(this.registry.get('uniqueCars'), this)

    this.activeInfoPanel = new InfoPanel(50, 670, this)
    this.nextInfoPanel = new InfoPanel(578, 670, this)

    // Generate
    this.generateTruck()
    this.dayTimer()
    EventBus.emit('current-scene-ready', this)
    this.cameras.main.fadeIn(500, 0, 0, 0)
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

  allTrucksInSpace = () => {
    return this.trucks.every((t) =>
      this.spaces.some((s) => s.containsTruck(t.id)),
    )
  }

  generateTruck = () => {
    if (this.trucks.length < this.yardSequence.totalTrucks) {
      const truck = new TruckObject(
        600,
        570,
        this,
        generateOrder(++this.state.currentTruckId),
      )
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
      this.nextInfoPanel.setOrder(truck.order)
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
        if (this.allTrucksInSpace()) {
          this.generateTruck()
        }
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
    this.activeInfoPanel.setOrder()
  }

  triggerTruckStart = () => {
    this.state.activeTruck = this.driver.truck
    this.state.activeTruck!.setActive(true)
    this.driver.setDriveMode(true)
    this.activeInfoPanel.setOrder(this.state.activeTruck?.order)
    if (this.activeInfoPanel.activeOrder == this.nextInfoPanel.activeOrder) {
      this.nextInfoPanel.setOrder()
    }
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
      this.spaces.find((s) => s.id == truck.spaceId)?.reset()
      this.state.truckFullfillment[truck.id] = {
        idleTime: truck.idleTime,
        order: truck.order,
      }
      this.truckGroup.remove(truck.truck)
      truck.truck.destroy()
      this.trucks = this.trucks.filter((t) => t.id !== truck.id)
      this.time.delayedCall(10, () => {
        this.spaces.find((s) => s.id == truck.spaceId)?.reset()
      })
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

