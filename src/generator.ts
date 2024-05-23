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

    //max width and height defaults:
    maxW = 10
    maxH = 10
    seed: number;
    constructor(seed: number, initialGene: string) { //The seed should be pulled from DOM, initialGene comes out of CJ's map.
        this.seed = seed
        console.log("dungon: result of hash =", this.seed)
        //the initial room will be based on seed alone; the skews will all be zero.
        this.currentRoom = new Room(this.seed, "WWWWWWWW", this.maxW, this.maxH);
        console.log("Finished Initializing Dungeon!")
    }
}

class Room {
    r: SubRandom;
    gene;
    geneRegex: RegExp = new RegExp('^[WEFA]+$', 'g')
    cols;
    rows;
    tiles: string[][] = [];

    gemCenters: object = [] //accepts [x,y] arrays of coordinates
    gemEnds: object = [] //accepts [x,y] arrays of coordinates
    //gemCenters and gemEnds are modified every time a room or corridor is created. They will act as viable places for gems to spawn.

    //genetic traits:
    roomShape: string; //W - ellipse, E - square, F - long rect, A - triangle
    gemSpawnStyle: string;
    obstacleType: string;
    wallDeco: number; //-1 - concave, 0 - flat, 1 - convex
    connectionType:string;
    enemyType:string;
    floorStyle:string;
    theme:string; //W,E,F,A

    constructor(seed: number, gene: string/*length 8*/, width: number, height: number) {
        if (gene.length != 8) { throw ("Room:Constructor:Gene not length 8.") }
        if (!this.geneRegex.test(gene)) { throw ("Room: Constructor: Gene does not match gene regex pattern.") }
        //console.log(this.geneRegex.test(gene))
        this.r = new SubRandom(seed)
        this.gene = gene
        this.cols = width
        this.rows = height

        //first: set genetic traits based on gene-string.
        this.roomShape = gene[0]
        this.gemSpawnStyle = gene[1]
        this.obstacleType = gene[2]
        this.wallDeco = gene[3] == "W" || gene[3] == "F" ? 0 : (gene[3] == "E" ? 1 : -1)
        this.connectionType = gene[4]
        this.enemyType = gene[5]
        this.floorStyle = gene[6]
        this.theme = gene[7]

        //second: initialize the empty state of the room.
        this.initMap()
        //third: fill the map with large shapes which will be the main areas of the room.
        //space and connect these rooms based on gene[4] - connection type.
    }

    private initMap() { //called during constructor, do not call from outside.
        //fill our "map" with empty spaces.
        for (let i = 0; i < this.rows; i++) {
            this.tiles.push([])
            for (let j = 0; j < this.cols; j++) {
                this.tiles[i].push(".")
            }
        }
        this.prettyPrint()
        //console.log(this.tiles)

    }
    public prettyPrint() {
        let _str: string = ""
        for (let i = 0; i < this.rows; i++) {
            let _row: string = "";
            for (let j = 0; j < this.cols; j++) {
                _row += this.tiles[i][j]
            }
            _str += _row + "\n"
        }
        console.log(_str)
    }
}


class SubRandom { //this class exists so I can control a room's RNG, isolated from Math.random & Math.noise
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
