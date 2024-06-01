import * as XXH from "../lib/xxhash.min.js";

export class Dungeon {
    // dungeon base class will:
    //contain reference to the "active"
    //generate and draw a room deterministically based on the seed and gene

    private currentRoom: Room;

    //max width and height defaults:
    private maxW = 100
    private maxH = 100
    private seedStr: string;
    private seed: number;
    constructor(_seed: string, initialGene: string) { //The seed should be pulled from DOM, initialGene comes out of CJ's map.
        this.seedStr = _seed
        this.seed = XXH.h32(this.seedStr, 0)._low
        console.log("dungon: result of hash =", this.seed)
        //tempGene is for randomized testing. remove it for prod
        let tempGene = tempGeneMaker(this.seed)
        this.currentRoom = new Room(this.seed, /* tempGene*/ initialGene, this.maxW, this.maxH);
        console.log("Finished Initializing Dungeon!")
    }

    public getSeed(): number {
        return this.seed
    }
    public getSeedString(): string {
        return this.seedStr
    }
    public getW(): number {
        return this.maxW
    }
    public getH(): number {
        return this.maxH
    }
    public getCurrentGene(): string {
        return this.currentRoom.gene
    }
    public getRoom(): object {
        return this.currentRoom
    }
    public createNewRoom(newGene: string) {
        this.currentRoom = new Room(this.seed, newGene, this.maxW, this.maxH)
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
    savedRadii: number[] = [] //accepts integers
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

        //third: fill the map with its empty rooms, connections, and wall alterations.
        this.createSubrooms()
        this.createCorridors()
        this.fillAllRooms()

        //fill the room with gems

        //fill the room with traps

        //this.decoGemArrayDebug()
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

        let genFunc = this.geneDetermine(this.theme, this.genRoomWater, this.genRoomEarth, this.genRoomFire, this.genRoomAir)

        genFunc(numSubrooms, subroomRadius, this)

    }
    private genRoomWater(numSubrooms: number, subroomRadius: number, context: any) {
        let potentialCenter: number[] = [-1, -1];
        let currRadius = 0;
        let nextRadius = 0;
        let distanceBetween = context.geneDetermine(context.connectionType, -1, subroomRadius / 2, subroomRadius, subroomRadius)
        /*Theme 1: water
               pseudocode:
               random starter subroom position, vaguely centered.
               create the next subroom at a random point based on hallway maths.
               create the room there, rinse and repeat. allow for overlapping rooms
               If a room would be centered such that it would go offscreen, don't pick a point there.
               */
        for (let nRooms = 0; nRooms <= numSubrooms; nRooms++) {
            if (nRooms == 0) {//first pass
                potentialCenter = [Math.floor(context.r.getR(context.rows / 3) + context.rows / 3), Math.floor(context.r.getR(context.cols / 3) + context.cols / 3)] //i, j position in the center third of the map.
                currRadius = Math.floor(subroomRadius * (context.r.getR(0.4) + 0.8))
                nextRadius = Math.floor(subroomRadius * (context.r.getR(0.4) + 0.8))
            } else {
                //must create a room at a random, legal point
                let tries = 0;
                let placeholder: number[] = []
                while (tries < 20) {
                    //pick an angle and travel 
                    let theta = context.r.getR(365)
                    let hypotenuse = currRadius + nextRadius + distanceBetween
                    //time to get on that sine cosine shit
                    let deltaY = hypotenuse * Math.cos(theta)
                    let deltaX = hypotenuse * Math.sin(theta)
                    placeholder = [Math.floor(deltaY + potentialCenter[0]), Math.floor(deltaX + potentialCenter[1])]
                    tries++
                    if (tries >= 20) { throw ("water-roomgen: Could not find valid position within allotted tries.") }
                    if (context.gemCenters.includes(placeholder)) { console.log("water-roomgen:prev made room"); continue; } //if we're directly centered on a previously created room, retry.
                    if (placeholder[0] <= nextRadius || placeholder[1] <= nextRadius || placeholder[0] >= context.rows - 1 - nextRadius || placeholder[1] >= context.cols - 1 - nextRadius) { console.log("water-roomgen: out of bounds radius"); continue } // will overlap boundaries, retry
                    break;
                }
                potentialCenter = placeholder
                currRadius = nextRadius
                nextRadius = Math.floor(subroomRadius * (context.r.getR(0.4) + 0.8))
            }
            //set centerpoint to be a ! & push to gem center/edge array.  
            context.tiles[potentialCenter[0]][potentialCenter[1]] = "!"
            context.pushRoomGemArray(potentialCenter, currRadius)
        }
    }
    private genRoomFire(numSubrooms: number, subroomRadius: number, context: any) {
        let potentialCenter: number[] = [-1, -1];
        let currRadius = 0;
        let nextRadius = 0;
        let distanceBetween = context.geneDetermine(context.connectionType, -1, subroomRadius / 2, subroomRadius, subroomRadius)
        /* Theme 2: fire *used to be earth
                pseudocode:
                first room is in one of the corners, chosen at random.
                from there, tries to make rooms towards the center of the opposite quadrant. If it is able to reach that point, picks a new, unused quadrant, and looks towards that.
                */
        let ogQ = Math.floor(context.r.getR(4))
        let ogC = (ogQ + 2) % 4

        let target: number[] = [0, 0];
        switch (ogQ) {
            case 0:
                potentialCenter = [0 + subroomRadius * 2, context.cols - subroomRadius * 2]
                target = [context.cols - subroomRadius * 2, 0 + subroomRadius * 2]
                break;
            case 1:
                potentialCenter = [0 + subroomRadius * 2, 0 + subroomRadius * 2]
                target = [context.cols - subroomRadius * 2, context.cols - subroomRadius * 2]
                break;
            case 2:
                potentialCenter = [context.cols - subroomRadius * 2, 0 + subroomRadius * 2]
                target = [0 + subroomRadius * 2, context.cols - subroomRadius * 2]
                break;
            case 3:
                potentialCenter = [context.cols - subroomRadius * 2, context.cols - subroomRadius * 2]
                target = [0 + subroomRadius * 2, 0 + subroomRadius * 2]
                break;
        }
        //now, mutate center & target slightly to increase variation.
        potentialCenter[0] *= context.r.getR(0.1) + 0.95
        potentialCenter[1] *= context.r.getR(0.1) + 0.95
        target[0] *= context.r.getR(0.1) + 0.95
        target[1] *= context.r.getR(0.1) + 0.95
        let dy = target[0] - potentialCenter[0],
            dx = target[1] - potentialCenter[1]
        //console.log("initial center:", potentialCenter, " initial target:", target)
        //set firstpass of radii
        currRadius = Math.floor(subroomRadius * (context.r.getR(0.4) + 0.8))
        nextRadius = Math.floor(subroomRadius * (context.r.getR(0.4) + 0.8))

        //loop thru rooms
        for (let nRooms = 0; nRooms <= numSubrooms;) {
            //set centerpoint to be a ! & push to gem center/edge array.  
            //we have already creatd the first place, at the original potential center.
            //console.log("attempting to place room center @ ", potentialCenter)
            potentialCenter = [Math.floor(potentialCenter[0]), Math.floor(potentialCenter[1])]
            context.tiles[potentialCenter[0]][potentialCenter[1]] = nRooms.toString()
            context.pushRoomGemArray(potentialCenter, currRadius)

            //now, find a new potential center.
            //console.log("current dist from target: ", Math.sqrt(dy * dy + dx * dx))
            if (Math.sqrt(dy * dy + dx * dx) >= currRadius + nextRadius + distanceBetween) { //we have not yet reached our destination.
                let theta = Math.atan2(dy, dx)
                //mutate theta just a little bit
                theta *= context.r.getR(0.1) + 0.95
                let hypotenuse = currRadius + nextRadius + distanceBetween
                let dy2, dx2;
                dy2 = hypotenuse * Math.sin(theta)
                dx2 = hypotenuse * Math.cos(theta)
                //console.log("theta: ", theta * (180 / 3.14))
                //console.log("dy2:", dy2, "dx2:", dx2)
                let temp = [Math.floor(potentialCenter[0] + dy2), Math.floor(potentialCenter[1] + dx2)]
                potentialCenter = temp
                currRadius = nextRadius
                nextRadius = Math.floor(subroomRadius * (context.r.getR(0.4) + 0.8))

                //update dx and dy to reflect most recent center
                dy = target[0] - potentialCenter[0]
                dx = target[1] - potentialCenter[1]
                nRooms++ //only want to inc rooms if we've placed one.
            } else { //need to tg a new quadrant
                //console.log("earth-room: picking a new quadrant as target.")
                let newQ = ogQ;
                while (newQ == ogQ || newQ == ogC) {
                    newQ = Math.floor(context.r.getR(4))
                }
                switch (newQ) {
                    case 0:
                        target = [context.cols - subroomRadius * 2, 0 + subroomRadius * 2]
                        break;
                    case 1:
                        target = [context.cols - subroomRadius * 2, context.cols - subroomRadius * 2]
                        break;
                    case 2:
                        target = [0 + subroomRadius * 2, context.cols - subroomRadius * 2]
                        break;
                    case 3:
                        target = [0 + subroomRadius * 2, 0 + subroomRadius * 2]
                        break;
                }
                //console.log("new target is: ", target)
                dy = target[0] - potentialCenter[0]
                dx = target[1] - potentialCenter[1]
                //nRooms++
            }

        }
    }
    private genRoomEarth(numSubrooms: number, subroomRadius: number, context: any) {
        let potentialCenter: number[] = [-1, -1];
        let currRadius = 0;
        let nextRadius = 0;
        let distanceBetween = Math.floor(context.geneDetermine(context.connectionType, subroomRadius * 2 - 1, subroomRadius * 2.5, subroomRadius * 3, subroomRadius * 3))
        //console.log("distanceBetween: ", distanceBetween)
        //console.log("subroomRadius:", subroomRadius)
        //style 3: earth *used to be fire
        //rooms are aligned in a grid. 
        //begin with the center of the grid.
        potentialCenter = [Math.floor(context.rows / 2), Math.floor(context.cols / 2)]
        context.tiles[potentialCenter[0]][potentialCenter[1]] = "?"
        //console.log("og room @:", potentialCenter)
        context.pushRoomGemArray(potentialCenter, subroomRadius)
        //now, for the remaining rooms, step in a random cardinal direction that does not already have a room there.
        //the distance stepped should be constant every time, and it should check that there is not already a room there.
        //if there Is a room there, it will keep stepping in the same direction until there is not a room or it is out of bounds.
        //for ease of coding, fire-rooms will not have variation in subroom radius.

        //main loop. starts @ 1 bc we've already placed center.
        for (let nRooms = 1; nRooms < numSubrooms; nRooms++) {
            let tryCenter: number[] = [potentialCenter[0], potentialCenter[1]] //don't want to override potentialcenter until we know it's good.
            let tries = 0
            let dir = Math.floor(context.r.getR(4))
            //inner loop
            while (tries < 20) {
                //first, step.
                switch (dir) {
                    case 0: //up
                        tryCenter[0] -= distanceBetween
                        //console.log("stepping up")
                        break;
                    case 1: //down
                        tryCenter[0] += distanceBetween
                        //console.log("stepping down")
                        break;
                    case 2: //right
                        tryCenter[1] += distanceBetween
                        //console.log("stepping right")
                        break;
                    case 3: //left
                        tryCenter[1] -= distanceBetween
                        //console.log("stepping ;eft")
                        break;
                }
                //now, check.
                //out of bounds?
                if (tryCenter[0] < 0 + subroomRadius || tryCenter[0] > context.rows - subroomRadius || tryCenter[1] < 0 + subroomRadius || tryCenter[1] > context.cols - subroomRadius) {
                    //restart and randomize again.
                    tryCenter = [potentialCenter[0], potentialCenter[1]]
                    dir = Math.floor(context.r.getR(4))
                    tries++
                    //console.log("out of bounds")

                }
                else if (context.tiles[tryCenter[0]][tryCenter[1]] == "?") {//then we want to keep stepping in the same direction.
                    //console.log(tryCenter)
                    //do not randomize dir
                    //console.log("already room here")
                    tries++

                } else {
                    //good.
                    potentialCenter = [tryCenter[0], tryCenter[1]]
                    context.tiles[potentialCenter[0]][potentialCenter[1]] = "?"
                    //console.log("good room, placing at: ", potentialCenter)

                    context.pushRoomGemArray(potentialCenter, subroomRadius)
                    break;
                }

            }//inner loop end
            //console.log("i should appear directly after good room")
            if (tries >= 20) {
                throw ("genRoomFire: stepCard: Could not find good room in allotted tries.")
            }
        }


    }
    private genRoomAir(numSubrooms: number, subroomRadius: number, context: any) {
        let originalCenter: number[] = [Math.floor(context.rows / 2), Math.floor(context.cols / 2)];
        //the original potential center is going to be the center, always.
        let currRadius = 0;
        let nextRadius = 0;
        let distanceBetween = context.geneDetermine(context.connectionType, -1, subroomRadius * 1.5, subroomRadius * 1.5, subroomRadius * 1.5)
        let thetaInc = 2 * 3.14 / (numSubrooms - 1)
        //console.log("thetaInc:", thetaInc)
        let theta = context.r.getR(2 * 3.14) //randomized starting theta.
        //console.log("starting theta:", theta)
        for (let nRooms = 0; nRooms < numSubrooms; nRooms++) {
            if (nRooms == 0) { //first pass
                currRadius = Math.floor(subroomRadius * (context.r.getR(0.4) + 0.8))
                nextRadius = Math.floor(subroomRadius * (context.r.getR(0.4) + 0.8))
                context.pushRoomGemArray(originalCenter, currRadius)
            } else {
                let hypotenuse = currRadius + nextRadius + distanceBetween
                let dx = hypotenuse * Math.sin(theta)
                let dy = hypotenuse * Math.cos(theta)
                let py = Math.floor(originalCenter[0] - dy)
                let px = Math.floor(originalCenter[1] - dx)
                context.pushRoomGemArray([py, px], nextRadius)
                // console.log("potential center @:", py, px)
                // context.tiles[py][px] = "+"

                nextRadius = Math.floor(subroomRadius * (context.r.getR(0.4) + 0.8)) //only need to change nextradius, center shape stays the same.
                theta += thetaInc
            }
        }
    }

