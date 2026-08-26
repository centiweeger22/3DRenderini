import {mat4, vec3, quat,vec4,mat3} from "./glMatrix/esm/index.js";


let objectList;
let modelList;
let modelsFlattened = new Map();
let BVHs = new Map();
let mesh = "aaa"
let bvhHits = 0
let bvhDepth = 20

let vertexStride = 12

export let triangleCount = 0
export let performanceTime = 0
export let InitializeGameObjectList = function(objects){
    objectList = objects
}
export let InitializeModelList = function(models){
    modelList = models
}
export class Raycast{
    constructor(start = [0,0,0],dir = [0,0,1],maxDistance = 0,collisionAmount = Infinity){
        this.startPosition = start;
        this.direction = dir;
        this.maxDistance = maxDistance;
        this.collisionAmount = collisionAmount
    }
}
export class RaycastHit{
    constructor(object = null,hitPoint = [0,0,0],distance = 0,normal = [0,0,0]){
        this.gameObject = object;
        this.hitPoint = hitPoint;
        this.distance = distance;
        this.normal = normal;
    }
}
export class RaycastResult{
    constructor(didHit = false,raycastHits = []){
        this.didHit = didHit;
        this.raycastHits = raycastHits;
    }
}
export class CollisionObject{
    constructor(enabled = true,mesh = ""){
        this.mesh = mesh;
        this.enabled = enabled;
    }
}

export function resetTriangleCount(){
    triangleCount = 0
    performanceTime = 0
}

