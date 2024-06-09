import Phaser from "phaser"
import Player from "../prefabs/Player"

import test from '../assets/img/player-placeholder.png' //this will become player char
import tileset from '../assets/tilemap/tile4-Sheet.png'
import mapData from '../assets/tilemap/tile4-Sheet.json'
var NoiseNS = require("noisejs")

import Gem from "../prefabs/Gem"

import { DUNGEON } from "../main"
import { TILECODES } from "../lib/Generator"
import { sceneData } from "../lib/interfaces"
import { buttStyle } from "./Start"


//categorizing the codes here, for easy access during autotiling.
const walls = [TILECODES.WALL_W, TILECODES.WALL_E, TILECODES.WALL_F, TILECODES.WALL_A]
const hallways = [TILECODES.FLOOR_1, TILECODES.FLOOR_2, TILECODES.FLOOR_3, TILECODES.FLOOR_4]
const bgFloors = [TILECODES.BG_W, TILECODES.BG_E, TILECODES.BG_F, TILECODES.BG_A]
const transFloors = [TILECODES.FLOOR_1T, TILECODES.FLOOR_2T, TILECODES.FLOOR_3T, TILECODES.FLOOR_4T]
const specialFloors = [TILECODES.SPIKE_1, TILECODES.SPIKE_2, TILECODES.BRAZIER, TILECODES.ENTRANCE, TILECODES.EXIT]
const puddles = [TILECODES.WATER_TILE, TILECODES.WATER_DLR, TILECODES.WATER_ULR, TILECODES.WATER_UDL, TILECODES.WATER_UDR,
TILECODES.WATER_UL, TILECODES.WATER_UR, TILECODES.WATER_DR, TILECODES.WATER_DL,
TILECODES.WATER_D, TILECODES.WATER_U, TILECODES.WATER_L, TILECODES.WATER_R]
const pits = [TILECODES.PIT_TILE, TILECODES.PIT_DLR, TILECODES.PIT_ULR, TILECODES.PIT_UDL, TILECODES.PIT_UDR,
TILECODES.PIT_UL, TILECODES.PIT_UR, TILECODES.PIT_DR, TILECODES.PIT_DL,
TILECODES.PIT_D, TILECODES.PIT_U, TILECODES.PIT_L, TILECODES.PIT_R]


export default class DungeonScene extends Phaser.Scene {

    player: Player
    velocity: number
    TILESIZEMULTIPLIER: number
    SPACER: number
    exit: Phaser.Tilemaps.Tile
    fireText: Phaser.GameObjects.Text
    airText: Phaser.GameObjects.Text
    earthText: Phaser.GameObjects.Text
    waterText: Phaser.GameObjects.Text
    tmpTxt: Phaser.GameObjects.Text

    constructor() {
        super({ key: 'DungeonScene' })
        this.TILESIZEMULTIPLIER = 63
        this.SPACER = 40
    }

    init() { }

    preload() {

        console.log(DUNGEON.getSeed())
        console.log(DUNGEON.getCurrentGene())
        mapData.layers[0].data = DUNGEON.getRoomParsed()

        this.load.image('base-tileset', tileset)
        this.load.tilemapTiledJSON('tilemapJSON', mapData)

        //some filler asset here for player
        this.load.image('test', test)

        //load spritesheet for gems 
        this.load.spritesheet('spritesheet', tileset, { frameWidth: 84, frameHeight: 84 });
    }

