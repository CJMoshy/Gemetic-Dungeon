import Phaser from "phaser"
import Player from "../prefabs/Player"

import test from '../assets/img/gems/powerup-blue.png' //this will become player char
import tileset from '../assets/tilemap/base_tileset.png'
import mapData from '../assets/tilemap/tileset-1.json'

import { DUNGEON } from "../main"
import { TILECODES } from "../prefabs/generator"


export default class DungeonScene extends Phaser.Scene {

    player: Phaser.Physics.Arcade.Sprite
    velocity: number
    TILESIZEMULTIPLIER: number
    exit: Phaser.Tilemaps.Tile

    constructor() {
        super({ key: 'DungeonScene' })

        this.TILESIZEMULTIPLIER = 8
    }

    init() {}

    preload() {

        console.log(DUNGEON.getRoomParsed())
        mapData.layers[0].data = DUNGEON.getRoomParsed()

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
        const spawn = bgLayer.findTile( (tile) => tile.properties.spawn === true)
        this.exit = bgLayer.findTile( (tile) => tile.properties.exit === true)
        

        console.log(this.exit.x, this.exit.y)
        console.log(TILECODES.EXIT)

        //player
        this.player = new Player(this, spawn.x * this.TILESIZEMULTIPLIER, spawn.y * this.TILESIZEMULTIPLIER, 'test', 0)

        //collides with walls, traps , TODO: json parse
        this.physics.add.collider(this.player, bgLayer)

        
    }

    update(time: number, delta: number): void {
        
        //this is temporary until we have biger tiles and we can refine exit sizes
        if(Math.round(this.player.x) >= (this.exit.x * this.TILESIZEMULTIPLIER) - 10 && Math.round(this.player.x) <= (this.exit.x * this.TILESIZEMULTIPLIER) + 10 && this.player.y >= (this.exit.y * this.TILESIZEMULTIPLIER) - 10 && this.player.y <= (this.exit.y * this.TILESIZEMULTIPLIER) + 10 ){
            console.log('exit time')
        }
    }
}