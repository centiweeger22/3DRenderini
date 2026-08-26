
// /** @type {WebGL2RenderingContext} */
import { mat4, vec3, quat } from "./glMatrix/esm/index.js";
import * as game from "../game/scripts/renderiniMain.js";
import * as importer from "./importer.js"
import * as physics from "./physics.js"
// import * as client from "./networking/client.js"
import * as assets from "./assets.js"
import * as rendering from "./rendering.js"
import { GameObject, Transform } from "./gameObject.js";

export * as assets from "./assets.js" 
//server stuff
let fs;
export let engineMode = "client"
if (typeof window === "undefined") { //runs in node js only (so enable server)
    engineMode = "server"
    fs = await import("fs");
}

export let time = {
    "timeScale":1,
    "time":0,
    "now":0,
    "setTimeScale":(value)=>{time.timeScale = value},
    "maxDeltaTime":1/30,
    "tickRate":20,
    "tickProgress":0,
    "deltaTime":0.001,
    "realDeltaTime":0.001,
    "lastTickTime":performance.now(),
    "lastFrameTime":performance.now(),
    "fps":0,

    "targetFrameRate":1000,
    "targetTickRate":20,
    setTargetFrameRate(target){
        this.targetFrameRate = target
    },
    setTargetTickRate(target){
        this.targetTickRate = target
    },

    "updateInterval":null,
    setFps(value) {
        clearInterval(this.updateInterval)
        this.updateInterval = setInterval(update, 1000 / value)
    }
}

export let resources = {
    "models":new Map(),
    "textures":new Map(),
    "shaders":new Map(),
    "shaderList":[]
}

export let graphics = {
    //values
    "canvas":null,
    "viewMatrix":mat4.create(),
    "perspectiveMatrix":mat4.create(),
    "camera":
    {
        "fov":1,
        "position":[0,0,0],
        "target":[1,0,0],
        "upVector":[0,1,0],
        "mode":1,
        "aspect":1,
        "near":0.1,
        "far":2000,
        "DOFTargetDepth":10,
        "DOFDepthRange":100,
        "DOFMaxLevel":3,

        "viewMatrix":[],
        "projectionMatrix":[],

        setPosition(position){this.position = position},
        setTarget(position){this.target = position},
        setMode(mode){this.mode = mode},
        updateCamera(){
            this.aspect = graphics.canvas.width / graphics.canvas.height
            mat4.lookAt(this.viewMatrix,this.position,this.target,this.upVector)
            mat4.perspective(this.projectionMatrix,this.fov,this.aspect,this.near,this.far)
            let t = 40
            // mat4.ortho(this.projectionMatrix,-t*this.aspect,t*this.aspect,-t,t,this.near,this.far)
            
            let shadowWorldSize = graphics.shadows.cascades[0].worldSize
            let ratio = 2*shadowWorldSize/graphics.shadows.resolution

            let worldPosition = vec3.add([],this.position,vec3.scale([],graphics.light.direction,graphics.shadows.cameraOffset))
            worldPosition = [Math.floor(worldPosition[0]/ratio)*ratio,
                            Math.floor(worldPosition[1]/ratio)*ratio,
                            Math.floor(worldPosition[2]/ratio)*ratio]
            let worldTarget = vec3.sub([],worldPosition,vec3.scale([],graphics.light.direction,graphics.shadows.cameraOffset))
            
            mat4.ortho(graphics.shadows.cascades[0].projectionMatrix,-shadowWorldSize,shadowWorldSize,-shadowWorldSize,shadowWorldSize,1,2000)
            mat4.lookAt(graphics.shadows.cascades[0].viewMatrix,worldPosition,worldTarget,[1,0,0])

            shadowWorldSize = graphics.shadows.cascades[1].worldSize
            ratio = 2*shadowWorldSize/graphics.shadows.resolution

            worldPosition = vec3.add([],this.position,vec3.scale([],graphics.light.direction,graphics.shadows.cameraOffset))
            worldPosition = [Math.floor(worldPosition[0]/ratio)*ratio,
                            Math.floor(worldPosition[1]/ratio)*ratio,
                            Math.floor(worldPosition[2]/ratio)*ratio]
            worldTarget = vec3.sub([],worldPosition,vec3.scale([],graphics.light.direction,graphics.shadows.cameraOffset))

            mat4.ortho(graphics.shadows.cascades[1].projectionMatrix,-shadowWorldSize,shadowWorldSize,-shadowWorldSize,shadowWorldSize,1,2000)
            mat4.lookAt(graphics.shadows.cascades[1].viewMatrix,worldPosition,worldTarget,[1,0,0])
            // mat4.lookAt(graphics.shadows.viewMatrix,worldPosition,worldTarget,this.upVector)

            // mat4.ortho(this.projectionMatrix,-shadowWorldSize,shadowWorldSize,-shadowWorldSize,shadowWorldSize,1,2000)
            // mat4.lookAt(this.viewMatrix,worldPosition,worldTarget,this.upVector)
            // console.log(this.shadows.viewMatrix)
        },
        setFov(degrees){
            this.fov = degrees / (180 / Math.PI)
        }
        // "setPosition":(position) => this.position = position
    },
    "light":
    {
        "direction":vec3.normalize([],[1,1,-1]),
        setDirection(value){this.direction = value}
    },
    "shadows":{
        "enabled":true,
        "useShadowTexture":true,
        "cameraOffset":10,
        "resolution":2048,
        "depth":2000,
        "colorTexture":null,
        "depthTexture":null,
        "frameBuffer":null,
        "cascades":[
            {
                "worldSize":50,
                "projectionMatrix":[],
                "viewMatrix":[]
            },
            {
                "worldSize":800,
                "projectionMatrix":[],
                "viewMatrix":[]
            }
        ],
        "dummyDepthTexture":null
    },
    "skybox":"coolSkybox",
    "matrixBuffer":null,
    "normalMatrixBuffer":null,
    "createModel":rendering.createEmptyModel,
    "setModelData":rendering.setModelData,

    //methods
    setSkyboxTexture(textureName){this.skybox = textureName},
    setCanvasSampling(value){this.canvas = value},
}

