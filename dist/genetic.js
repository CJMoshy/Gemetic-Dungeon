//Genetic Algorithm File
//Assumptions:
    //The genetic algorithm recieves two codes, of the form "WEAFEWAFW"
    //one is 7 letters, constructed from the players inventory
    //the other is the current game states genetic code
    //the genetic alorithm will then yield a new code, referencing a particular style of room
        //codes will be 8 letters, indicating the alleles for each trait
        //Water: w
        //Fire: f
        //earth: e
        //air: a
        //example code: "EEFWAEFE" - Earth Dominant

//exported functions:
    //geneticAlgorithm(current inventory, current room genetic code, random seed)
        //returns new code

function geneticAlgorithm(inventory, currentCode, seed) {
    //store variables
    let invList = inventory.split()
    let currentList = currentCode.split()

    //tally the most common element from the collected gems
    let dict = {"W": 0, "E": 0, "F": 0, "A": 0}
    for(const l of invList){
        dict[l] += 1
    }

    //add the leading element to the back of inv
    let maxKey, maxValue = 0;
    for(const [key, value] of Object.entries(dict)) {
        if(value > max) {
            maxValue = value;
            maxKey = key;
        }
    }
    invList.append(maxKey)

    //replace the current room gene's elements with the forced variation pattern
    //water -> earth -> fire -> air -> water
    for(let l = 0; l < currentList.length; l++){
        if(currentList[l] == "W") {
            currentList[l] = "E"
        } else if(currentList[l] == "E") {
            currentList[l] = "F"
        } else if(currentList[l] == "F") {
            currentList[l] = "A"
        } else if(currentList[l] == "A") {
            currentList[l] = "W"
        }
    }
    let newCode = punnet(inv, current, seed)
    return newCode
}

function punnet(code1, code2, seed) {
    let newCode = []
    //iterate through both codes, randomly picking which genes to add to the new code
    for(let i = 0; i < code1.length; i++){
        let rand = (Math.random() * 2)
        if(rand < 1) {
            newCode.append(code1[i])
        } else {
            newCode.append(code2[i])
        }
    }
    return newCode
}
