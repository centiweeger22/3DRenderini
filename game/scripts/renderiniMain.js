import * as rini from "../../renderini/index.js"
import {vec3,vec2} from "../../renderini/glMatrix/esm/index.js"

let skybox

let cameraPosition = [-10,10,10]

export function init(){
    skybox = rini.createObject(new rini.GameObject([0,0,0],[0,0,0,1],[-1,-1,1],"skybox",["sky"],["unlit"]))
    skybox.depth = false
    skybox.castShadow = false
    rini.graphics.camera.DOFDepthRange = 100000
    rini.graphics.camera.DOFTargetDepth = 250
    rini.graphics.light.setDirection(vec3.normalize([],[0.5,1,0.5]))
    rini.graphics.setSkyboxTexture("sky")
    // rini.graphics.light.setDirection([1,0,0])

    rini.createObject(new rini.GameObject([0,0,0],[0,0,0,1],[-1,-1,1],"cube",["test"],["unlitShadow"]))
    let buildingObject = rini.createObject(new rini.GameObject([0,-2,5],[0,0,0,1],[2,2,2],"building",["brickTex","white"],["unlitShadow","metal"]))
    // buildingObject.normalMaps = ["brickNrm"]
}
export function update(){
    cameraPosition = [Math.sin(Date.now()/1000)*10,10,10]
    skybox.position = cameraPosition
    rini.graphics.camera.setPosition(cameraPosition)
    rini.graphics.camera.setTarget([0,0,0])
}
export function tick(){

}