export let input = {
    "keys":{},
    "mouseMovement":[0,0],
    "wheelMovement":[0,0],
    "lockCursor":false,
    "mouseDown":[false,false,false],
    "mouseHeld":[-1,-1,-1],
    setCursorLock(locked){
        this.lockCursor = locked
        // alert(this.cursorLock)
    },
    getKeyHeld(key){
        return (this.keys[key] >= 0)
    },
    getKeyPressed(key,time=0){
        // console.log(this.keys[key])
        let pressed = (this.keys[key] <= time && this.keys[key] >= 0.0)
        if (pressed) this.keys[key] += time
        return pressed
    },
    getMouseHeld(id = 0){
        return this.mouseDown[id]
    },
    getMousePressed(id = 0,time=0){
        let pressed = this.mouseDown[id] <= time && this.mouseDown[id] >= 0.0
        if (pressed) this.mouseDown[id] += time
        return pressed
    },
}

let debugMode = false
let autoRun = true
export let objects = []
export let objectCount
let frameGraph
let frameMeter
let frameCtx
let lastFps
export let gl;
let server;

console.log("hello renderini")

function drawFrameGraph(y=50,y2,t=1){
    // console.log("aah")
    frameCtx.strokeStyle = "white"
    frameCtx.globalCompositeOperation = "copy"; // Replaces existing content
    frameCtx.drawImage(frameCtx.canvas, -t, 0); 
    frameCtx.globalCompositeOperation = "source-over"; // Reset to default
    frameCtx.beginPath()
    frameCtx.moveTo(198,y2)
    frameCtx.lineTo(199,y)
    frameCtx.stroke()
    frameCtx.beginPath()
    frameCtx.moveTo(0,200-60/2)
    frameCtx.lineTo(200,200-60/2)
    frameCtx.stroke()
    frameCtx.beginPath()
    frameCtx.moveTo(0,200-165/2)
    frameCtx.lineTo(200,200-165/2)
    frameCtx.stroke()
    // frameCtx.fillRect(0,0,100,100)
}

if (engineMode == "client") {
    var textCanvas = document.createElement("canvas")
    var textCtx = textCanvas.getContext("2d");
    document.body.append(textCanvas)
    window.hiResMode = false
    window.toggleHiResMode = function () {
        hiResMode = !hiResMode
        if (hiResMode) {
            canvas.width = 1440
            canvas.height = 1080
        }
        else {
            canvas.width = 320
            canvas.height = 240
        }
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }
    document.addEventListener("mousemove", (event) => {
        input.mouseMovement[0] += event.movementX
        input.mouseMovement[1] += event.movementY
    })
    document.addEventListener("wheel",(event)=>{
        input.wheelMovement[0] += event.deltaX
        input.wheelMovement[1] += event.deltaY
    })

    window.quatFromEuler = function (x, y, z) {
        let g = quat.create();
        quat.fromEuler(g, x, y, z)
        return g
    }
    document.addEventListener('click', initialize);
    if (autoRun) {
        document.addEventListener("DOMContentLoaded", initialize)
        document.getElementById("innerRunText").innerText = "running..."
    }
    document.addEventListener('mousedown',(event)=>{input.mouseDown[event.button] = true;input.mouseHeld[event.button] = 0})
    document.addEventListener('mouseup',(event)=>{input.mouseDown[event.button] = false})
}
else{
    initialize()
    // console.log("guggy")
}

