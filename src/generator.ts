import * as XXH from "./xxhash.min.js";

export class Dungeon {
    // dungeon base class will:
    //contain reference to the "active"
    //generate and draw a room deterministically based on the seed and gene
    
    currentRoom: Room;

    //max width and height defaults:
    maxW = 100
    maxH = 100
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
    seed;
    gene;
    geneRegex: RegExp = new RegExp('^[WEFA]+$', 'g')
    cols;
    rows;
    tiles: string[][] = [];

    gemCenters: number[][] = [] //accepts ([row, col] format) arrays of coordinates 
    gemEnds: number[][] = [] //accepts ([row, col] format) arrays of coordinates
    //gemCenters and gemEnds are modified every time a room or corridor is created. They will act as viable places for gems to spawn.

    //genetic traits:
    roomShape: string; //W - ellipse, E - square, F - long rect, A - triangle
    gemSpawnStyle: string;
    obstacleType: string;
    wallDeco: string;
    connectionType: string;
    enemyType: string;
    floorStyle: string;
    theme: string; //W,E,F,A
    //store all of these as strings for continuity purposes; they will be evaluated in their respective functions.

    constructor(seed: number, gene: string/*length 8*/, width: number, height: number) {
        if (gene.length != 8) { throw ("Room:Constructor:Gene not length 8.") }
        if (!this.geneRegex.test(gene)) { throw ("Room: Constructor: Gene does not match gene regex pattern.") }
        //console.log(this.geneRegex.test(gene))
        this.r = new SubRandom(seed)
        this.seed = seed
        this.gene = gene
        this.cols = width
        this.rows = height

        //first: set genetic traits based on gene-string.
        this.roomShape = gene[0]
        this.gemSpawnStyle = gene[1]
        this.obstacleType = gene[2]
        this.wallDeco = gene[3]
        this.connectionType = gene[4]
        this.enemyType = gene[5]
        this.floorStyle = gene[6]
        this.theme = gene[7]

        //second: initialize the empty state of the room.
        this.initMap()
        //third: fill the map its empty rooms, connections, and wall alterations.
        this.createSubrooms()

        console.log("Finished creating the room.")
        console.log(`${this}`) //forces pretty toString.
    }

    private initMap() { //called during constructor, do not call from outside.
        //fill our "map" with empty spaces.
        for (let i = 0; i < this.rows; i++) {
            this.tiles.push([])
            for (let j = 0; j < this.cols; j++) {
                this.tiles[i].push(".")
            }
        }
        //console.log(`${this}`)
    }
    private geneDetermine(input: string, waterOpt: any, earthOpt: any, fireOpt: any, airOpt: any) {
        //geneDetermine is a simple helper function so i dont have to write a switch statement every time i wanna plug a gene in/output
        switch (input) {
            case "W":
                return waterOpt;
                break;
            case "E":
                return earthOpt;
                break;
            case "F":
                return fireOpt;
                break;
            case "A":
                return airOpt;
                break;
            default:
                throw ("geneDetermine: input is not a single-letter WEFA.")
                break;
        }

    }

