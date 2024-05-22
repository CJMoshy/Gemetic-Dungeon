//Genetic Algorithm File
//Assumptions:
    //The genetic algorithm recieves a dictionary array of the player inventory, in the form:
    //{"water": 0, "fire": 0, "earth": 0, "air": 0}
    //along with the the current game states genetic code
    //the genetic alorithm will then yield a new code, referencing a particular style of room
        //codes will be two letters, indicating the two alleles for each trait
        //Water: w
        //Fire: f
        //earth: e
        //air: a
        //example code: "Ef" - Earth Dominant, fire recessive
    //rooms take the form of the dominant gene, if there are two co-dominant genes, its a fifty-fifty.

//exported functions:
    //geneticAlgorithm(current inventory, current room genetic code)
        //returns new code

function geneticAlgorithm(inventory, code) {
    //get the total number of gems
    let total = (inventory["water"] + inventory["fire"] + inventory["earth"] + inventory["air"])
    //initilize the array to store codes
    let punnetArray = []
    //determine the per
    let w = Math.round(total / inventory["water"]) * 10
    let f = Math.round(total / inventory["fire"]) * 10
    let e = Math.round(total / inventory["earth"]) * 10
    let a = Math.round(total / inventory["air"]) * 10
    for(let i = 0; i < w; i++){
        punnetArray.append("w")
    }
    for(let i = 0; i < f; i++){
        punnetArray.append("f")
    }
    for(let i = 0; i < e; i++){
        punnetArray.append("e")
    }
    for(let i = 0; i < a; i++){
        punnetArray.append("a")
    }

}