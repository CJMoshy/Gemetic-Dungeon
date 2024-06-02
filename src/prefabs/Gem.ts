

export default class Gem extends Phaser.GameObjects.Sprite{
    
    constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame: number, type: string){
        super(scene, x, y, texture, frame)

        this.type = type
    }


    update(...args: any[]): void {
        //check for collision with player
    }
}