export function RaycastCheck(raycast){
    // return new RaycastResult();
    let startTime = performance.now()
    let vCount = 0
    let results = new RaycastResult();
    let v1 = vec3.create()
    let v2 = vec3.create()
    let mat3Upper = mat3.create();
    let undoMat = mat4.create();
    let unrotated = vec3.create(); 
    let untransformed = vec3.create();
    let untransformed2 = vec3.create();
    let v00 = vec3.create();
    let v01 = vec3.create();
    let v02 = vec3.create();
    let finalResultPoint = vec3.create();
    let redoMat = mat4.create();
    let rayVec = vec3.create();
    let faceNormal = vec3.create()
    let p1 = vec3.create();
    let p2 = vec3.create();
    let p3 = vec3.create();
    let resultPoint = vec3.create()
    let startPoint = vec3.fromValues(raycast.startPosition[0],raycast.startPosition[1],raycast.startPosition[2]);
    let direction = vec3.create();
    let edge1 = vec3.create();
    let edge2 = vec3.create();
    let p = vec3.create();
    let T = vec3.create();
    let Q = vec3.create();
    let d = 0
    let u = 0
    let v = 0
    let t = 0

    vec3.normalize(direction, raycast.direction);
    outerLoop: for (let i = 0;i<objectList.length;i++){
        if (objectList[i].collision.enabled){
            // console.log(JSON.stringify(objectList[i]))
            if (!modelsFlattened.has(objectList[i].collision.mesh)){
                let mdl = modelList.get(objectList[i].collision.mesh);
                // console.log(mdl+", "+JSON.stringify(objectList[i].collision))
                if (Array.isArray(mdl.submeshes)){
                    let vertices = []
                    for (let g = 0;g<mdl.submeshes.length;g++){
                        vertices.push(...mdl.submeshes[g].vertices)
                    }
                    // console.log(vertices)
                    modelsFlattened.set(objectList[i].collision.mesh,vertices)
                    mesh = objectList[i].collision.mesh
                    let g = createBVH(vertices)
                    // console.log(g)
                    BVHs.set(objectList[i].collision.mesh,g)
                }
            }
            // console.log(objectList[i].collision)
            let vertices = modelsFlattened.get(objectList[i].collision.mesh);
            if (Array.isArray(vertices)){
                // console.log(vertices)
                // alert(mdl[0])
                // let vertices = []
                // for (let g = 0;g<mdl.length;g++){
                //     vertices.push(...mdl[g])
                // }

                if (objectList[i].collision.radius == undefined){
                    // let mdl = modelList.get(mesh);
                    let biggest = 0
                    // alert(mdl)
                    for (let m = 0;m<vertices.length/vertexStride;m++){
                        // alert(vec3.length([vertices[m*8],vertices[m*8+1],vertices[m*8+2]]))
                        if (vec3.length([vertices[m*vertexStride],vertices[m*vertexStride+1],vertices[m*vertexStride+2]]) > biggest){
                            biggest = vec3.length([vertices[m*vertexStride],vertices[m*vertexStride+1],vertices[m*vertexStride+2]])
                        }
                    }
                    objectList[i].collision.radius = biggest+5
                    // alert(biggest)
                }

                // console.log(vertices)
                // alert(raycast.startPosition)
                // alert(objectList[i].position)


                // let localMatrix = mat4.fromRotationTranslationScale([],currentObject.rotation,currentObject.position,currentObject.scale)
                // mat4.invert(localMatrix,localMatrix)

                // let localRay = vec3.transformMat4([],startPoint,localMatrix)
                // let localDirection = vec3.transformMat3([],direction,mat3.fromMat4([],localMatrix))
                let currentObject = objectList[i];
                mat4.fromRotationTranslationScale(undoMat,currentObject.rotation,currentObject.position,currentObject.scale);
                mat4.invert(undoMat,undoMat)

                // let mat3Upper = mat3.create();
                mat3.fromMat4(mat3Upper, undoMat);

                // let unrotated = vec3.create(); 
                vec3.transformMat3(unrotated, direction, mat3Upper);
                vec3.normalize(unrotated,unrotated);

                
                // let untransformed = vec3.create();
                vec3.transformMat4(untransformed,startPoint,undoMat);
                vec3.transformMat4(untransformed2,raycast.startPosition,undoMat);
                // if (vec3.length(untransformed2) > objectList[i].collision.radius){
                //     // alert("continuing")
                //     continue
                // }

                let currentBVH = BVHs.get(objectList[i].collision.mesh)

                bvhHits = 0
                let indices = BVHCheck(currentBVH,untransformed,unrotated)

                triangleCount += indices.length
                // console.log(indices.length,bvhHits)

                // console.log(vertices)
                for (let f = 0;f<indices.length;f+=1){
                    let index = indices[f]*vertexStride*3
                    // console.log(f)
                    vCount ++
                                        //x y z n n n t t x y z n n n t t x y z n n n t t
                    //0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 2 2 2 2
                    //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
                    //set up the points

                    p1[0] = vertices[index];
                    p1[1] = vertices[index+1];
                    p1[2] = vertices[index+2];

                    p2[0] = vertices[index+vertexStride];
                    p2[1] = vertices[index+vertexStride+1];
                    p2[2] = vertices[index+vertexStride+2];

                    p3[0] = vertices[index+vertexStride*2];
                    p3[1] = vertices[index+vertexStride*2+1];
                    p3[2] = vertices[index+vertexStride*2+2];

                    vec3.sub(edge1,p2,p1)
                    vec3.sub(edge2,p3,p1)

                    vec3.cross(p,unrotated,edge2)
                    d = vec3.dot(p,edge1)

                    vec3.sub(T,untransformed,p1)
                    u = vec3.dot(T,p)/d

                    vec3.cross(Q,T,edge1)
                    v = vec3.dot(unrotated,Q) / d

                    t = vec3.dot(edge2,Q) / d

                    // console.log(u,v)
                    let dist
                    let hit = u >= 0 && u <= 1 && v >= 0 && u + v <= 1 && d != 0 && t > 0 //&& vec3.dot(faceNormal,direction)<0;
                    if (hit){

                        let resultPoint = vec3.add([],untransformed,vec3.scale([],unrotated,t))
                        mat4.invert(redoMat,undoMat)
                        vec3.transformMat4(finalResultPoint,resultPoint,redoMat)
                        // let rayVec = vec3.create();
                        vec3.sub(rayVec,finalResultPoint,startPoint);

                        dist = vec3.dist(startPoint,finalResultPoint)
                        hit = hit && vec3.dot(rayVec, direction) > 0 && dist < raycast.maxDistance
                    }
                    if (hit){
                        vec3.cross(faceNormal,vec3.sub([0,0,0],p1,p2),vec3.sub([0,0,0],p3,p2))
                        // console.log(faceNormal)
                        vec3.normalize(faceNormal,faceNormal)
                        faceNormal[1] *= -1
                        // if (vec3.dot(faceNormal,direction)>0){
                        //     continue
                        // }
                        // let faceNormal = vec3.create()

                        // console.log("eeeeee")
                        results.didHit = true;
                        let newHit = new RaycastHit(objectList[i],finalResultPoint,dist,faceNormal);
                        results.raycastHits.push(newHit);
                        if (results.raycastHits.length >= raycast.collisionAmount){
                            break outerLoop
                        }
                    }
                }
            }
        }
    }
    // console.log(vCount)
    if (results.raycastHits > 1){
    results.raycastHits.sort((a,b) => a.distance - b.distance)
    }
    performanceTime += performance.now()-startTime
    return results;
}