    create() {

        const map = this.add.tilemap('tilemapJSON')
        const tileset = map.addTilesetImage('dungeon_tileset', 'base-tileset')
        const bgLayer = map.createLayer('Background', tileset)
        const decoLayer = map.createBlankLayer("Decoration", tileset) //create the empty overlay layer
        const wallDecoLayer = map.createBlankLayer("WallDeco", tileset) //create the empty overlay layer for wall deco
        const wallDecoLayer2 = map.createBlankLayer("WallDeco2", tileset) //create the empty overlay layer for wall deco THIS IS FOR MULTI LAYERING
        const waterDecoLayer = map.createBlankLayer("WaterDeco", tileset) //create the empty overlay layer for wall deco
        const waterDecoLayer2 = map.createBlankLayer("WaterDeco2", tileset) //create the empty overlay layer for wall deco THIS IS FOR MULTI LAYERING
        const pitDecoLayer = map.createBlankLayer("PitDeco", tileset) //create the empty overlay layer for wall deco
        const pitDecoLayer2 = map.createBlankLayer("PitDeco2", tileset) //create the empty overlay layer for wall deco THIS IS FOR MULTI LAYERING

        const spawn = bgLayer.findTile((tile) => tile.properties.spawn === true)
        // this.exit = bgLayer.findTile((tile) => tile.properties.exit === true)
        
        bgLayer.setCollisionByProperty({ collides: true })

        //player
        this.player = new Player(this, (spawn.x * this.TILESIZEMULTIPLIER) + this.SPACER, (spawn.y * this.TILESIZEMULTIPLIER) + this.SPACER, 'test', 0)

        //collides with walls, traps 
        this.physics.add.collider(this.player, bgLayer, (player, tile)=>{
            if(player instanceof Phaser.Tilemaps.Tile){
                console.log('players A TILE')
            }
                
            if(tile instanceof Phaser.Tilemaps.Tile){
                console.log('tielS A TILE')
                console.log(tile.index)
                if(tile.index === 59){
                    const data: sceneData = {
                                inv: this.player.inventory,
                                curGene: DUNGEON.getCurrentGene()
                    }
                    this.scene.start('IntermissionScene', data)
                }
            }
        })
       

        //camera
        this.cameras.main.startFollow(this.player, false, 0.5, 0.5, 0, 0)
        this.cameras.main.setBounds(0,0,map.widthInPixels, map.heightInPixels)
        this.physics.world.setBounds(0,0,map.widthInPixels, map.heightInPixels)

        doOverlayTiles(this, map)
        this.spawnGems()

        //create ui & gamification
        this.add.text(20, 20, 'Current Gene: ' + DUNGEON.getCurrentGene(), buttStyle).setScrollFactor(0)
        this.add.text(20, 50, 'Current Seed: ' + DUNGEON.getSeedString(), buttStyle).setScrollFactor(0)
        this.add.text(this.sys.canvas.width - 200, 20, 'Collected Gems', buttStyle).setScrollFactor(0)
        this.fireText = this.add.text(this.sys.canvas.width - 175, 50, 'Fire: ', buttStyle).setScrollFactor(0)
        this.airText = this.add.text(this.sys.canvas.width - 175, 80, 'Air: ', buttStyle).setScrollFactor(0)
        this.earthText = this.add.text(this.sys.canvas.width - 175, 110, 'Earth: ', buttStyle).setScrollFactor(0)
        this.waterText = this.add.text(this.sys.canvas.width - 175, 140, 'Water: ', buttStyle).setScrollFactor(0)  
    }

   
    update(time: number, delta: number): void {    
        this.fireText.setText('Fire: ' + this.player.inventory.get('F'))
        this.airText.setText('Air: ' + this.player.inventory.get('A'))
        this.earthText.setText('Earth: ' + this.player.inventory.get('E'))
        this.waterText.setText('Water: ' + this.player.inventory.get('W')) 
        this.player.update()
    }

    spawnGems(): void {
        let gemsRef = DUNGEON.getCurrentGems()
        gemsRef.forEach( (e: any) => {
            //map the numbers to a certain gem sprite on the sheet 
            let frame
            switch (e[2].toString()) {
                case 'W':
                    frame = 60
                    break
                case 'E':
                    frame = 61
                    break
                case 'F':
                    frame = 62
                    break
                case 'A':
                    frame = 63
                    break
            }

            //make a new gem and then lower the collison box 
            let gem = new Gem(this, (e[1] * this.TILESIZEMULTIPLIER) + this.SPACER, (e[0] * this.TILESIZEMULTIPLIER) + this.SPACER, 'spritesheet', frame, e[2].toString())

            //add the gem to the inventory and destroy the gem after it collides with the player 
            this.physics.add.collider(this.player, gem, () => {
                this.player.addItemToInventory(gem.type, 1)
                gem.destroy()
            })
        })
    }

    

}


