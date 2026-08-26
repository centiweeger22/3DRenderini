import { CollisionObject } from "./index.js"
import { mat4 } from "./glMatrix/esm/index.js"
export class GameObject{
    constructor(position = [0,0,0],rotation = [0,0,0,1],scale = [1,1,1],model,textures = ["rocketNose"],shaders = ["test0"], attributes = [],collision = new CollisionObject(false)){
        this.position = position
        this.targetPosition = [...position]
        this.oldInterpolatePosition = [...position]
        this.rotation = rotation
        this.targetRotation = [...rotation]
        this.oldInterpolateRotation = [...rotation]      
        this.scale = scale
        this.model = model
        this.textures = textures;
        this.normalMaps = ["defaultNrm"];
        this.shaders = shaders;
        this.attributes = attributes;
        this.depth = true
        this.renderPass = 0
        this.objectReference = null
        this.collision = collision;
        this.render = true
        this.culling = true
        this.Update = ()=>{}
        this.Tick = ()=>{}
        this.alternateTransforms = []
        this.interpolate = false
        this.destroyed = false
        this.castShadow = true
        this.tags = []
        this.skybox = false
        this.depthWrite = true
    }
    hasTag(tag){
        return this.tags.indexOf(tag) != -1
    }
}
export class Transform{
    constructor(position=[0,0,0],rotation = [0,0,0,1], scale = [1,1,1]){
        this.position = position
        this.rotation = rotation
        this.scale = scale
        this.matrix = []
    }
    calculateMatrix(){
        this.matrix = mat4.fromRotationTranslationScale(this.rotation,this.position,this.scale)
    }
}