function createBVH(vertices,indices,depth = 0){
    if (indices == undefined){
        indices = []
        for (let f = 0;f<vertices.length;f+=3*vertexStride){
            indices.push(f/(3*vertexStride))
        }
    }
    if (depth > bvhDepth){
        return
    }
    // if (indices.length < 50){
    //     return
    // }
    if (indices.length == 0){
        return
    }
    let currentBVH = {children:[]}
    let max = [-Infinity,-Infinity,-Infinity]
    let min = [Infinity,Infinity,Infinity]
    // for (let f = 0;f<vertices.length;f+=3*8){
    for (let f = 0;f<indices.length;f++){
        // console.log(f)
                            //x y z n n n t t x y z n n n t t x y z n n n t t
        //0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 1 1 2 2 2 2
        //0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
        //set up the points
        for (let i = 0;i<3;i++){
            for (let d = 0;d<3;d++){
                let v = vertices[(indices[f]*3+i)*vertexStride+d]
                if (v > max[d]) max[d] = v
                if (v < min[d]) min[d] = v
            }
        }



        // p1[0] = vertices[f];
        // p1[1] = vertices[f+1];
        // p1[2] = vertices[f+2];

        // p2[0] = vertices[f+8];
        // p2[1] = vertices[f+9];
        // p2[2] = vertices[f+10];

        // p3[0] = vertices[f+16];
        // p3[1] = vertices[f+17];
        // p3[2] = vertices[f+18];
    }
    let largestAxisSize = Math.max(max[0]-min[0],max[1]-min[1],max[2]-min[2])
    let largestAxis = 0
    if (largestAxisSize == max[1]-min[1]) largestAxis = 1
    if (largestAxisSize == max[2]-min[2]) largestAxis = 2

    let divisionLine = (max[largestAxis] + min[largestAxis]) / 2

    let bins = [[],[]]

    for (let f = 0;f<indices.length;f++){
        let p1 = []
        let p2 = []
        let p3 = []


        let index = indices[f]*3*vertexStride
        p1[0] = vertices[index];
        p1[1] = vertices[index+1];
        p1[2] = vertices[index+2];

        p2[0] = vertices[index+vertexStride];
        p2[1] = vertices[index+vertexStride+1];
        p2[2] = vertices[index+vertexStride+2];

        p3[0] = vertices[index+vertexStride*2];
        p3[1] = vertices[index+vertexStride*2+1];
        p3[2] = vertices[index+vertexStride*2+2];

        // pa = [
        //     (p1[0]+p2[0]+p3[0])/3,
        //     (p1[1]+p2[1]+p3[1])/3,
        //     (p1[2]+p2[2]+p3[2])/3
        // ]
        let pd = (p1[largestAxis]+p2[largestAxis]+p3[largestAxis])/3

        if (pd > divisionLine){
            bins[0].push(indices[f])
        }
        else{
            bins[1].push(indices[f])
        }
    }

    for (let i = 0;i<2;i++){
        let g = createBVH(vertices,bins[i],depth+1)
        if (g != undefined) currentBVH.children.push(g)
        else currentBVH.vertices = [...bins[0],...bins[1]]
    }

    currentBVH.min = min
    currentBVH.max = max

    // console.log(mesh,depth,currentBVH)
    return currentBVH

}

function testAABB(min,max,origin,direction){
    let tEnter = []
    let tExit = []

    for (let i = 0;i<3;i++){
        let enter = (min[i]-origin[i])/direction[i]
        let exit = (max[i]-origin[i])/direction[i]
        if (direction[i] < 0)
        {
            let g = exit
            exit = enter
            enter = g
        }
        tEnter[i] = enter
        tExit[i] = exit
    }

    let tEnterFinal = Math.max(tEnter[0],tEnter[1],tEnter[2])
    let tExitFinal = Math.min(tExit[0],tExit[1],tExit[2])

    if (tExitFinal < 0 || tExitFinal < tEnterFinal) return false
    return true
}

function BVHCheck(bvh, origin, direction){
    let vertices = []
    let stack = [bvh]
    while (stack.length > 0){
        // console.log("a")
        let a = stack.shift()
        if (testAABB(a.min,a.max,origin,direction)){
            // console.log("b")
            if (a.children.length > 0){
                for (let i = 0;i<a.children.length;i++){
                    stack.push(a.children[i])
                }
            }
            else{
                vertices.push(...a.vertices)
                bvhHits++
            }
        }
    }
    // console.log("goog")
    return vertices
}