// import { access } from "fs";
import { vec3, vec2 } from "./glMatrix/esm/index.js"


let glTFAccessorTypes = {
    "SCALAR":1,
    "VEC2":2,
    "VEC3":3,
    "VEC4":4,
    "MAT2":4,
    "MAT3":9,
    "MAT4":16
}

let gltfComponentSizes = {
    "5120":1,
    "5121":1,
    "5122":2,
    "5123":2,
    "5124":4,
    "5125":4,
    "5126":4,
}

console.log("Hello Importer!")
export async function LoadObj(name,gl){
    try{
    // console.log("Hello Importer!")
    let modelPromise
    let modelSrc
    if (gl == undefined){
        let fs = await import("fs");
        modelSrc = fs.readFileSync("./game/resources/models/"+name+".obj", "utf-8")
    }
    else{
        modelPromise = await fetch("./game/resources/models/"+name+".obj")
        modelSrc = await modelPromise.text();
    }
    // alert(modelSrc)

    let vertices = []
    let normals = []
    let texturePositions = []
    let model = [[]]
    let modelSplit = modelSrc.split("\n");
    for (let i = 0;i<modelSplit.length;i++){
        // console.log(modelSplit[i])
        let modelComponent = modelSplit[i].split(" ");
        switch (modelComponent[0]){
            case "#":
                // console.log(modelComponent)
                break;
            case "v":
                vertices.push([modelComponent[1],modelComponent[2],modelComponent[3]])
                break;
            case "vn":
                normals.push([modelComponent[1],modelComponent[2],modelComponent[3]])
                break;
            case "vt":
                texturePositions.push([modelComponent[1],modelComponent[2]])
                break;
            case "f":
                // console.log(modelComponent+"AAA")
                for (let j = 1;j<=3;j++){
                    // console.log(modelComponent[0])
                    let currentVertex = modelComponent[j].split("/")
                    // console.log(modelComponent[j]+"A")
                    // model.concat(vertices[Number(currentVertex[1])])
                    // console.log(vertices[Number(currentVertex[1])]+"GHGHHGH")
                    // model.concat()
                    // model.concat()
                    // console.log(currentVertex[3])

                    // console.log(texturePositions[Number(currentVertex[2])])
                    // console.log(normals[Number(currentVertex[3])])
                    // console.log(vertices
                    let position = vertices[Number(currentVertex[0])-1]
                    // model.push("pos")
                    let uv = texturePositions[Number(currentVertex[1])-1]
                    // uv[0] = 1-Number(uv[0])
                    // alert("before"+uv[0])
                    // uv[0] += 0.1
                    // console.og(uv[0])
                    // alert("after"+uv[0])
                    // alert(uv)
                    // model.push("uv"
                    let normal = normals[Number(currentVertex[2])-1]
                    if (Number(currentVertex[2]) == 7){
                        // console.log("a"+normal)
                    }
                    // model.push("vert")
                    let v = [...position,...normal]
                    for (let g = 0;g<v.length;g++){
                        model[model.length-1].push(Number(v[g])) 
                    }
                    v = [...uv,0,0,0,0]
                    // for (let g = 0;g<v.length;g++){
                    // console.log(model[model.length-1])
                    for (let g = 0;g<v.length;g++){
                        model[model.length-1].push(Number(v[g])) 
                    }
                    // }
                    // console.log(model);
                    // console.lo(currentVertex[1]
                }
                break;
            case "usemtl":
                if (model[model.length-1].length > 0){
                model.push([])}
                break;
            } 
    }
    // console.log("Success building model: '"+name+"'!");
    // console.log(model)
    // console.log(model)

    if (gl == undefined){
        // console.log("gug")
        gl = {createBuffer:()=>{},bindBuffer:()=>{},bufferData:()=>{},ARRAY_BUFFER:0,fake:true}
    }

    let wholeModel = {"submeshes":[]}
    for (let i = 0;i<model.length;i++){
        let mdlSegment = {}
        let buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER,buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model[i]), gl.STATIC_DRAW);
        mdlSegment.buffer = buf
        mdlSegment.vertices = model[i]
        mdlSegment.skinning = false
        wholeModel.submeshes.push(mdlSegment)
    }

    // console.log(wholeModel)

    return wholeModel;
    }
    catch(err){
        if (gl == undefined || gl.fake){
            console.log(err.stack+name)
        }
        else{
            alert(err.stack+name)
        }
    }
}
export async function LoadGLB(name,gl){
    let modelPromise
    let modelSrc
    if (gl == undefined){
        let fs = await import("fs");
        modelSrc = fs.readFileSync("./game/resources/models/"+name+".glb")
    }
    else{
        modelPromise = await fetch("./game/resources/models/"+name+".glb")
        modelSrc = await modelPromise.bytes();
    }
    // console.log(modelSrc)
    // console.log(modelSrc)
    // console.log(String.fromCharCode(...modelSrc.slice(0,4)))
    if (String.fromCharCode(...modelSrc.slice(0,4)) != "glTF") {console.log("this aint a gltf");return}
    let fileSize = getu32(modelSrc,8,true)
    // console.log(fileSize+", "+modelSrc.length)
    if (fileSize != modelSrc.length){alert("file size incorrect");return}
    let filePointer = 0x0c
    let fileJSON
    let fileBIN
    let skinning = false
    while (filePointer < fileSize){
        // console.log(filePointer.toString(16))
        let currentFileSegmentSize = getu32(modelSrc,filePointer,true)
        let currentFileSegmentType = String.fromCharCode(...modelSrc.slice(filePointer+4,filePointer+8))
        // console.log(currentFileSegmentType)
        switch (currentFileSegmentType){
            case "JSON":
                // console.log("its json")
                let jsonText = String.fromCharCode(...modelSrc.slice(filePointer+8,filePointer+8+currentFileSegmentSize))
                fileJSON = JSON.parse(jsonText)
                break;
            case "BIN\0":
                fileBIN = modelSrc.slice(filePointer+8,filePointer+8+currentFileSegmentSize)
                break;
        }
        filePointer += 8 + currentFileSegmentSize
    }
    // console.log(fileJSON.meshes[0])
    let buffers = []
    buffers.push(fileBIN)

    let bufferViews = []
    for (let i = 0;i<fileJSON.bufferViews.length;i++){
        let currentBufferView = fileJSON.bufferViews[i]
        bufferViews.push(
            buffers[currentBufferView.buffer].slice(
                currentBufferView.byteOffset,
                currentBufferView.byteOffset+currentBufferView.byteLength))
    }
    // console.log(JSON.stringify(bufferViews))

    let accessors = []
    for (let i = 0;i<fileJSON.accessors.length;i++){
        let currentAccessor = []
        let valueOffset = 0
        if (Object.hasOwn(fileJSON.accessors[i],"byteOffset")){
            valueOffset = fileJSON.accessors[i].byteOffset
        }
        let valueCount = glTFAccessorTypes[fileJSON.accessors[i].type]
        let valueType = fileJSON.accessors[i].componentType
        let valueSize = gltfComponentSizes[valueType.toString()]
        let bufferView = bufferViews[fileJSON.accessors[i].bufferView]
        for (let d = 0;d<fileJSON.accessors[i].count;d++){
            let currentValue = []
            for (let j = 0;j<valueCount;j++){
                let value
                let currentOffset = (j+d*valueCount)*valueSize+valueOffset
                switch (valueType){
                    case 5120:
                        value = bufferView[currentOffset] 
                        value -= (value & 0b01111111) * 128
                        break;
                    case 5121:
                        value = bufferView[currentOffset] 
                        break;
                    case 5122:
                        value = bufferView[currentOffset]+bufferView[currentOffset+1]*256
                        value -= (value & 0x7FFF) * 32768
                        break;
                    case 5123:
                        value = bufferView[currentOffset]+bufferView[currentOffset+1]*256
                        break;
                    case 5124:
                        value = bufferView[currentOffset]+bufferView[currentOffset+1]*256+bufferView[currentOffset+2]*(2**16)+bufferView[currentOffset+3]*(2**24)
                        value -= ((num >> 31) & 1) * (2**31)
                        break;
                    case 5125:
                        value = bufferView[currentOffset]+bufferView[currentOffset+1]*256+bufferView[currentOffset+2]*(2**16)+bufferView[currentOffset+3]*(2**24)
                        break;
                    case 5126:
                        // console.log(bufferView)
                        let slice = bufferView.slice(currentOffset,currentOffset+4)
                        value = new Float32Array(slice.buffer,slice.byteOffset,1)[0]
                        // console.log(value)
                        // value = 99
                        break;
                }
                currentValue.push(value)
            }
            if (currentValue.length == 1) currentValue = currentValue[0]
            currentAccessor.push(currentValue)
        }
        accessors.push(currentAccessor)
    }

    // console.log(JSON.stringify(accessors))

    let primitives = []

    let meshes = fileJSON.meshes

    for (let i = 0;i<meshes.length;i++){
        for (let d = 0;d<meshes[i].primitives.length;d++){
            if (Object.hasOwn(meshes[i].primitives[d].attributes,"JOINTS_0")){
                skinning = true
            }
        }
    }

    for (let i = 0;i<meshes.length;i++){
        for (let d = 0;d<meshes[i].primitives.length;d++){
            let currentPrimitive = []
            let indexBuffer = accessors[meshes[i].primitives[d].indices]
            let positionBuffer = accessors[meshes[i].primitives[d].attributes.POSITION]
            let normalBuffer = accessors[meshes[i].primitives[d].attributes.NORMAL]
            let textureBuffer = accessors[meshes[i].primitives[d].attributes.TEXCOORD_0]

            let jointsBuffer = []
            let weightsBuffer = []
            if (skinning){
                jointsBuffer = accessors[meshes[i].primitives[d].attributes.JOINTS_0]
                weightsBuffer = accessors[meshes[i].primitives[d].attributes.WEIGHTS_0]
            }
            let currentVertices = []
            for (let j = 0;j<indexBuffer.length;j++){
                while (currentVertices.length < indexBuffer[j]+1){
                    currentVertices.push(null)
                }
                let currentVertex = new Vertex(positionBuffer[indexBuffer[j]],textureBuffer[indexBuffer[j]],normalBuffer[indexBuffer[j]])
                currentVertices[indexBuffer[j]] = currentVertex
                if (!skinning) continue
                currentVertex.joints = jointsBuffer[indexBuffer[j]]
                currentVertex.weights = weightsBuffer[indexBuffer[j]]
                // console.log(jointsBuffer)
                // currentPrimitive.push(...jointsBuffer[indexBuffer[j]])
                // currentPrimitive.push(...weightsBuffer[indexBuffer[j]])
            }

            for (let j = 0;j<indexBuffer.length;j+=3){
                let p0 = currentVertices[indexBuffer[j]]
                let p1 = currentVertices[indexBuffer[j+1]]
                let p2 = currentVertices[indexBuffer[j+2]]
                let edge1 = vec3.sub([],p1.position,p0.position)
                let edge2 = vec3.sub([],p2.position,p0.position)
                let duv1 = vec2.sub([],p1.uv,p0.uv)
                let duv2 = vec2.sub([],p2.uv,p0.uv)
                let f = 1 / (duv1[0] * duv2[1] - duv2[0] * duv1[1])
                let tangent = vec3.scale([],
                    vec3.sub(
                        [],
                        vec3.scale([],edge1,duv2[1]),
                        vec3.scale([],edge2,duv1[1])
                    )
                ,f)

                let bitangent = vec3.scale([],
                    vec3.add(
                        [],
                        vec3.scale([],edge1,duv2[0]),
                        vec3.scale([],edge2,duv1[0])
                    )
                ,f)

                p0.tangents.push(tangent)
                p1.tangents.push(tangent)
                p2.tangents.push(tangent)
                p0.bitangents.push(tangent)
                p1.bitangents.push(tangent)
                p2.bitangents.push(tangent)
            }

            for (let currentVertex of currentVertices){
                let tTotal = [0,0,0]
                for (let v of currentVertex.tangents){vec3.add(tTotal,tTotal,v)}
                vec3.scale(tTotal,tTotal, 1 / currentVertex.tangents.length)

                let bTotal = [0,0,0]
                for (let v of currentVertex.tangents){vec3.add(bTotal,bTotal,v)}
                vec3.scale(bTotal,bTotal, 1 / currentVertex.tangents.length)

                let w = 1
                let cross = vec3.cross([],currentVertex.normal,tTotal)
                if (vec3.dot(cross,bTotal) < 0){
                    w = -1
                }

                currentVertex.tangent = [...tTotal,w]
            }

            for (let j = 0;j<indexBuffer.length;j++){
                currentPrimitive.push(...currentVertices[indexBuffer[j]].toData())
                if (!skinning) continue
            }
            // console.log(currentPrimitive)
            primitives.push(currentPrimitive)
        }
    }

    let skeleton
    if (skinning){
        let skins = fileJSON.skins
        for (let i = 0;i<skins.length;i++){
            let currentSkin = skins[i]
            let currentSkeleton = {bones:[]}
            let matrices = accessors[currentSkin.inverseBindMatrices]
            currentSkeleton.inverseBindMatrices = matrices
            for (let d = 0;d<currentSkin.joints.length;d++){
                let currentNode = fileJSON.nodes[currentSkin.joints[d]]
                currentNode.inverseBindMatrix = matrices[d]
                currentSkeleton.bones.push(currentNode)
                if (!Object.hasOwn(currentNode,"children")){
                    currentNode.children = []
                }
                for (let j = 0;j<currentNode.children.length;j++){
                    let currentNode2 = fileJSON.nodes[currentNode.children[j]]
                    if (!Object.hasOwn(currentNode2,"parents")){
                        currentNode2.parents = [d]
                    }
                    currentNode.children[j] = currentSkin.joints.indexOf(currentNode.children[j])
                    currentNode2.parents.push()
                }
            }
            skeleton = currentSkeleton
        }
    }

    if (gl == undefined){
        gl = {createBuffer:()=>{},bindBuffer:()=>{},bufferData:()=>{},ARRAY_BUFFER:0}
    }
    let wholeModel = {"submeshes":[]}
    for (let i = 0;i<primitives.length;i++){
        let mdlSegment = {}
        let buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER,buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(primitives[i]), gl.STATIC_DRAW);
        mdlSegment.buffer = buf
        mdlSegment.vertices = primitives[i]
        mdlSegment.skinning = skinning
        wholeModel.submeshes.push(mdlSegment)
    }
    wholeModel.skeleton = skeleton
    wholeModel.skinning = skinning

    // console.log("success building model "+name+"! skinning: "+skinning)
    // console.log(name)
    // console.log(wholeModel.submeshes[0].vertices)

    return wholeModel;
}
function getu32(bytes,i,littleEndian){
    let exponents = [24,16,8,0]
    if (littleEndian){exponents.reverse()}
    return bytes[i]*(2**exponents[0])+bytes[i+1]*(2**exponents[1])+bytes[i+2]*(2**exponents[2])+bytes[i+3]*(2**exponents[3])
}

function reverseSignificantBits(n) {
  const binaryStr = n.toString(2); // Convert to binary string
  const reversedStr = binaryStr.split('').reverse().join(''); // Reverse characters
  return parseInt(reversedStr, 2); // Parse back to decimal
}
class Vertex{
    constructor(position,uv,normal,tangent,joints,weights){
        this.position = position
        this.uv = uv
        this.normal = normal
        this.tangent = tangent
        this.joints = joints
        this.weights = weights
        this.tangents = []
        this.bitangents = []
    }
    toData(){
        let dataArray = [...this.position,...this.normal,...this.uv,...this.tangent]
        if (this.joints != undefined){
            dataArray.push(...this.joints)
            dataArray.push(...this.weights)
        }
        return dataArray
    }
}