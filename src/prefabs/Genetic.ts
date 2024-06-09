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


type referenceTuple = [string, string]

export default function geneticAlgorithm(inventory: string, currentCode: string, seed: any) {
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
    for (let l = 0; l < currentList.length; l++) {
        if (currentList[l] == "W") {
            currentList[l] = "E"
        } else if (currentList[l] == "E") {
            currentList[l] = "F"
        } else if (currentList[l] == "F") {
            currentList[l] = "A"
        } else if (currentList[l] == "A") {
            currentList[l] = "W"
        }
    }
    let newCode = punnet(invList, currentList, seed)
    let nc: string = newCode.toString()
    return nc
}

function punnet(code1: string | any[], code2: any[], seed: any) {
    let newCode = []
    //iterate through both codes, randomly picking which genes to add to the new code
    for (let i = 0; i < code1.length; i++) {
        newCode.push(picker(code1[i], code2[i]))
    }
    return newCode
}

function picker(code1: string, code2: string) {
    var nextCode: string
    var currentDict: referenceTuple[]
    var codeIndex: integer


    //code indexes
    var waterDict: referenceTuple[] = [["F", "W"], ["W", "W"], ["E", "E"], ["A", "-"]]
    var earthDict: referenceTuple[] = [["W", "E"], ["F", "-"], ["E", "E"], ["A", "A"]]
    var airDict: referenceTuple[] = [["W", "-"], ["F", "F"], ["E", "A"], ["A", "A"]]
    var fireDict: referenceTuple[] = [["W", "W"], ["F", "F"], ["E", "-"], ["A", "F"]]

    //dictionary picker
    if (code1 == "W") {
        currentDict = waterDict
    } else if (code1 == "E") {
        currentDict = earthDict
    } else if (code1 == "A") {
        currentDict = airDict
    } else if (code1 == "F") {
        currentDict = fireDict
    }

    if (code2 == "W") {
        codeIndex = 0
    } else if (code2 == "F") {
        codeIndex = 1
    } else if (code2 == "E") {
        codeIndex = 2
    } else if (code2 == "A") {
        codeIndex = 3
    }
    nextCode = currentDict[codeIndex][1]
    if (nextCode == "-") {
        let rand = (Math.random() * 2)
        if (rand < 1) {
            nextCode = code1
        } else {
            nextCode = code2
        }
    }
    return nextCode
}

