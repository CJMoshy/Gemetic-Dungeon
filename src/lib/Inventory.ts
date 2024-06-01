export default class Inventory{}
// export default class Inventory{

//     active: any
//     inventory: Map<any | Phaser.GameObjects.Sprite, number> | undefined
//     isOpen: boolean

//     constructor(existing_inv: Map<any | Phaser.GameObjects.Sprite, number>){
//         this.active = []
//         this.inventory = undefined
//         existing_inv === undefined ? this.inventory = new Map() : this.inventory = new Map(existing_inv)
//         this.isOpen = false
//     }

//     get(item){
//         if(this.inventory.has(item))
//             return this.inventory.get(item)
//         else{
//             return false
//         }
//     }

//     add(item, ammount){
//         if(!this.inventory.has(item)){
//             this.inventory.set(item, ammount)
//             return true
//         } else {
//             let x = this.inventory.get(item)
//             this.inventory.set(item, x+ammount)
//         }
//         return false
//     }

//     remove(item, ammount){
//         if(this.inventory.has(item)){
//             if(this.get(item) === ammount){
//                 this.inventory.delete(item)
//             }else if (this.get(item) >= ammount){
//                 this.inventory.set(item, this.get(item) - ammount)
//             }
//             return true
//         }
//         return false
//     }

//     openInventoryWindow(scene, player){
//         this.isOpen = true
//         const window = scene.add.graphics().setDepth(2)
//         window.fillStyle(0x000000, 1) // Color and alpha (transparency)

//         let windowX = scene.cameras.main.scrollX + scene.cameras.main.width/4
//         let windowY = scene.cameras.main.scrollY + scene.cameras.main.height/4
//         window.fillRect(windowX , windowY, 450, 300)

//         let closeBTN, winname
//         closeBTN = scene.add.bitmapText(windowX + 5, windowY + 5, '8-bit-white', 'exit', 24)
//         closeBTN.setInteractive().setDepth(2)   
//         closeBTN.on('pointerdown', () => {
//             toggleCursor(scene)
//             this.active.forEach(element =>{element.destroy()})
//             window.destroy()
//             closeBTN.destroy()
//             winname.destroy()
//             scene.p1.windowOpen = false
//             this.windowOpen = false
//             scene.p1.animsFSM.transition('idle')
//         })
  
//         winname = scene.add.bitmapText(windowX + 225, windowY+ 10, '8-bit-white', 'Inventory', 24).setOrigin(0.5, 0).setDepth(2)
    
//         let counter = 0 //if 5 then increase y pos
//         let beginX = windowX + 64
//         let beginY = windowY + 64

//         for(const [key, value] of this.inventory){
//            this.active.push(scene.add.image(beginX, beginY, key).setDepth(2).setInteractive().on('pointerdown', ()=>{
//                 toggleCursor(scene)
//            }))
//            this.active.push( scene.add.bitmapText(beginX, beginY-32, '8-bit-white', value, 16).setDepth(2))
//            this.active.push( scene.add.bitmapText(beginX-15, beginY+32, '8-bit-white', key,13).setDepth(2))
//             if(counter === 2){
//                 counter = 0
//                 beginY += 128
//                 beginX = windowX + 64
//             } else{
//                 counter++
//                 beginX += 128
//             }
//         }

//         let winAr = [window, closeBTN, winname, this.active] //const lol

//         scene.miniMapCamera.ignore(winAr)

//         winAr = [window, closeBTN, winname]

//         player.currentWindow.objs = winAr
//         player.currentWindow.array = this.active
//     }
    
// }