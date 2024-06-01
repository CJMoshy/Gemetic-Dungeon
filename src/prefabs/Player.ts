import Phaser from "phaser";

//invetory goes here


export default class Player extends Phaser.Physics.Arcade.Sprite {

    keys: any
    velocity: number

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame: number) {
        super(scene, x, y, texture, frame)

        scene.add.existing(this)
        scene.physics.add.existing(this)
        scene.events.on('update', this.update, this)


        this.keys = scene.input.keyboard?.createCursorKeys()
        this.velocity = 100
        
        //todo collisions with gems

        //todo inventory


        //todo data exporter
    }


    update(): void {
        this.handleMovment()
    }

    handleMovment() {

        let vector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0)

        if (this.keys.down.isDown) {
            vector.y = 1
        }
        if (this.keys.up.isDown) {
            vector.y = -1

        }
        if (this.keys.left.isDown) {
            vector.x = -1
        }
        if (this.keys.right.isDown) {
            vector.x = 1
        }

        vector.normalize()
        this.setVelocity(this.velocity * vector.x, this.velocity * vector.y)
    }

}