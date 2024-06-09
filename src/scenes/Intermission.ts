import Phaser from "phaser";
import { DUNGEON } from "../main";
import { sceneData } from "../lib/interfaces";
import makeNeuralNetCall from "../lib/Client";
import geneticAlgorithm from "../prefabs/Genetic";

import { buttStyle } from "./Start";


/**
* @function getRandom pseudo-random number generator
* @param {number} min lowerbounds
* @param {number} max upperbounds
* @returns {number} random number inbetween lower and upperbounds
*/
function getRandom(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

/**
 * @class IntermissionScene the intermission scene for the game, responsible for parsing the new gene and loadng the resulting dungeon
 */
export default class IntermissionScene extends Phaser.Scene {

    /**
     * @constructor
     * @param {Phaser.Scene.key} key the key for the scene (name)
     */
    constructor() {
        super({key: 'IntermissionScene'})
    }

    /**
     * 
     * @param {sceneData} data exported data from the last scene, containg both the players inventory and the previous rooms gene
     */
    init(data: sceneData): void {

        this.add.text(400, 400, 'Loading new map', { fontSize: 50 }).setOrigin(0.5)


        const gemTypes: string[] = ['W', 'E', 'F', 'A'] //gem type ref
        let collectedGems = [data.inv.get('W'), data.inv.get('E'), data.inv.get('F'), data.inv.get('A')] // grab the collected gems from the players invetory
        let finalArr: number[] = [] // this is the array that will contain the parsed numbers from the net call

        //call the API
        makeNeuralNetCall({ gems: collectedGems }).then(
            result => {
                
                //parse the results
                for(let x = 0; x < result[0].length; x++){
    
                    let occur: string = String(result[0][x].toFixed(1))
                    let parsed: number = parseFloat(result[0][x].toFixed(1))

                    if(occur.includes('5')){

                        let choice: number = Math.floor(Math.random() * 2)
                        //if there is a 0.5, then do a choice of 0 or 1
                        //if it is 0.5, go down to 0 or up 
                        // 0 :e.i rebmun eciohc eht no gnidneped 1 o
                        if(choice === 0){
                            if(parsed === 0.5){
                                parsed = 0
                            } else {
                                parsed = parseFloat((parsed - 0.1).toFixed(1));
                                parsed = Math.round(parsed)
                            }
                        }
                        else{
                            if(parsed === 0.5){
                                parsed = 1
                            } else {
                                parsed = parseFloat((parsed + 0.1).toFixed(1));
                                parsed = Math.round(parsed)
                            }
                        }
                    } else {
                       parsed = Math.round(parsed)
                    }
                    finalArr.push(parsed) //push each parsed value 
                }

                let tmpGene = this.parseFinalArr(finalArr, gemTypes) //convert each value to its respective character

                //7th gene is a random one
                tmpGene.push(gemTypes[getRandom(0, 3)])

                //eighth is the most collected
                let indexHighestElement = 0
                let tmpMax = collectedGems[0]
                for(let i = 1; i < collectedGems.length; i++){
                    if(collectedGems[i] > tmpMax){
                        tmpMax = collectedGems[i]
                        indexHighestElement = i
                    }
                }
                tmpGene.push(gemTypes[indexHighestElement])

                //turn the gene array into a string to seed genetic algo
                let gene: string = tmpGene.toString()
                gene = gene.replace(/,/g,'')


                let gene2:string = data.curGene

                let oldGene = DUNGEON.getCurrentGene()
                let additionText =
`Old Gene: ${oldGene}
New Gene: ${gene}]`
                this.add.text(this.sys.canvas.width/2, this.sys.canvas.height/2, additionText, buttStyle)
                //TODO: liams algo will go here
                gene = geneticAlgorithm(gene, gene2, 0)
                gene = gene.replace(/,/g,'')

                
                DUNGEON.createNewRoom(gene) // change this value to the result of liams algo

                //start a timer once everything is finished 
                this.time.addEvent({
                    delay: 2000,  
                    callback: () => {
                        this.scene.start("DungeonScene")
                    },
                    callbackScope: this,
                    loop: false
                })
            }
        )
    }

    //ununsed as of now...
    preload(): void { }
    create(): void {}
    update(time: number, delta: number): void {}


    /**
     * this function takes in the numbers as integers and maps them to the respective characters
     * @param {number[]} arr the array after being parsed (trimmed to whole integer)
     * @param {string[]} gemTypes constant array representing the gemtype locations, used mainly for Neural Net refrence
     * @returns {string}
     */
    parseFinalArr(arr: number[], gemTypes: string[]): string[]{
        let result: string[] = []

        arr.forEach(element => {
            result.push(gemTypes[element])
        })

        return result
    }
}