    private createSubrooms() {
        //here, we create the outlines & fills of the rooms, and connect them with our corridors.
        //this is a pretty hefty chunk of code.
        //Min of 4 subrooms, max of 10.
        let numSubrooms = Math.floor(this.r.getR(6)) + 4
        //decide the radius of each subroom based on the number, assuming grid size is hardcoded to 100x100.
        //this radius will be mutated by -1, 0, or 1 when the subroom is constructed in order to create variation.
        let subroomRadius = Math.floor(10 * (0.9 ** (numSubrooms - 4))) //max radius: 10, min radius: 5
        //decide the distance between subrooms based on their size and the corridor connection type.
        /*connection types:
        W = no corridors, rooms touch, slightly overlapping.
        E = Elbow corridors
        F = Rectangle corridors
        A = single-tile corridors.
        */
        let distanceBetween = this.geneDetermine(this.connectionType, -1, subroomRadius / 4, subroomRadius / 2, 1)
        //keycode reference:
        /* 
            . = empty
            ! = the center of a room.
            , = the filled floor of a room
            _ = the filled floor of a hallway
            ^ = obstacle

        */
        let potentialCenter:number[] = [Math.floor(this.r.getR(this.rows / 3) + this.rows / 3), Math.floor(this.r.getR(this.cols / 3) + this.cols / 3)] //i, j position in the center third of the map.
        let currRadius = Math.floor(subroomRadius * (this.r.getR(0.4) + 0.8))
        let nextRadius = Math.floor(subroomRadius * (this.r.getR(0.4) + 0.8))

        switch (this.theme) { //the overall theme of the room will determine the generation method of the room.
            /*Theme 1: water
                pseudocode:
                random starter subroom position, vaguely centered.
                pick a direction, create a hallway in that direction depending on hall style.
                create the next subroom
                pick a direction. If there is already a "center" of the room in that direction, set choicepoint to that position and pick a new dir.
                create the room there, rinse and repeat.
                If a room would be centered such that it would go offscreen, don't pick a point there.
                */
            case "W":
                for (let nRooms = 0; nRooms < numSubrooms; nRooms++) {
                    //set centerpoint to be a ! & push to centerpoint array.  
                    this.tiles[potentialCenter[0]][potentialCenter[1]] = "!"
                    this.gemCenters.push(potentialCenter)
                    //need code for: push to room edge array.

                    //need code here to fill around the room with floor tiles
                    //
                    this.fillRoomCircle(potentialCenter, currRadius)
                    potentialCenter = this.nextRoomCenter(potentialCenter, distanceBetween, currRadius, nextRadius)
                }

        }

    }
    private nextRoomCenter(currCenter: number[], distanceBetween: number, currRadius: number, nextRadius: number):number[] {
        console.log("Inside nRCW, currcenter is: ", currCenter)
        //creates the next center for the room, and connects two rooms via hallway if applicable.
        //uses the Water style of determining room placement.
        switch (this.connectionType) {
            case "W":
                //water-type hallways: overlap rooms by one.
                let tries = 0;
                let nu: number[] = []
                while (tries < 20) {
                    let dir = Math.floor(this.r.getR(4))
                    switch (dir) {
                        case 0: //up
                        console.log("nrcw UP")
                            nu = [currCenter[0] - currRadius + 1 - nextRadius, currCenter[1]]
                            break
                        case 1: //down
                        console.log("nrcw DOWN")
                            nu = [currCenter[0] + currRadius - 1 + nextRadius, currCenter[1]]
                            break
                        case 2: //left
                        console.log("nrcw LEFT")
                            nu = [currCenter[0], currCenter[1] - currRadius + 1 - nextRadius]
                            break
                        case 3: //right
                        console.log("nrcw RIGHT")
                            nu = [currCenter[0], currCenter[1] + currRadius - 1 + nextRadius]
                            break
                    }
                    if (this.gemCenters.includes(nu)) { console.log("ncrw:prev made room"); currCenter = nu; continue; } //if we've found a previously created room, use it as the new center & retry.
                    if (nu[0] <= nextRadius || nu[1] <= nextRadius || nu[0] >= this.rows - nextRadius || nu[1] >= this.cols - nextRadius) { console.log("ncrw: out of bounds radius"); continue } // will overlap boundaries, retry
                    console.log("ncrw done: returning ", nu)
                    return nu
                }
                throw("nextRoomCenterWater: Could not find valid position within allotted tries.")
        }
        return [-1, -1] //bad return, should never get here.
    }

    private fillRoomCircle(currCenter:number[], currRadius:number){
        //should double check for valid center.
        //fill radius of map around point with floor tiles, circle style.

    }
    private fillRoomRectangle(currCenter:number[], currWidth:number, currHeight:number){
        //should double check for valid center.
        //fill radius of map around point with floor tiles, rect style.

    }
    private fillRoomSquare(currCenter:number[], currRadius:number){
        //should double check for valid center.
        //fill radius of map around point with floor tiles, square style.

    }
    private fillRoomTriangle(currCenter:number[], currRadius:number){
        //should double check for valid center.
        //fill radius of map around point with floor tiles, triangle style.

    }

    // thank you stackoverflow for tostring override help
    //https://stackoverflow.com/questions/35361482/typescript-override-tostring
    public toString = (): string => {
        let _str: string = ""
        _str += "Seed: " + this.seed + "\n";
        _str += "Gene: " + this.gene + "\n";
        _str += "Width: " + this.cols + " Height: " + this.rows + "\n";
        _str += "Map: " + "\n";
        for (let i = 0; i < this.rows; i++) {
            let _row: string = "";
            for (let j = 0; j < this.cols; j++) {
                _row += this.tiles[i][j]
            }
            _str += _row + "\n"
        }
        return _str
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
        //console.log("inside getR, seed = ", this.seed)
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