function doOverlayTiles(context: Phaser.Scene, map: Phaser.Tilemaps.Tilemap) {
    var overlayNoise = new NoiseNS.Noise(DUNGEON.getSeed())


    //here, we need to manually draw tiles based on autotiling results.
    // const asciiMap = DUNGEON.getRoom()
    // console.log("got ascii map")
    //map.setLayer("Decoration") //return to main
    function convertToOverlay(_tile: Phaser.Tilemaps.Tile) {
        //console.log(_tile)
        //console.log("looking at: ", _tile.x, _tile.y)
        //okay, so we need to look at: 
        //floor & hall tiles vs wall tiles
        //water tiles vs water tiles
        //pit tiles vs pit tiles

        let doDeco = false
        if (walls.includes(_tile.index)) { //add a variation of wall_null
            map.putTileAt(TILECODES.WALL_NULL, _tile.x, _tile.y, true, "Decoration")
            let c = map.getTileAt(_tile.x, _tile.y, true, "Decoration").setAlpha(Math.abs(overlayNoise.perlin2(_tile.x / 10, _tile.y / 10)) / 2 + 0.5)
        }
        if (hallways.includes(_tile.index) || (doDeco = (bgFloors.includes(_tile.index))) || specialFloors.includes(_tile.index)) {
            if (doDeco) {
                //console.log("in doDeco")
                //do transparent tile overlay here for regular floor tiles.
                //console.log("floor type:", DUNGEON.getFloorStyle())
                switch (DUNGEON.getFloorStyle()) {
                    case "W": //water: perlin flooring.
                        let indde = Math.floor(Math.abs(overlayNoise.perlin2(_tile.x / 10, _tile.y / 10)) * transFloors.length)
                        map.putTileAt(transFloors[indde], _tile.x, _tile.y, true, "Decoration")
                        break;
                    case "E": //earth: diagonal
                        let inddd = (_tile.x + _tile.y) % 4
                        map.putTileAt(transFloors[inddd], _tile.x, _tile.y, true, "Decoration")
                        break;
                    case "F": //fire: simple random flooring.
                        map.putTileAt(transFloors[Math.floor(Math.random() * transFloors.length)], _tile.x, _tile.y, true, "Decoration")
                        break;
                    case "A": //air: tiles
                        let group1 = (Math.floor(((_tile.x) % 8) / 2) + Math.floor(((_tile.y) % 8) / 2)) % 4
                        map.putTileAt(transFloors[group1], _tile.x, _tile.y, true, "Decoration")


                }
            }

            //do floor v wall checking here.
            checkVsWall(_tile, map)
            //checkVsPit(_tile, map)
            //checkVsPuddle(_tile, map)
        }
        else if (puddles.includes(_tile.index)) {
            checkVsPuddle(_tile, map)
            checkVsWall(_tile, map)
        }
        else if (pits.includes(_tile.index)) {
            checkVsPit(_tile, map)
            checkVsWall(_tile, map)
        }

    }

    map.forEachTile(convertToOverlay, context, 0, 0, 100, 100, null, "Background") //search each bg tile, and call the cb func.


}

function checkVsWall(_tile: Phaser.Tilemaps.Tile, map: Phaser.Tilemaps.Tilemap) {
    let code = getTileCode(_tile, walls, map)
    if (code == -1) { return }
    map.putTileAt(FLOOR_VS_WALL[code], _tile.x, _tile.y, false, "WallDeco")
    if (code == 3) {
        map.putTileAt(TILECODES.WALL_D, _tile.x, _tile.y, false, "WallDeco2")
    }
    else if (code == 12){
        map.putTileAt(TILECODES.WALL_R, _tile.x, _tile.y,false, "WallDeco2")
    }
}
function checkVsPuddle(_tile: Phaser.Tilemaps.Tile, map: Phaser.Tilemaps.Tilemap) {
    let code = getTileCode(_tile, puddles, map)
    if (code == -1) { return }
    map.putTileAt(PUDDLE_VS_PUDDLE[code], _tile.x, _tile.y, false, "WaterDeco")
    if (code == 0){
        map.putTileAt(TILECODES.WATER_U, _tile.x, _tile.y, false, "WaterDeco2")
    }
    if (code == 3) {
        map.putTileAt(TILECODES.WATER_R, _tile.x, _tile.y, false, "WaterDeco2")
    }
    else if (code == 12){
        map.putTileAt(TILECODES.WATER_D, _tile.x, _tile.y,false, "WaterDeco2")
    }
}
function checkVsPit(_tile: Phaser.Tilemaps.Tile, map: Phaser.Tilemaps.Tilemap) {
    let code = getTileCode(_tile, pits, map)
    if (code == -1) { return }
    if (code == 0){
        map.putTileAt(TILECODES.PIT_U, _tile.x, _tile.y, false, "PitDeco2")
    }
    map.putTileAt(PIT_VS_PIT[code], _tile.x, _tile.y, false, "PitDeco")
    if (code == 3) {
        map.putTileAt(TILECODES.PIT_R, _tile.x, _tile.y, false, "PitDeco2")
    }
    else if (code == 12){
        map.putTileAt(TILECODES.PIT_D, _tile.x, _tile.y,false, "PitDeco2")
    }
}

