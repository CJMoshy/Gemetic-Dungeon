

export default class Gem extends Phaser.Physics.Arcade.Sprite{
    
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame: number, type: string){
        super(scene, x, y, texture, frame)

        scene.add.existing(this)
        scene.physics.add.existing(this)

        this.setOrigin(0.5, 0.5)

        this.setImmovable() 
        this.type = type
        this.setSize(40, 40)
        console.log('creating new gem @', x, y)
    }


    update(...args: any[]): void {
        //check for collision with player
    }
}