export function createObject(obj) {
    objects.push(obj);
    // console.log(objects)
    return obj
}
export function hasObject(obj){
    return objects.includes(obj)
}
export function destroyObject(obj) {
    if (obj == null || obj == undefined) return
    let index = objects.indexOf(obj)
    if (index >= 0) {
        objects.splice(index, 1)
    }
    obj.destroyed = true
    return obj
}
export function worldToScreenSpace(position) {
    // alert(position)
    // alert(camera)
    // alert(projection)
    // alert(vec3.transformMat4(position))
    return vec3.transformMat4([], vec3.transformMat4([], position, camera), projection)
}

async function initialize() {
    graphics.canvas = {width:1,height:1} //for server mode



    await configureHTML()
    await configureGL()

    await assets.loadShaders(gl)
    await assets.loadModels(gl)
    await assets.loadTextures(gl)

    graphics.aspect = graphics.canvas.width / graphics.canvas.height

    physics.InitializeGameObjectList(objects)
    physics.InitializeModelList(assets.models)

    await rendering.initializeRendering(gl)

    if (engineMode == "client") await document.fonts.ready;

    if (engineMode == "server"){
        // server = await import("./networking/server.js")
    }
    time.updateInterval = setInterval(update, 1000/time.targetFrameRate)
    // time.tickInterval = setInterval(tick,1000/time.targetTickRate)
    time.lastTickTime = performance.now()

    await game.init();

    // tick()
    setTimeout(tick,1000/time.tickRate)
}

function configureHTML(){
    if (engineMode == "server") return
    document.removeEventListener('click', initialize);
    document.getElementById("clickToRun").remove()
    frameMeter = document.getElementById("frameMeter")
    graphics.canvas = document.getElementById("canvas");
    graphics.canvas.addEventListener("click", async () => {
        // alert(input.lockCursor)
        if (input.lockCursor) {
            // alert("a")
            await canvas.requestPointerLock();
        }

        graphics.canvas.focus()
    });


    // console.log("weenie")
    graphics.canvas.addEventListener('keydown', function (event) {
        // console.log("key went down")
        event.preventDefault();
        if (event.repeat) {
            return;
        }
        input.keys[event.code] = 0;
        if (debugMode) {
            if (event.code == "BracketRight") {
                toggleHiResMode()
            }
            if (event.code == "BracketLeft") {
                setTimeScale(2)
            }
            if (event.code == "Backslash"){
                frameGraph.style.width = frameGraph.style.height
                frameMeter.style.fontSize = "20px"
            }
        }
        // alert(event.key)
    });
    graphics.canvas.addEventListener('keyup', function(event) {
    // console.log("key went up")
        input.keys[event.code] = -1;
        if (debugMode){
        if (event.code == "BracketRight"){
        // toggleHiResMode()
        }
        if (event.code == "BracketLeft"){
        setTimeScale(1)
        }
        if (event.code == "Backslash"){
            frameGraph.style.width = "0px"
            frameMeter.style.fontSize = "0px"
        }
        // alert(event.code)
        if (event.code == "Insert"){
        alert(fps)
        }
        }
    });

    
    frameGraph = document.createElement("canvas")
    frameCtx = frameGraph.getContext("2d")
    
    frameGraph.style.position = "fixed"
    frameGraph.style.backgroundColor = "rgba(100,100,100,0.4)"
    frameGraph.style.left = "0px"
    frameGraph.style.top = "0px"
    frameGraph.width = 200
    frameGraph.height = 200
    frameGraph.style.width = "0px"
    document.body.appendChild(frameGraph)
}

function configureGL(){
    if (engineMode == "server") return
    gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: false });

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    if (!gl) {
        alert("no webgl!");
    }

    gl.clearColor(1, 1, 1, 1);

    gl.clear(gl.COLOR_BUFFER_BIT);
    console.log("webgl initialized")

    graphics.matrixBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, graphics.matrixBuffer);
    graphics.normalMatrixBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, graphics.normalMatrixBuffer);
}

{
    // shadowColorTexture = gl.createTexture();
    // gl.bindTexture(gl.TEXTURE_2D,shadowColorTexture)
    // // console.log(gl.DEPTH_COMPONENT24)
    // gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,shadowMapSize,shadowMapSize,0,gl.RGBA,gl.UNSIGNED_BYTE,null)
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // gl.activeTexture(2)
    // shadowDepthTexture = gl.createTexture();
    // gl.bindTexture(gl.TEXTURE_2D,shadowDepthTexture)
    // gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,shadowMapSize,shadowMapSize,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null)
    // gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
    // gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // dummyDepthTexture = gl.createTexture();
    // gl.bindTexture(gl.TEXTURE_2D,dummyDepthTexture)
    // gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,shadowMapSize,shadowMapSize,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null)
    // gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
    // gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // shadowFramebuffer = gl.createFramebuffer()
    // gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFramebuffer)

    // gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,shadowColorTexture,0)
    // gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shadowDepthTexture,0)

    // console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER))
}

