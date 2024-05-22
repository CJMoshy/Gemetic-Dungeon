import * as XXH from "./xxhash.min.js";

export class Dungeon {
    // dungeon base class will:
    //contain a list of the rooms that have been "cleared"
    //contain reference to the "active" room and the player's position
    //generate and draw a room deterministically based on the position of the room

    //rules for rooms:
    //each room has an elemental skew, which will effect a few things
    //water skew 
    //more likely to have "puddles", impassable, circular shapes
    //are circular or composed of circles
    //large and open.
    //fire skew
    //more likely to have "braziers", single-tile pillar walls
    //long and rectangular hallways
    //more enemies
    //earth skew
    //denser, mazelike passageways
    //rooms that branch off to the sides
    //squarelike, geometric
    //air skew
    //open floor, with ringed barriers
    // circular subrooms connected by bridges
    //each room has an "entrance" and an "exit", entrance can't be returned through, exit needs
    //1/2 of "gems" in room to open.
    //only stores current room: can't go backward
    currentRoom: Room;
    skewW = 0; //the skew TOWARDS water-type rooms
    skewE = 0; // towards earth rooms
    skewF = 0; // towards fire rooms
    skewA = 0; //towards air rooms
    //skews should always be zero or larger.
    //max width and height defaults:
    maxW = 25
    maxH = 25
    seedInput = document.getElementById("playerSeedEntry");
    initialPlayerSeedString: string;
    seed: number;
    constructor() {
        this.initialPlayerSeedString = this.seedInput ? this.seedInput.innerText : "defaultSeedaaaaaaaaaaaaa"
        this.seed = XXH.h32(this.initialPlayerSeedString, 0)._high
        console.log("dungon: result of hash =", this.seed)
        //the initial room will be based on seed alone; the skews will all be zero.
        this.currentRoom = new Room(this.seed, this.skewW, this.skewE, this.skewF, this.skewA, this.maxW, this.maxH);
        console.log("Finished Initializing Dungeon!")
    }
}

enum THEME { WATER, EARTH, FIRE, AIR }
class Room {
    r: SubRandom;
    theme: THEME
    map: string[][] = [[]];
    skewW;
    skewE;
    skewF;
    skewA;
    cols;
    rows;
    constructor(seed: number, skewW: number, skewE: number, skewF: number, skewA: number, width: number, height: number) {
        if (skewW < 0 || skewE < 0 || skewF < 0 || skewA < 0) { throw ("Room: constructor: One or more skews below zero.") }
        this.r = new SubRandom(seed)
        this.skewW = skewW
        this.skewE = skewE
        this.skewF = skewF
        this.skewA = skewA
        this.cols = width
        this.rows = height
        //first, decide room theme. This is locked to the opposite of the highest skew.
        //case 1: all are equal
        if (skewW == skewE && skewE == skewF && skewF == skewA) { this.theme = Math.floor(this.r.getR(4)) }
        //case 2: there is a max; if there are multiple at the same skew, sorry, it'll just grab the first.
        else {
            let th = Math.max(skewW, skewE, skewF, skewA)
            switch (th) {
                case skewW:
                    this.theme = THEME.WATER
                    break;
                case skewE:
                    this.theme = THEME.EARTH
                    break;
                case skewF:
                    this.theme = THEME.FIRE
                    break;
                default:
                    this.theme = THEME.AIR
                    break;
            }
        }
        console.log("Room: Constructor: This room's main theme is: ", THEME[this.theme])

        //next: generate the shape of the room. delegating this to initMap().
        this.initMap()
    }

    private initMap() { //called during constructor, do not call from outside.
        for (let i = 0; i < this.rows; i++) { //fill our "map" with empty spaces.
            for (let j = 0; j < this.cols; j++) {
                this.map[i][j] = "."
            }
        }

    }
}

class SubRandom { //this class exists so we can control and manipulate different instances of generators at the same time.
    seed = 0;
    constructor(_seed: number) {
        this.seed = _seed;
        if (this.seed === 0 || this.seed == undefined) { this.seed = Math.random() }
        //console.log("SubRandom initialized seed as: ", this.seed)
    }
    getR(max: number = 1) {
        console.log("inside getR, seed = ", this.seed)
        let rand = SubRandom.sfc32(this.seed, this.seed << 5, this.seed >> 7, this.seed << 13)
        this.seed = (rand * 4294967296)
        //console.log(rand)
        //console.log("getR: Returning ", rand*max )
        return rand * max
    }
    //This is the "simple fast counter 32" randomness function, taken from
    //https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
    //and is part of the practrand testing suite.
    //returns [0, 1], noninclusive.
    private static sfc32(a: integer, b: integer, c: integer, d: integer) {
        //console.log("inside sfc32", a, b, c, d)
        a |= 0; b |= 0; c |= 0; d |= 0;
        let t = (a + b | 0) + d | 0;
        d = d + 1 | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
    public setSeed(_s: number) {
        this.seed = _s
    }

}