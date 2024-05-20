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
    currentRoom:Room;
    skewW = 0; //the skew TOWARDS water-type rooms
    skewF = 0; // towards fire rooms
    skewE = 0; // towards earth rooms
    skewA = 0; //towards air rooms
    seedInput = document.getElementById("playerSeedEntry");
    initialPlayerSeedString:string;
    seed:number;
    constructor(){
        this.initialPlayerSeedString = this.seedInput ? this.seedInput.innerText : "defaultSeed"
        this.seed = XXH.h32(this.initialPlayerSeedString, 0)
        this.currentRoom = new Room(this.seed, this.skewW, this.skewF, this.skewE, this.skewA);
        console.log("good afternoon!")
    }
}

export class Room {
    myRandom:SubRandom;
    constructor(tier:number, skewW:number, skewF:number, skewE:number, skewA:number){
        this.myRandom = new SubRandom(tier)
    }
}

class SubRandom{ //this class exists so we can control and manipulate different instances of generators at the same time.
    seed=0;
    constructor(_seed:number){
        this.seed = _seed;
        if(this.seed === 0 || this.seed == undefined){this.seed = Math.random()}
    }
    getR(){
        this.seed^= this.seed << 19
        this.seed^= this.seed >> 7
        this.seed^= this.seed << 5
        return 
    }
    setSeed(_s:number){
        this.seed = _s
    }

}