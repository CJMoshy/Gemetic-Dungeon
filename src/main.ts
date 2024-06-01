import Phaser from "phaser"
import * as Gen from "./prefabs/generator"
import DungeonScene from "./scenes/Dungeon"

const CONFIG = {
    type: Phaser.CANVAS,
    parent: 'phaser-game',
    scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH,
        size: Phaser.Scale.FIT
    },
    // width: 500,  //we might want to manually set a size in the future, for now its auto sizing
    // height: 450,
    // backgroundColor: '#FACADE',
    // pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            // debug: true,
        }
    },
    fps: {
        target: 60, 
    },
    scene: [DungeonScene]
}

export default CONFIG

export const DUNGEON = new Gen.Dungeon((Math.random()*4294967296).toString(), "WWWWWWWW") //seed: get from dom. gene: get from neural map

const GAME = new Phaser.Game(CONFIG)

