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
    let invList = inventory.split("")
    let currentList = currentCode.split("")

    //tally the most common element from the collected gems
    // let dict = {"W": 0, "E": 0, "F": 0, "A": 0}
    // for(const l of invList){
    //     dict[l] += 1
    // }

    // //add the leading element to the back of inv
    // let maxKey, maxValue = 0;
    // for(const [key, value] of Object.entries(dict)) {
    //     if(value > max) {
    //         maxValue = value;
    //         maxKey = key;
    //     }
    // }
    // invList.append(maxKey)

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
    console.log("Code 1:", invList)
    console.log("Code 2:", currentList)
    let newCode = punnet(invList, currentList, seed)
    return newCode
}

function punnet(code1, code2, seed) {
    let newCode = []
    //iterate through both codes, randomly picking which genes to add to the new code
    for(let i = 0; i < code1.length; i++){
    	newCode.push(picker(code1[i], code2[i]))
    }
    return newCode
}

function picker(code1, code2) {
	var nextCode
    var currentDict
  
    //code indexes
    var waterDict = {"F": "W", "W": "W", "E": "E", "A": null,}
    var earthDict = {"W": "E", "F": null, "E": "E", "A": "A",}
    var airDict = {"W": null, "F": "F", "E": "A", "A": "A",} 
    var fireDict = {"W": "W", "F": "F", "E": null, "A": "F",}
  
    //dictionary picker
    if(code1 == "W") {
        currentDict = waterDict
    }else if (code1 == "E") {
        currentDict = earthDict
    }else if (code1 == "A") {
        currentDict = airDict
    }else if (code1 == "F") {
        currentDict = fireDict
    }
    nextCode = currentDict[code2]
    if(nextCode == null) {
        let rand = (Math.random() * 2)
            if(rand < 1) {
                nextCode = code1
            } else {
                nextCode = code2
            }
    }
    return nextCode
}

class Play extends Phaser.Scene {
    constructor() {
        super('playScene')
    }

    init() {

    }

    create() {
        console.log("scene started")
        var code1 = "WFEAFAEW"
        var code2 = "AWEFAEWE"
        console.log("Code 3:", geneticAlgorithm(code1, code2, 10))
    }

    update() {
        console.log("here")
    }
}