    private createCorridors() {
        if (this.connectionType == "W") {
            //no work then! tee hee
            return;
        }
        if (this.theme == "A") {
            //then we need to do a special-case spoke connection.
            this.createCorridorsAir()
            return;
        }
        //for water, earth and fire themed rooms.
        switch (this.connectionType) {
            case "E":
                //earth corridors:
                //create squares between the centerpoints of each subroom.
                for (let curr = 0; curr < this.gemCenters.length - 1; curr++) {
                    //looping through the current rooms and the next room in the array.
                    // may cause some funny generation when rooms are not drawn adjacent to each other. but whatever.
                    let next = curr + 1
                    let top: number, bottom: number, left: number, right: number
                    top = Math.min(this.gemCenters[curr][0], this.gemCenters[next][0])
                    bottom = Math.max(this.gemCenters[curr][0], this.gemCenters[next][0])
                    left = Math.min(this.gemCenters[curr][1], this.gemCenters[next][1])
                    right = Math.max(this.gemCenters[curr][1], this.gemCenters[next][1])
                    for (let row = top; row <= bottom; row++) {
                        for (let col = left; col <= right; col++) {
                            this.tiles[row][col] = "_"
                        }
                    }

                }
                break;
            case "F":
                //fire corridors: L-shape from curr to next.
                for (let curr = 0; curr < this.gemCenters.length - 1; curr++) {
                    //looping through the current rooms and the next room in the array.
                    // may cause some funny generation when rooms are not drawn adjacent to each other. but whatever.
                    let next = curr + 1
                    let currCenter = this.gemCenters[curr]
                    let nextCenter = this.gemCenters[next]

                    let top: number, bottom: number, left: number, right: number
                    top = Math.min(this.gemCenters[curr][0], this.gemCenters[next][0])
                    bottom = Math.max(this.gemCenters[curr][0], this.gemCenters[next][0])
                    left = Math.min(this.gemCenters[curr][1], this.gemCenters[next][1])
                    right = Math.max(this.gemCenters[curr][1], this.gemCenters[next][1])
                    let vert: number, horiz: number
                    //decide which flavor of "L" to draw:
                    //left-down
                    //right-down
                    //left-up
                    //right-up

                    //truth table:
                    //current above and to the left OR below and to the right
                    //  = LD or RU
                    //current above and to the right OR below and to the left
                    //  = LU or RD
                    // a = current above
                    // b = current to the left
                    let a: boolean, b: boolean
                    a = currCenter[0] <= nextCenter[0]
                    b = currCenter[1] <= nextCenter[1]
                    if ((a && b) || (!a && !b)) {
                        //LD or RU code here
                        let choose = Math.floor(this.r.getR(2))
                        vert = choose == 0 ? bottom : top
                        horiz = choose == 0 ? left : right
                    } else {
                        //LU or RD here
                        let choose = Math.floor(this.r.getR(2))
                        vert = choose == 0 ? top : bottom
                        horiz = choose == 0 ? left : right
                    }
                    for (let row = top; row <= bottom; row++) {
                        this.tiles[row][horiz] = "_"
                    }
                    for (let col = left; col <= right; col++) {

                        this.tiles[vert][col] = "_"
                    }


                }
                break;
            case "A":
                //console.log("making air corridors")
                //draw a three-wide diagonal line from current center to next center.
                for (let curr = 0; curr < this.gemCenters.length - 1; curr++) {
                    //looping through the current rooms and the next room in the array.
                    // may cause some funny generation when rooms are not drawn adjacent to each other. but whatever.
                    let next = curr + 1
                    let currCenter = this.gemCenters[curr]
                    let nextCenter = this.gemCenters[next]
                    let top: number, bottom: number, left: number, right: number
                    top = Math.min(this.gemCenters[curr][0], this.gemCenters[next][0])
                    bottom = Math.max(this.gemCenters[curr][0], this.gemCenters[next][0])
                    left = Math.min(this.gemCenters[curr][1], this.gemCenters[next][1])
                    right = Math.max(this.gemCenters[curr][1], this.gemCenters[next][1])
                    //math taken from https://stackoverflow.com/questions/910882/how-can-i-tell-if-a-point-is-nearby-a-certain-line
                    for (let row = top; row <= bottom; row++) {
                        for (let col = left; col <= right; col++) {
                            //now the intensive calculations.
                            let y0 = row,
                                x0 = col,
                                y1 = currCenter[0],
                                x1 = currCenter[1],
                                y2 = nextCenter[0],
                                x2 = nextCenter[1]
                            let numer = Math.abs((x2 - x1) * (y1 - y0) - (x1 - x0) * (y2 - y1))
                            let denom = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
                            //console.log(numer, denom, (numer/denom))
                            if (numer / denom <= 1) {
                                this.tiles[row][col] = "_"
                            }
                        }
                    }

                }
                break;
        }
    }
    private createCorridorsAir() {
        //these are the same functions as above, but instead of looping thru all rooms, they create a "spoke" type path from the center room to each other room.
        //for water, earth and fire themed rooms.
        switch (this.connectionType) {
            case "E":
                //earth corridors:
                //create squares between the centerpoints of each subroom.

                for (let curr = 0; curr < this.gemCenters.length - 1; curr++) {
                    //looping through the current rooms and the next room in the array.
                    // may cause some funny generation when rooms are not drawn adjacent to each other. but whatever.
                    let next = curr + 1
                    let top: number, bottom: number, left: number, right: number
                    top = Math.min(this.gemCenters[0][0], this.gemCenters[next][0])
                    bottom = Math.max(this.gemCenters[0][0], this.gemCenters[next][0])
                    left = Math.min(this.gemCenters[0][1], this.gemCenters[next][1])
                    right = Math.max(this.gemCenters[0][1], this.gemCenters[next][1])
                    for (let row = top; row <= bottom; row++) {
                        for (let col = left; col <= right; col++) {
                            this.tiles[row][col] = "_"
                        }
                    }

                }
                break;
            case "F":
                //fire corridors: L-shape from curr to next.
                for (let curr = 0; curr < this.gemCenters.length - 1; curr++) {
                    //looping through the current rooms and the next room in the array.
                    // may cause some funny generation when rooms are not drawn adjacent to each other. but whatever.
                    let next = curr + 1
                    let currCenter = this.gemCenters[0]
                    let nextCenter = this.gemCenters[next]

                    let top: number, bottom: number, left: number, right: number
                    top = Math.min(this.gemCenters[0][0], this.gemCenters[next][0])
                    bottom = Math.max(this.gemCenters[0][0], this.gemCenters[next][0])
                    left = Math.min(this.gemCenters[0][1], this.gemCenters[next][1])
                    right = Math.max(this.gemCenters[0][1], this.gemCenters[next][1])
                    let vert: number, horiz: number
                    //decide which flavor of "L" to draw:
                    //left-down
                    //right-down
                    //left-up
                    //right-up

                    //truth table:
                    //current above and to the left OR below and to the right
                    //  = LD or RU
                    //current above and to the right OR below and to the left
                    //  = LU or RD
                    // a = current above
                    // b = current to the left
                    let a: boolean, b: boolean
                    a = currCenter[0] <= nextCenter[0]
                    b = currCenter[1] <= nextCenter[1]
                    if ((a && b) || (!a && !b)) {
                        //LD or RU code here
                        let choose = Math.floor(this.r.getR(2))
                        vert = choose == 0 ? bottom : top
                        horiz = choose == 0 ? left : right
                    } else {
                        //LU or RD here
                        let choose = Math.floor(this.r.getR(2))
                        vert = choose == 0 ? top : bottom
                        horiz = choose == 0 ? left : right
                    }
                    for (let row = top; row <= bottom; row++) {
                        this.tiles[row][horiz] = "_"
                    }
                    for (let col = left; col <= right; col++) {

                        this.tiles[vert][col] = "_"
                    }


                }
                break;
            case "A":
                //console.log("making air corridors")
                //draw a three-wide diagonal line from current center to next center.
                for (let curr = 0; curr < this.gemCenters.length - 1; curr++) {
                    //looping through the current rooms and the next room in the array.
                    // may cause some funny generation when rooms are not drawn adjacent to each other. but whatever.
                    let next = curr + 1
                    let currCenter = this.gemCenters[0]
                    let nextCenter = this.gemCenters[next]
                    let top: number, bottom: number, left: number, right: number
                    top = Math.min(this.gemCenters[0][0], this.gemCenters[next][0])
                    bottom = Math.max(this.gemCenters[0][0], this.gemCenters[next][0])
                    left = Math.min(this.gemCenters[0][1], this.gemCenters[next][1])
                    right = Math.max(this.gemCenters[0][1], this.gemCenters[next][1])
                    //math taken from https://stackoverflow.com/questions/910882/how-can-i-tell-if-a-point-is-nearby-a-certain-line
                    for (let row = top; row <= bottom; row++) {
                        for (let col = left; col <= right; col++) {
                            //now the intensive calculations.
                            let y0 = row,
                                x0 = col,
                                y1 = currCenter[0],
                                x1 = currCenter[1],
                                y2 = nextCenter[0],
                                x2 = nextCenter[1]
                            let numer = Math.abs((x2 - x1) * (y1 - y0) - (x1 - x0) * (y2 - y1))
                            let denom = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
                            //console.log(numer, denom, (numer/denom))
                            if (numer / denom <= 1) {
                                this.tiles[row][col] = "_"
                            }
                        }
                    }

                }
                break;
        }
    }

