import Phaser from "phaser"
import * as Gen from "./lib/Generator"
import DungeonScene from "./scenes/Dungeon"
import IntermissionScene from "./scenes/Intermission"
import StartScene from "./scenes/Start"

const CONFIG = {
    type: Phaser.CANVAS,
    parent: 'phaser-game',
    scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH,
        size: Phaser.Scale.FIT
    },
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
        }
    },
    zoom: 1,
    scene: [StartScene, DungeonScene, IntermissionScene]
}

export default CONFIG

export var DUNGEON = new Gen.Dungeon() //now creates an empty dungeon so Start.ts can initialize() 
window.addEventListener('load', () => {const GAME = new Phaser.Game(CONFIG)});
