import Phaser from "phaser";
import { DUNGEON } from "../main";
import { tempGeneMaker } from "../prefabs/generator";

export default class IntermissionScene extends Phaser.Scene{

    constructor(){
        super('IntermissionScene')
    }



    init(): void{

    }
    preload(): void{
        
    }
    create(): void{
        this.add.text(400, 400, 'Loading new map', {fontSize: 50}).setOrigin(0.5)
        //console.log('new number: ', (Math.floor(100000 + Math.random() * 900000)))
        DUNGEON.createNewRoom(tempGeneMaker((Math.floor(100000 + Math.random() * 900000))))
    }

    update(time: number, delta: number): void {
        //console.log('i am updating')
        var timer = this.time.addEvent({
            delay: 2000,                // ms
            callback: () => {
                this.scene.start("DungeonScene")
            },
            //args: [],
            callbackScope: () => {},
            loop: false
        });
    }
}