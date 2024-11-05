import { TruckOrder } from '../types/order'

export class InfoPanel {
  container: Phaser.GameObjects.Container
  truckText: Phaser.GameObjects.Text
  orderText: Phaser.GameObjects.Text
  durationText: Phaser.GameObjects.Text
  activeOrder: TruckOrder | undefined

  constructor(x: number, y: number, scene: Phaser.Scene) {
    this.container = scene.add.container()
    const infoPanel = scene.add.rectangle(x + 100, y + 40, 250, 80, 0xF5FCC1, 0.85).setStrokeStyle(3, 0xABB085)
    this.truckText = scene.add.text(
      infoPanel.getBounds().left + 10,
      infoPanel.getBounds().top + 10,
      `Truck: 1`,
      { fontSize: '14px' }
    ).setColor('black')
    this.orderText = scene.add.text(
      infoPanel.getBounds().left + 10,
      infoPanel.getBounds().top + 30,
      `Order: Chicken Legs`,
      { fontSize: '14px' }
    ).setColor('black')
    this.durationText = scene.add.text(
      infoPanel.getBounds().left + 10,
      infoPanel.getBounds().top + 50,
      `Load/Unload: 20s`,
      { fontSize: '14px' }
    ).setColor('black')

    this.container.add(infoPanel)
    this.container.add(this.truckText)
    this.container.add(this.orderText)
    this.container.add(this.durationText)

    this.setOrder()
  }

  setOrder = (order: TruckOrder | undefined = undefined) => {
    this.container.setVisible(!!order)
    this.activeOrder = order
    if (order) {
      this.truckText.setText(`Order #${order.number}`)
      this.orderText.setText(`Cargo: ${order.cargo}`)
      this.durationText.setText(`Load/Unload: ${order.duration}s`)
    }
  }
}