const FLOOR_VS_WALL = [ //the tilecode of overlay wall tiles to place when comparing a floor tile to a wall tile.
    -1, // NO ADJACENT WALLS.
    TILECODES.WALL_U, //1 up
    TILECODES.WALL_D,  //2 down
    TILECODES.WALL_U,  //3 up and down //need to also place c2
    TILECODES.WALL_R,  //4 right
    TILECODES.WALL_UR,  //5 up and right
    TILECODES.WALL_DR,  //6 down and right
    TILECODES.WALL_UDR,  //7 up down and right 
    TILECODES.WALL_L,  //8 left
    TILECODES.WALL_UL,  //9 up and left
    TILECODES.WALL_DL,  //10 down and left
    TILECODES.WALL_UDL,  //11 up down and left 
    TILECODES.WALL_L,  //12 left and right  //also place c4
    TILECODES.WALL_ULR,  //13 up left and right
    TILECODES.WALL_DLR,  //14 down left and right 
    -1,  //15 surrounded just make it solid wall -- shouldn't exist? i think? idk.
]

const PUDDLE_VS_PUDDLE = [ // tilecode overlay for when comparing puddle tiles to other puddles tiles
    TILECODES.WATER_DLR, //solo tile //need also place left
    TILECODES.WATER_DLR, //1 Up only
    TILECODES.WATER_ULR, //2 Down Only
    TILECODES.WATER_L, //3 Up and Down //place right
    TILECODES.WATER_UDL, //4 right
    TILECODES.WATER_DL, //5 up and right
    TILECODES.WATER_UL, //6 down and right
    TILECODES.WATER_L, //7 up, down, right
    TILECODES.WATER_UDR, //8 left
    TILECODES.WATER_DR, //9 left and up
    TILECODES.WATER_UR, //10 left and down
    TILECODES.WATER_R, //11 left, down, up
    TILECODES.WATER_U, //12 left and right
    TILECODES.WATER_D,//13 left, right, up
    TILECODES.WATER_U, //14 left, right, down
    -1  //15 - surrounded by water
]

const PIT_VS_PIT = [ //tile code overlay for placing pit tiles relative to other pit tiles
    TILECODES.PIT_DLR, //solo tile, need also place left
    TILECODES.PIT_DLR, //1 up
    TILECODES.PIT_ULR, //2 down
    TILECODES.PIT_L, //3 up and down //place right
    TILECODES.PIT_UDL, //4 right
    TILECODES.PIT_DL, //5 up and right
    TILECODES.PIT_UL, //6 down and right
    TILECODES.PIT_L, //7 up, down, right
    TILECODES.PIT_UDR, //8 left
    TILECODES.PIT_DR, //9 up left
    TILECODES.PIT_UR, //10 down left
    TILECODES.PIT_R, //11 up down left 
    TILECODES.PIT_U, //12 right left
    TILECODES.PIT_D, //13 right left up
    TILECODES.PIT_U, //14 down left right
    -1 //15 surrounded
]

function gridCheck(xpos: number, ypos: number, target: number[], map: Phaser.Tilemaps.Tilemap) {
    if (ypos < 0 || ypos >= map.height || xpos < 0 || xpos >= map.width) { return 0 }

    return target.includes(map.getTileAt(xpos, ypos, true, "Background").index) ? 1 : 0
}

function getTileCode(_tile: Phaser.Tilemaps.Tile, target: number[], map: Phaser.Tilemaps.Tilemap): number {
    let nb = gridCheck(_tile.x, _tile.y - 1, target, map) << 0 //1
    let sb = gridCheck(_tile.x, _tile.y + 1, target, map) << 1 //2
    let eb = gridCheck(_tile.x + 1, _tile.y, target, map) << 2 //4
    let wb = gridCheck(_tile.x - 1, _tile.y, target, map) << 3 //8
    let retVal = nb + sb + eb + wb
    //console.log(retVal)
    return retVal
}

function createOverlayUI(){

}