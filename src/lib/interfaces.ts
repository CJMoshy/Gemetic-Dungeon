import Inventory from "./Inventory"

/**
 * @interface gemdata correct format to make the API call with
 */
export interface gemdata {
    gems: number[]
}

/**
 * @interface sceneData correct object format for exporting data from dungeon to intermission scene
 * @param {Inventory} inv the players inventory
 * @param {string} curGene the current room gene (for genetic algo)
 */
export interface sceneData {
    inv: Inventory,
    curGene: string
}

export interface geneticCodes {
    element1: string,
    element2: string,
    element3: string,
    element4: string,
}