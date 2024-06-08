//written by CJ Moshy

/**
 * @class Inventory
 */
export default class Inventory {

    active: any
    inventory: Map<string, number> | undefined
    isOpen: boolean

    constructor(existing_inv: Map<string, number> | undefined) {
        this.active = []
        this.inventory = undefined
        existing_inv === undefined ? this.inventory = new Map() : this.inventory = new Map(existing_inv)
        this.isOpen = false
    }
    
    /**
     * 
     * @param {string} item gene string representation to check for in inventory
     * @returns {number} 
     */
    get(item: string): number {
        if (this.inventory.has(item))
            return this.inventory.get(item)
        else {
            return 0
        }
    }

    /**
     * 
     * @param {string} item gene string to add
     * @param {number} ammount ammount to add to inventory
     */
    add(item: string, ammount: number): void {
        if (!this.inventory.has(item)) {
            this.inventory.set(item, ammount)
        } else {
            let x = this.inventory.get(item)
            this.inventory.set(item, x + ammount)
        }
    }

    /**
     * 
     * @param {string} item char to find and remove from inv
     * @param {number} ammount number to remove from corresponding char
     * @returns {boolean}
     */
    remove(item: string, ammount: number): boolean {
        if (this.inventory.has(item)) {
            if (this.get(item) === ammount) {
                this.inventory.delete(item)
            } else if (this.inventory.get(item) >= ammount) {
                this.inventory.set(item, this.inventory.get(item) - ammount)
            }
            return true
        }
        return false
    }  
}