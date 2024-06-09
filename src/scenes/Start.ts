import Phaser from "phaser";
import { DUNGEON } from "../main";
import { sceneData } from "../lib/interfaces";

import fake1 from "../assets/img/fake-1.png"
import fake2 from "../assets/img/fake-2.png"
import fake3 from "../assets/img/fake-3.png"
import fake4 from "../assets/img/fake-4.png"


/**
 * @class StartScene the beginning scene for the game, main menu and seed input
 */
export default class StartScene extends Phaser.Scene {

    /**
     * @constructor
     * @param {Phaser.Scene.key} key the key for the scene (name)
     */
    titleText: Phaser.GameObjects.Text
    fakeTmap: Phaser.GameObjects.Image
    creditsB: Phaser.GameObjects.Text
    startB: Phaser.GameObjects.Text
    credits:Phaser.GameObjects.Text
    constructor() {
        super({ key: 'StartScene' })
    }

    /**
     * 
     * @param {sceneData} data exported data from the last scene, containg both the players inventory and the previous rooms gene
     */
    init(data: sceneData): void {

    }

    
    preload(): void {
        let rand = Math.floor(Math.random() * 4)
        let url
        switch (rand) {
            case 0:
                url = fake1
                break;
            case 1:
                url = fake2
                break;
            case 2:
                url = fake3
                break;
            case 3:
                url = fake4
                break;
        }
        console.log(url)
        const fakeTmapImg = this.load.image("fakeTmapImg",url)
    }
    create(): void {

        this.fakeTmap = this.add.image(0,0,"fakeTmapImg",0).setScale(2,2)

         /*font-family: "hit", sans-serif;
        font-weight: 400;
        font-style: normal;*/

        let titleStyle = {
            fontFamily: 'hit',
            fontSize: 80,
            fontWeight: 400,
            fontStyle: "normal",
            color: "#a16cbe",
            stroke: "#FFFFFF",
            strokeThickness: 8,

        }
        let buttStyle = {
            fontFamily: 'hit',
            fontSize: 30,
            fontWeight: 400,
            fontStyle: "normal",
            color: "#f0f0f0",
            stroke: "#000000",
            strokeThickness: 4,

        }
        this.titleText = this.add.text(this.sys.canvas.width / 2, this.sys.canvas.height / 3, 'Gem-etic Dungeon', titleStyle).setAlign("center").setOrigin(0.5, 0.5)
        this.startB = this.add.text(this.sys.canvas.width / 3 + 50, this.sys.canvas.height / 2, "Start!", buttStyle).setOrigin(0.5, 0.5)
        this.creditsB = this.add.text(this.sys.canvas.width *2/3 - 50, this.sys.canvas.height / 2, "Credits", buttStyle).setOrigin(0.5, 0.5)
        let credText = 'LOREM IPSUM CREDITS'
        this.credits = this.add.text(this.sys.canvas.width *2 - 50, this.sys.canvas.height/4 * 3, "RAAHHHHHHHHH", buttStyle).setOrigin(0.5, 0.5)

        this.startB.setInteractive()
        this.startB.setName("startB")
        this.creditsB.setInteractive()
        this.creditsB.setName("creditsB")


        this.startB.on("pointerdown",()=>{    this.scene.start("DungeonScene")
        }, this)
         
        this.creditsB.on("pointerdown", ()=>{console.log("in creditsB pdown"); this.credits.setVisible(!this.credits.visible)}, this)

      
        //this.credits.setVisible(false)
     }
    update(time: number, delta: number): void {

    }

    
    

}



