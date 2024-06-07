import Phaser from "phaser";
import Inventory from "../lib/Inventory";
//invetory goes here


export default class Player extends Phaser.Physics.Arcade.Sprite {

    keys: any
    velocity: number
    inventory: Inventory

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame: number) {
        super(scene, x, y, texture, frame)

        scene.add.existing(this)
        scene.physics.add.existing(this)

        // this.setOrigin(0.5,0.5)

        this.keys = scene.input.keyboard?.createCursorKeys()
        this.velocity = 1000

        //make a new inventory for the gems 
        this.inventory = new Inventory(undefined) //todo might have to fix this
    }


    update(): void {
        this.handleMovement()
    }

    handleMovement() {

        let vector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0)
        //arrow keys for movement and normalize it so that diag movements are not faster than the other directions. 
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

    //collides with gems
    addItemToInventory(type: string, amount: number) {
        this.inventory.add(type, amount)
    }
}