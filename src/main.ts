import Phaser from "phaser"
import Dungeon from "./scenes/Dungeon"
import test from "./lib/Client"

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
    scene: [Dungeon]
}

export default CONFIG


const GAME = new Phaser.Game(CONFIG)

// test()



