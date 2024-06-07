import Phaser from "phaser";
import { DUNGEON } from "../main";
import { tempGeneMaker } from "../prefabs/generator";
import Inventory from "../lib/Inventory";
import { sceneData } from "../lib/interfaces";
import makeNeuralNetCall from "../lib/Client";

export default class IntermissionScene extends Phaser.Scene {

    constructor() {
        super('IntermissionScene')
    }



    init(data: sceneData): void {
        this.add.text(400, 400, 'Loading new map', { fontSize: 50 }).setOrigin(0.5)
        // const gemTypes = ['W', 'E', 'F', 'A']
        let collectedGems = [data.inv.get('W'), data.inv.get('E'), data.inv.get('F'), data.inv.get('A')]
        console.log(data.inv)
        makeNeuralNetCall({ gems: collectedGems }).then(
            result => {
                
                for(let x = 0; x < result[0].length; x++){
    
                    console.log(result[0][x].toFixed(1))
                    
                    let occur = String(result[0][x].toFixed(1))
                    let parsed = parseFloat(occur)
                    if(occur.includes('5')){
                        let choice = Math.floor(Math.random() * 2)
                       
                        if(choice === 0){
                            console.log('rounding DOWN')
                            //round down
                            if(parsed === 0.5){
                                parsed = 0
                            } else {
                              parsed -= 0.1
                              parsed = Math.round(parsed)
                            }
                        }
                        else{
                            console.log('rounding UP')
                            if(parsed === 0.5){
                                parsed = 1
                            } else {
                                parsed += 0.1
                                parsed = Math.round(parsed)
                            }
                        }
                    } else {
                        //round
                       parsed = Math.round(parsed)
                    }

                    console.log('parsed value', parsed)

                   
                }

                






                console.log('\n\n')
                console.log('-------------------------------------------')
                DUNGEON.createNewRoom(tempGeneMaker((Math.floor(100000 + Math.random() * 900000))))
                let timer = this.time.addEvent({
                    delay: 2000,                // ms
                    callback: () => {
                        this.scene.start("DungeonScene")
                    },
                    //args: [],
                    callbackScope: this,
                    loop: false
                });

            }
        )


    }
    preload(): void { }
    create(): void {

        //console.log('new number: ', (Math.floor(100000 + Math.random() * 900000)))
        // DUNGEON.createNewRoom(tempGeneMaker((Math.floor(100000 + Math.random() * 900000))))
        // var timer = this.time.addEvent({
        //     delay: 2000,                // ms
        //     callback: () => {
        //         this.scene.start("DungeonScene")
        //     },
        //     //args: [],
        //     callbackScope: this,
        //     loop: false
        // });
    }

    update(time: number, delta: number): void {
        //console.log('i am updating')
    }
}