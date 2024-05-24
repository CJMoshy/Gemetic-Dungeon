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
        this.currentRoom = new Room(this.seed, "WWWWEWWW", this.maxW, this.maxH);
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
        console.log("num subrooms: ", numSubrooms)
        //decide the radius of each subroom based on the number, assuming grid size is hardcoded to 100x100.
        //this radius will be mutated by -1, 0, or 1 when the subroom is constructed in order to create variation.
        let subroomRadius = Math.floor(10 * (0.9 ** (numSubrooms - 4))) //max radius: 10, min radius: 5
        //decide the distance between subrooms based on their size and the corridor connection type.
        /*connection types:
        W = slightly overlapping.
        E = square corridors filled with stuff
        F = straight or diagonal line corridors
        A = single-tile corridors.
        */
        //keycode reference:
        /* 
            . = empty
            ! = the center of a room.
            , = the filled floor of a room
            _ = the filled floor of a hallway
            ^ = obstacle/trap

        */
        let potentialCenter: number[] = [-1, -1];
        let currRadius = 0;
        let nextRadius = 0;
        let distanceBetween = this.geneDetermine(this.connectionType, -1, subroomRadius / 2, subroomRadius, 1)

        switch (this.theme) { //the overall theme of the room will determine the generation method of the room.
            case "W":
                /*Theme 1: water
                pseudocode:
                random starter subroom position, vaguely centered.
                create the next subroom at a random point based on hallway maths.
                create the room there, rinse and repeat. allow for overlapping rooms
                If a room would be centered such that it would go offscreen, don't pick a point there.
                */
                for (let nRooms = 0; nRooms <= numSubrooms; nRooms++) {
                    if (nRooms == 0) {//first pass
                        potentialCenter = [Math.floor(this.r.getR(this.rows / 3) + this.rows / 3), Math.floor(this.r.getR(this.cols / 3) + this.cols / 3)] //i, j position in the center third of the map.
                        currRadius = Math.floor(subroomRadius * (this.r.getR(0.4) + 0.8))
                        nextRadius = Math.floor(subroomRadius * (this.r.getR(0.4) + 0.8))
                    } else {
                        //must create a room at a random, legal point
                        let tries = 0;
                        let placeholder: number[] = []
                        while (tries < 20) {
                            //pick an angle and travel 
                            let theta = this.r.getR(365)
                            let hypotenuse = currRadius + nextRadius + distanceBetween
                            //time to get on that sine cosine shit
                            let deltaY = hypotenuse * Math.cos(theta)
                            let deltaX = hypotenuse * Math.sin(theta)
                            placeholder = [Math.floor(deltaY + potentialCenter[0]), Math.floor(deltaX + potentialCenter[1])]
                            tries++
                            if (tries >= 20) { throw ("water-roomgen: Could not find valid position within allotted tries.") }
                            if (this.gemCenters.includes(placeholder)) { console.log("water-roomgen:prev made room"); continue; } //if we're directly centered on a previously created room, retry.
                            if (placeholder[0] <= nextRadius || placeholder[1] <= nextRadius || placeholder[0] >= this.rows - 1 - nextRadius || placeholder[1] >= this.cols - 1 - nextRadius) { console.log("water-roomgen: out of bounds radius"); continue } // will overlap boundaries, retry
                            break;
                        }


                        potentialCenter = placeholder
                        currRadius = nextRadius
                        nextRadius = Math.floor(subroomRadius * (this.r.getR(0.4) + 0.8))
                    }
                    //set centerpoint to be a ! & push to gem center/edge array.  
                    this.tiles[potentialCenter[0]][potentialCenter[1]] = "!"
                    this.pushRoomGemArray(potentialCenter, currRadius)
                }
                break;
            case "E":
                /* Theme 2: earth
                pseudocode:
                first room is in one of the corners, chosen at random.
                from there, tries to make rooms towards the center of the opposite quadrant. If it is able to reach that point, picks a new, unused quadrant, and looks towards that.
                */
                let quadrant = Math.floor(this.r.getR(4))
                let target: number[] = [0, 0];
                switch (quadrant) {
                    case 0:
                        potentialCenter = [25, 75]
                        target = [75, 75]
                        break;
                    case 1:
                        potentialCenter = [25, 25]
                        target = [75, 75]
                        break;
                    case 2:
                        potentialCenter = [75, 25]
                        target = [25, 75]
                        break;
                    case 3:
                        potentialCenter = [75, 75]
                        target = [25, 25]
                        break;
                }
                //now, mutate target and center slightly to increase variation.
                potentialCenter[0] *= this.r.getR(0.5) + 0.75
                potentialCenter[1] *= this.r.getR(0.5) + 0.75
                target[0] *= this.r.getR(0.5) + 0.75
                target[1] *= this.r.getR(0.5) + 0.75
                let dy = target[0] - potentialCenter[0],
                    dx = target[1] - potentialCenter[1]
                //set firstpass of radii
                currRadius = Math.floor(subroomRadius * (this.r.getR(0.4) + 0.8))
                nextRadius = Math.floor(subroomRadius * (this.r.getR(0.4) + 0.8))
                //loop thru rooms
                for (let nRooms = 0; nRooms <= numSubrooms;) {
                    if (Math.sqrt(dy * dy + dx * dx) >= currRadius + nextRadius + distanceBetween) { //we have not yet reached our destination.
                        let hypotenuse = currRadius + nextRadius + distanceBetween
                        let theta = Math.atan(dx / dy)
                        theta *= this.r.getR(0.2) + 0.9
                        let dy2 = hypotenuse * Math.cos(theta)
                        let dx2 = hypotenuse * Math.sin(theta)
                        let temp = [Math.floor(potentialCenter[0] + dy2), Math.floor(potentialCenter[1] + dx2)]
                        potentialCenter = temp
                        currRadius = nextRadius
                        nextRadius = Math.floor(subroomRadius * (this.r.getR(0.4) + 0.8))

                        //set centerpoint to be a ! & push to gem center/edge array.  
                        this.tiles[potentialCenter[0]][potentialCenter[1]] = "!"
                        this.pushRoomGemArray(potentialCenter, currRadius)
                        nRooms++
                    } else { //need to tg a new quadrant
                        switch (target) {
                            case [75, 25]: //original path was from q2 to q0
                                break;
                            case [25, 25]: //original path was from q3 to q1
                                break;
                            case [75, 25]: //original path was from q0 to q2
                                break;
                            case [75, 75]: //original path was from q1 to q3
                                break;
                        }
                    }
                }
                break;

        }
        this.decoGemArrayDebug()

    }
    private createCorridors() {

    }
    private fillAllRooms() {

    }
    private pushRoomGemArray(potentialCenter: number[], currRadius: number) {
        //push center to center array
        this.gemCenters.push(potentialCenter)
        //push edges to edge array.
        switch (this.roomShape) {
            case "W":
            case "F":
                //N-S-E-W of circle, works same for diamond.
                this.gemEnds.push([potentialCenter[0] - currRadius + 1, potentialCenter[1]])
                this.gemEnds.push([potentialCenter[0] + currRadius - 1, potentialCenter[1]])
                this.gemEnds.push([potentialCenter[0], potentialCenter[1] + currRadius - 1])
                this.gemEnds.push([potentialCenter[0], potentialCenter[1] - currRadius + 1])
                break;
            case "E":
                //corners of square: UL, UR, DL, DR
                this.gemEnds.push([potentialCenter[0] - currRadius + 1, potentialCenter[1] - currRadius + 1])
                this.gemEnds.push([potentialCenter[0] - currRadius + 1, potentialCenter[1] + currRadius - 1])
                this.gemEnds.push([potentialCenter[0] + currRadius - 1, potentialCenter[1] - currRadius + 1])
                this.gemEnds.push([potentialCenter[0] + currRadius - 1, potentialCenter[1] + currRadius - 1])
            case "A":
                //corners of tri: U, DL, DR
                this.gemEnds.push([potentialCenter[0] - currRadius + 1, potentialCenter[1]])
                this.gemEnds.push([potentialCenter[0] + currRadius - 1, potentialCenter[1] - currRadius + 1])
                this.gemEnds.push([potentialCenter[0] + currRadius - 1, potentialCenter[1] + currRadius - 1])
        }
    }
    private decoGemArrayDebug() {
        this.gemCenters.forEach(element => {
            this.tiles[element[0]][element[1]] = "!"
        });
        this.gemEnds.forEach(element => {
            this.tiles[element[0]][element[1]] = "x"
        });
    }

    private fillRoomCircle(currCenter: number[], currRadius: number) {
        //valid center has already been ensured by center creator func
        //fill radius of map around point with floor tiles, circle style.
        //uses modified code from https://www.redblobgames.com/grids/circle-drawing/
        let top = Math.ceil(currCenter[0] - currRadius),
            bottom = Math.floor(currCenter[0] + currRadius),
            left = Math.ceil(currCenter[1] - currRadius),
            right = Math.floor(currCenter[1] + currRadius);
        function inside_circle(center: number[], tile: number[], radius: number) {
            let dx = center[1] - tile[1],
                dy = center[0] - tile[0];
            let distance_squared = dx * dx + dy * dy;
            return distance_squared <= radius * radius;
        }
        for (let row = top; row <= bottom; row++) {
            for (let col = left; col <= right; col++) {
                if (inside_circle(currCenter, [row, col], currRadius)) {
                    this.tiles[row][col] = ","
                }
            }
        }


    }
    private fillRoomRectangle(currCenter: number[], currWidth: number, currHeight: number) {
        //valid center has already been ensured by center creator func
        //fill radius of map around point with floor tiles, rect style.
        //valid center has already been ensured by checker func
        //fill radius of map around point with floor tiles, circle style.
        //uses modified code from https://www.redblobgames.com/grids/circle-drawing/
        let top = currCenter[0] - currHeight,
            bottom = currCenter[0] + currHeight,
            left = currCenter[1] - currWidth,
            right = currCenter[1] + currWidth;

        for (let row = top; row <= bottom; row++) {
            for (let col = left; col <= right; col++) {
                this.tiles[row][col] = ","
            }
        }

    }
    private fillRoomDiamond(currCenter: number[], currRadius: number) {
        //valid center has already been ensured by center creator func
        //fill radius of map around point with floor tiles, diamond style.
        let top = currCenter[0] - currRadius,
            bottom = currCenter[0] + currRadius
        let width = 0
        for (let row = top; row <= bottom; row++) {
            for (let col = currCenter[1] - width; col <= currCenter[1] + width; col++) {
                this.tiles[row][col] = ","
            }
            width += (row < top + Math.floor(((bottom - top) / 2)) ? 1 : -1)
        }

    }
    private fillRoomTriangle(currCenter: number[], currRadius: number) {
        //valid center has already been ensured by center creator func
        //fill radius of map around point with floor tiles, triangle style.
        console.log("in fillTriangle: centerpoint is:", currCenter)
        let top = currCenter[0] - currRadius,
            bottom = currCenter[0] + currRadius - 1;
        //console.log("spans: ", top, " to ", bottom)
        let width = 0
        let rct = 0;
        for (let i = top; i <= bottom; i++) {
            for (let j = currCenter[1] - width; j <= currCenter[1] + width; j++) {
                this.tiles[i][j] = ","
            }
            //increase draw width on odds
            //pointy top, then increases every 2
            rct++
            if (rct % 2 == 1) { width++ }
        }
        console.log("done with fillroomtriangle")
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