    private fillAllRooms() {
        let fillFunc = this.geneDetermine(this.roomShape, this.fillRoomCircle, this.fillRoomRectangle, this.fillRoomDiamond, this.fillRoomTriangle)
        //console.log(this.roomShape)
        let i = 0
        this.gemCenters.forEach(element => {
            fillFunc(element, this.savedRadii[i], this)
            i++
        });
    }

    private pushRoomGemArray(potentialCenter: number[], currRadius: number) {
        //push center to center array
        this.gemCenters.push(potentialCenter)
        this.savedRadii.push(currRadius)
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
                break;
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

    private fillRoomCircle(currCenter: number[], currRadius: number, context: Room) {
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
                    context.tiles[row][col] = ","
                }
            }
        }


    }
    private fillRoomRectangle(currCenter: number[], currRadius: number, context: Room) {
        console.log("in fillRoomRect")
        //valid center has already been ensured by center creator func
        //fill radius of map around point with floor tiles, rect style.
        //valid center has already been ensured by checker func
        //fill radius of map around point with floor tiles, circle style.
        //uses modified code from https://www.redblobgames.com/grids/circle-drawing/
        let top = currCenter[0] - currRadius,
            bottom = currCenter[0] + currRadius,
            left = currCenter[1] - currRadius,
            right = currCenter[1] + currRadius;

        for (let row = top; row <= bottom; row++) {
            for (let col = left; col <= right; col++) {
                context.tiles[row][col] = ","
            }
        }

    }
    private fillRoomDiamond(currCenter: number[], currRadius: number, context: Room) {
        //valid center has already been ensured by center creator func
        //fill radius of map around point with floor tiles, diamond style.
        let top = currCenter[0] - currRadius,
            bottom = currCenter[0] + currRadius
        let width = 0
        for (let row = top; row <= bottom; row++) {
            for (let col = currCenter[1] - width; col <= currCenter[1] + width; col++) {
                context.tiles[row][col] = ","
            }
            width += (row < top + Math.floor(((bottom - top) / 2)) ? 1 : -1)
        }

    }
    private fillRoomTriangle(currCenter: number[], currRadius: number, context: Room) {
        //valid center has already been ensured by center creator func
        //fill radius of map around point with floor tiles, triangle style.
        //console.log("in fillTriangle: centerpoint is:", currCenter)
        let top = currCenter[0] - currRadius,
            bottom = currCenter[0] + currRadius;
        //console.log("spans: ", top, " to ", bottom)
        let width = 0
        let rct = 0;
        for (let i = top; i <= bottom; i++) {
            for (let j = currCenter[1] - width; j <= currCenter[1] + width; j++) {
                context.tiles[i][j] = ","
            }
            //increase draw width on odds
            //pointy top, then increases every 2
            rct++
            if (rct % 2 == 1) { width++ }
        }
        //console.log("done with fillroomtriangle")
    }

    public toString(): string {
        // thank you stackoverflow for tostring override help
        //https://stackoverflow.com/questions/35361482/typescript-override-tostring
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

function tempGeneMaker(seed: number): string {
    let retVal = ""
    let myRand = new SubRandom(seed)
    for (let i = 0; i < 8; i++) {
        let xx = Math.floor(myRand.getR(4))
        switch (xx) {
            case 0:
                retVal += "W"
                break;
            case 1:
                retVal += "E"
                break;
            case 2:
                retVal += "F"
                break;
            case 3:
                retVal += "A"
                break;
        }

    }

    return retVal
}