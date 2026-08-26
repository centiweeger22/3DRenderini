import * as importer from "./importer.js"
import * as rini from "./renderini.js"
export let textures = new Map()
export let models = new Map()
export let shaders = new Map()

export async function loadTextures(gl){
    if (!gl) return
    let textureListPromise = await rini.getFile("./game/resources/textureList.json")
    let textureList = JSON.parse(textureListPromise)
    for (let entry of textureList){

        if ("amount" in entry){
            batchRegisterTexture(gl,entry)
            continue
        }

        registerTexture(gl,entry)
    }
}

export function registerTexture(gl,entry){
    let name = entry.name
    let src = entry.src
    let img = entry.img

    let sampling = "LINEAR"
    let wrap = "REPEAT"
    if ("sampling" in entry) sampling = entry.sampling
    if (!sampling in gl){console.log("TEXTURES: invalid texture sampling! sampling on texture "+src+" has sampling "+sampling)}
    if ("wrap" in entry) wrap = entry.wrap
    if (!wrap in gl){console.log("TEXTURES: invalid texture wrapping! sampling on texture "+src+" has wrap "+wrap)}
    // console.log(wrap)

    let image = new Image();
    if (img != undefined){
        image = img
    }
    else{
        image.src = "./game/resources/textures/"+src
    }
    let texture = gl.createTexture();

    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[sampling]);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[wrap]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[wrap]);
        textures.set(name, texture)
    };

    if (img != undefined){
        image.onload()
    }
}

function batchRegisterTexture(gl,entry){
    for (let i = 0;i<entry.amount;i++){
        let currentEntry = {}
        Object.assign(currentEntry,entry)
        currentEntry.name += "_"+i
        
        let srcSplit = entry.src.split(".")
        let fileName = srcSplit[0]
        let fileExtension = srcSplit[1]

        currentEntry.src = fileName + ("_"+i) +"."+ fileExtension

        registerTexture(gl,currentEntry)
    }
}

export async function loadModels(gl){
    let modelListPromise = await rini.getFile("./game/resources/modelList.json")
    let modelList = JSON.parse(await modelListPromise)
    for (let entry of modelList){
        registerModel(gl,entry)
    }
}

async function registerModel(gl,entry){
    let model
    switch (entry.type){
        case "glb":
            model = await importer.LoadGLB(entry.src,gl)
            break;
        case "obj":
            model = await importer.LoadObj(entry.src,gl)
            break;
    }
    models.set(entry.src,model)
}

export async function loadShaders(gl){
    if (!gl) return
    let shaderListPromise = await fetch("./game/resources/shaderList.json")
    let shaderList = JSON.parse(await shaderListPromise.text())

    let shaderUniformPromise = await fetch("./game/resources/shaderUniforms.json")
    let shaderUniformList = JSON.parse(await shaderUniformPromise.text())

    for (let entry of shaderList){
        registerShader(gl,entry,shaderUniformList)
    }
    console.log("loaded all shaders successfully")
}

async function registerShader(gl,entry,uniforms){
    let fsSource = await (await fetch("./game/resources/shaders/"+entry.fragmentSrc+".glsl")).text()
    let vsSource = await (await fetch("./game/resources/shaders/"+entry.vertexSrc+".glsl")).text()

    let vertexShader = compileShader(gl, vsSource.trim(), gl.VERTEX_SHADER, entry.name);
    let fragmentShader = compileShader(gl, fsSource.trim(), gl.FRAGMENT_SHADER, entry.name);

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.useProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("shader error on shader "+entry.name+"! \n" + gl.getProgramInfoLog(program));
    }

    let positionLibrary = {}

    for (let uniform of uniforms){
        positionLibrary[uniform.name] = gl.getUniformLocation(program, uniform.name);
    }

    let findingInputColorTextures = true
    let i = 0;
    while (findingInputColorTextures){
        let name = "u_colorTexture"+i.toString()
        // console.log(entry.name,name+"A")
        positionLibrary[name] = gl.getUniformLocation(program, name);
        // console.log(gl.getUniformLocation(program, "u_colorTexture0"))
        if (positionLibrary[name] == -1 || positionLibrary[name] == null){
            findingInputColorTextures = false
        }
        i++
    }
    let findingInputDepthTextures = true
    i = 0;
    while (findingInputDepthTextures){
        let name = "u_depthTexture"+i.toString()
        positionLibrary[name] = gl.getUniformLocation(program, name);
        if (positionLibrary[name] == -1 || positionLibrary[name] == null){
            findingInputDepthTextures = false
        }
        i++
        // console.log("eh2")
    }

    shaders.set(entry.name, {program:program,positions:positionLibrary})
}
function compileShader(gl,source,type,name){
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Shader compilation error on shader "+name+":" + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader
}

export async function loadPostProcessingEffects(){
    let postProcessingPromise = await fetch("./game/resources/postProcessingEffects.json")
    let postProcessing = JSON.parse(await postProcessingPromise.text())
    return postProcessing;
}