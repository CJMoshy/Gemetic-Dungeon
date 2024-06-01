import Phaser from "phaser"
import Player from "../prefabs/Player"

import test from '../assets/img/gems/powerup-blue.png'

export default class Dungeon extends Phaser.Scene {

    player: Phaser.Physics.Arcade.Sprite
    velocity: number


    constructor() {
        super({ key: 'DungeonScene' })
    }

    init() {
        this.velocity = 100
    }

    preload() {
        //some filler asset here for player
        this.load.image('test', test)
    }

    create() {

        //create Player
        this.player = new Player(this, 200, 200, 'test', 0)
       
    }

    update(time: number, delta: number): void {
    }

    


}