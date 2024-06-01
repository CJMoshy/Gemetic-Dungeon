import Phaser from "phaser"
import Player from "../prefabs/Player"

import test from '../assets/img/gems/powerup-blue.png' //this will become player char
import tileset from '../assets/tilemap/base_tileset.png'
import mapData from '../assets/tilemap/tileset-1.json'

import { DUNGEON } from "../main"


export default class DungeonScene extends Phaser.Scene {

    player: Phaser.Physics.Arcade.Sprite
    velocity: number


    constructor() {
        super({ key: 'DungeonScene' })
    }

    init() {
        this.velocity = 100
    }

    preload() {
        
        this.load.image('base-tileset', tileset)
        this.load.tilemapTiledJSON('tilemapJSON', mapData)

        //some filler asset here for player
        this.load.image('test', test)
    }

    create() {

        const map = this.add.tilemap('tilemapJSON')
        const tileset = map.addTilesetImage('dungeon_tileset', 'base-tileset')
        const bgLayer = map.createLayer('Background', tileset)
        bgLayer.setCollisionByProperty({collides: true})

        this.player = new Player(this, 200, 200, 'test', 0)

        this.physics.add.collider(this.player, bgLayer)
        
        
    }

    update(time: number, delta: number): void {
    }

    


}