import { Scene } from 'phaser';

class SpaceObject {
  constructor()
}

export class YardScene extends Scene {
  platforms: Phaser.Physics.Arcade.StaticGroup
  player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody
  cursors: Phaser.Types.Input.Keyboard.CursorKeys
  yardSpaces: Phaser.Physics.Arcade.StaticGroup
  spaceSeparators: Phaser.Physics.Arcade.StaticGroup
  score = 0;
  scoreText: Phaser.GameObjects.Text
  gameOver = false
  reverseKey: Phaser.Input.Keyboard.Key

  constructor() {
    super('Yard');
  }

  create() {
    this.add.image(1024 / 2, 768 / 2, 'background');

    this.physics.world.defaults.debugShowBody = true;
    this.physics.world.defaults.bodyDebugColor = 0xff00ff;

    this.platforms = this.physics.add.staticGroup();

    this.add.image(1024 / 2, 768 / 2, 'yard').setScale(0.25)
    this.add.image(1024 / 2, 768 / 2, 'dock').setScale(0.25)

    this.platforms.add(new Phaser.GameObjects.Rectangle(this, 1024 / 2, 50, 1024, 100))
    this.platforms.add(new Phaser.GameObjects.Rectangle(this, 1024 / 2, 718, 1024, 100))

    this.yardSpaces = this.physics.add.staticGroup()
    this.yardSpaces.add(new Phaser.GameObjects.Rectangle(this, 100, 150, 80, 100))

    this.spaceSeparators = this.physics.add.staticGroup()
    this.spaceSeparators.add(new Phaser.GameObjects.Rectangle(this, 145, 150, 10, 100))

    this.player = this.physics.add.sprite(100, 450, 'trailer').setScale(.25);
    this.player.setBodySize(this.player.width * 0.60, this.player.height)

    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, this.platforms)
    this.physics.add.collider(this.player, this.spaceSeparators)
    this.physics.add.overlap(this.player, this.yardSpaces, this.checkParking, undefined, this);

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
  }

  checkParking(player, space) {
    if (Phaser.Geom.Rectangle.ContainsRect(
      new Phaser.Geom.Rectangle(space.x - (space.body.width / 2), space.y - (space.body.height / 2), space.body.width, space.body.height),
      new Phaser.Geom.Rectangle(player.x - (player.body.width / 2), player.y - (player.body.height / 2), player.body.width, player.body.height)
    )) {
      console.log('true')
    }
    // if (Phaser.Geom.Rectangle.ContainsRect(
    //   new Phaser.Geom.Rectangle(yardSpace.x, yardSpace.y, (yardSpace.body as Phaser.Physics.Arcade.StaticBody).width, (yardSpace.body as Phaser.Physics.Arcade.StaticBody).height),
    //   new Phaser.Geom.Rectangle(player.x, player.y, player.body.width, player.body.height))) {
    //   console.log('full')
    // }
  }

  // collectStar(player, star) {
  //   (star as Phaser.Physics.Arcade.Sprite).disableBody(true, true);
  //   this.score += 10;
  //   this.scoreText.setText('Score: ' + this.score);

  //   if (this.stars.countActive(true) === 0) {
  //     this.stars.children.iterate((child) => {
  //       const sprite = child as Phaser.Physics.Arcade.Sprite
  //       sprite.enableBody(true, sprite.x, 0, true, true);
  //       return null

  //     });

  //     const x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

  //     const bomb = this.bombs.create(x, 16, 'bomb');
  //     bomb.setBounce(1);
  //     bomb.setCollideWorldBounds(true);
  //     bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);

  //   }
  // }

  // hitBomb(player, bomb) {
  //   this.physics.pause();

  //   player.setTint(0xff0000);

  //   player.anims.play('turn');

  //   this.gameOver = true;
  // }

  update() {
    this.player.setVelocityX(0);
    this.player.setVelocityY(0);

    // if (this.reverseKey.isDown && this.player.anims.currentAnim?.key == 'up') {
    //   this.player.anims.play('down', true);
    //   this.player.setVelocityY(-160);
    // } else if (this.reverseKey.isDown && this.player.anims.currentAnim?.key == 'down') {
    //   this.player.anims.play('up', true);
    //   this.player.setVelocityY(160);
    // } else 

    const velocity = 300
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-1 * velocity);
      this.player.anims.play('left', true);
      this.player.setBodySize(this.player.width, this.player.height * 0.60)
    }
    else if (this.cursors.right.isDown) {
      this.player.setVelocityX(velocity);
      this.player.anims.play('right', true);
      this.player.setBodySize(this.player.width, this.player.height * 0.60)
    }
    else if (this.cursors.up.isDown) {
      this.player.setVelocityY(-1 * velocity);
      this.player.anims.play('up', true);
      this.player.setBodySize(this.player.width * 0.60, this.player.height)
    }
    else if (this.cursors.down.isDown) {
      this.player.setVelocityY(velocity);
      this.player.anims.play('down', true);
      this.player.setBodySize(this.player.width * 0.60, this.player.height)
    }
    else {
      this.player.anims.stop();
    }

    // if (this.cursors.up.isDown && this.player.body.touching.down) {
    //   this.player.setVelocityY(-330);
    // }
  }
}