import Phaser from "phaser"

import * as Gen from "./generator"

const CONFIG = {
    type: Phaser.CANVAS,
    parent: 'phaser-game',
    scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH,
        size: Phaser.Scale.FIT
    },
    // width: 500,  //we might want to manually set a size in the future, for now its auto sizing
    // height: 450,
    backgroundColor: '#FACADE',
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
    scene: []
}
const DUNGEON = new Gen.Dungeon(5, "WWWWWWWW")

const GAME = new Phaser.Game(CONFIG)