let lastModel
let mdl

export function setDebugText(text) {
    if (engineMode == "server") return
    frameMeter.innerText += "\n" + text
}

async function update() {
    if (engineMode == "client") graphics.canvas.style.left = (window.innerWidth/2-graphics.canvas.clientWidth/2)+"px"
    // alert((window.innerWidth/2-graphics.canvas.innerWidth/2)+"px")
    let updateStartTime = performance.now()
    
    time.time += time.deltaTime
    time.now = time.time * 1000
    // await updateCamera();
    graphics.aspect = graphics.canvas.width / graphics.canvas.height
    // console.log("a"+keys)
    // let pingText = Math.floor(client.ping*1000)+"ms ping, "
    // if (client.connectionState != "connected"){
        // pingText = ""
    // }
    objectCount = objects.length
    for (let i = 0;i<objects.length;i++){
        let ogObject = objects[i]
        objects[i].Update()
        if (objects[i] !== ogObject) {continue}
    }
    await game.update();
    
    // console.log(physics.triangleCount)
    
    let beforeTime = time.lastFrameTime;
    time.lastFrameTime = performance.now();
    let timediff = time.lastFrameTime - beforeTime
    time.deltaTime = Math.min(timediff / 1000, time.maxDeltaTime) * time.timeScale
    
    time.lastFps = time.fps
    time.fps = Math.floor(1 / (timediff / 1000))
    if (engineMode == "client") {
        frameMeter.innerText = Math.floor(timediff) + "ms, " + time.fps + "fps" +", "+objectCount +" objects"
        drawFrameGraph(200-time.fps/2,200-time.lastFps/2,1)
        let size = canvas.getBoundingClientRect().left
        frameGraph.style.left = size+"px"
        // frameGraph.style.top = size+"px"
    }

    time.tickProgress += time.deltaTime*time.tickRate
    if (time.tickProgress >= 1 && engineMode== "client"){
        tick()
    }

    time.updateTime = performance.now()-updateStartTime

    if (engineMode == "server") return

    let renderStartTime = performance.now()
    graphics.camera.updateCamera();
    let oldTime = performance.now()
    await rendering.render(gl,objects);
    time.renderTime = performance.now()-renderStartTime

    let controlStartTime = performance.now()
    // console.log(1000/(performance.now()-oldTime))
    for (const key in input.keys) {
        if (input.keys[key] >= 0) {
            input.keys[key] += time.deltaTime
        }
    }
    for (let i = 0;i<3;i++){
        if (input.mouseDown[i]){
            input.mouseHeld[i] += time.deltaTime
        }
    }

    input.mouseMovement = [0, 0]
    input.wheelMovement = [0,0]


    // console.log("gagy")

    // console.log(physics.performanceTime+"ms, "+Math.floor(100*100*physics.performanceTime/time.updateTime)/100+"%")
    physics.resetTriangleCount()
    time.controlTime = performance.now()-controlStartTime
    // console.log(time.updateTime,time.renderTime,time.controlTime)
}

async function tick(){
    time.currentTickRate = 1000/(performance.now()-time.lastTickTime)
    time.lastTickTime = performance.now()
    time.realDeltaTime = time.deltaTime
    time.deltaTime = 1/time.tickRate
    game.tick()
    for (let i = 0;i<objects.length;i++){
        let previousPosition = [...objects[i].position]
        let previousRotation = [...objects[i].rotation]
        let ogObject = objects[i]
        objects[i].Tick()
        if (objects[i] !== ogObject) {continue}
        if (JSON.stringify(previousPosition) != JSON.stringify(objects[i].position) && objects[i].interpolate){
            objects[i].targetPosition = [...objects[i].position]
            // objects[i].position = [...previousPosition]
            objects[i].oldInterpolatePosition = [...previousPosition]
            // alert(objects[i].oldInterpolatePosition+"a")
        }
        if (JSON.stringify(previousRotation) != JSON.stringify(objects[i].rotation) && objects[i].interpolate){
            objects[i].targetRotation = [...objects[i].rotation]
            // objects[i].rotation = [...previousRotation]
            objects[i].oldInterpolateRotation = [...previousRotation]
            // alert(objects[i].oldInterpolatePosition+"a")
        }
    }
    time.deltaTime = time.realDeltaTime
    time.tickProgress = 0
    if (engineMode == "server") setTimeout(tick,1000/time.tickRate)
}

function reset() {
    clearInterval(updateInterval);
    initialSetup();
}

export async function getFile(path){
    let file
    if (engineMode == "client"){
        let filePromise = await fetch(path)
        file = await filePromise.text()
    }
    else{
        file = fs.readFileSync(path).toString();
    }
    return file
}