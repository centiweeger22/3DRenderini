import { mat4, vec3, quat } from "./glMatrix/esm/index.js"
import * as assets from "./assets.js"
import * as rini from "./renderini.js"
import { clone, sub } from "./glMatrix/esm/mat2.js"
export class RenderCall{
    constructor(model,submesh,transform,attribs){
        this.model = model
        this.submesh = submesh
        this.transform = transform
        this.shader = attribs.shader
        this.texture = attribs.texture
        this.normalMap = attribs.normalMap
        this.attribs = attribs
        this.culling = true
        this.depth = true
        this.alpha = 1.0
        const normalMatrix = mat4.create();
        mat4.invert(normalMatrix, transform);
        mat4.transpose(normalMatrix, normalMatrix);
        this.normalMatrix = normalMatrix
        this.postProcessing = false
        this.skybox = false
        this.depthWrite = attribs.depthWrite
        if (this.depthWrite == undefined) this.depthWrite = true
    }
}

let matrixBuffer
let normalMatrixBuffer

let shadowColorTexture
let shadowDepthTexture
let shadowFramebuffer
let dummyDepthTexture

let renderColorTexture
let renderDepthTexture
let renderFramebuffer

let renderBufferWidth = 1920
let renderBufferHeight = 1080

let postProcessingEffects
let postProcessingFramebuffers = {}

let clonegl

export function createEmptyModel(name,submeshCount){
    let wholeModel = {"submeshes":[]}
    for (let i = 0;i<submeshCount;i++){
        let mdlSegment = {}
        let buf = clonegl.createBuffer()
        mdlSegment.buffer = buf
        wholeModel.submeshes.push(mdlSegment)
    }
    assets.models.set(name,wholeModel)
}

export function setModelData(data,name){
    let model = assets.models.get(name)
    for (let i = 0;i<model.submeshes.length;i++){
        let mdlSegment = model.submeshes[i]
        clonegl.bindBuffer(clonegl.ARRAY_BUFFER, mdlSegment.buffer)
        clonegl.bufferData(clonegl.ARRAY_BUFFER, new Float32Array(data[i]), clonegl.DYNAMIC_DRAW);
        mdlSegment.vertices = data[i]
        mdlSegment.skinning = false
    }
}

export async function initializeRendering(gl){
    if (!gl) return
    clonegl = gl
    matrixBuffer = gl.createBuffer()
    normalMatrixBuffer = gl.createBuffer()

    shadowColorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,shadowColorTexture)

    let shadowMapSize = rini.graphics.shadows.resolution
    // console.log(rini.graphics.shadows.cascades.length)
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,shadowMapSize * rini.graphics.shadows.cascades.length,shadowMapSize,0,gl.RGBA,gl.UNSIGNED_BYTE,null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // gl.activeTexture(2)
    shadowDepthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,shadowDepthTexture)
    gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,shadowMapSize*rini.graphics.shadows.cascades.length,shadowMapSize,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    dummyDepthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,dummyDepthTexture)
    gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,shadowMapSize,shadowMapSize,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null)
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    shadowFramebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFramebuffer)

    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,shadowColorTexture,0)
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shadowDepthTexture,0)

    assets.textures.set("RENDERINI_shadow_depth_atlas",shadowDepthTexture)

    renderColorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,renderColorTexture)
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1920,1080,0,gl.RGBA,gl.UNSIGNED_BYTE,null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_Mag_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);

    renderDepthTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,renderDepthTexture)
    gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,1920,1080,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null)

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    
    renderFramebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER,renderFramebuffer)
    
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,renderDepthTexture,0)
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,renderColorTexture,0)
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);

    // gl.bindFramebuffer(gl.FRAMEBUFFER, renderFramebuffer);
    // console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER));

    assets.textures.set("RENDERINI_render_color",renderColorTexture)
    assets.textures.set("RENDERINI_render_depth",renderDepthTexture)
    // console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER))
    await InitializePostProcessing(gl)
}

async function InitializePostProcessing(gl){
    postProcessingEffects = await assets.loadPostProcessingEffects();
    for (let effect of postProcessingEffects){
        let frameBufferList = {}
        for (let i = 0;i<effect.framebuffers.length;i++){
            let colorTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D,colorTexture)
            gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,renderBufferWidth,renderBufferHeight,0,gl.RGBA,gl.UNSIGNED_BYTE,null)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            let depthTexture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D,depthTexture)
            gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,renderBufferWidth,renderBufferHeight,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null)
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);
            gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            let buffer = gl.createFramebuffer()
            gl.bindFramebuffer(gl.FRAMEBUFFER,buffer)

            gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,colorTexture,0)
            gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depthTexture,0)

            let framebuffer = {
                "buffer":buffer,
                "colorTexture":colorTexture,
                "depthTexture":depthTexture
            }

            frameBufferList[effect.framebuffers[i].name] = framebuffer
        }
        postProcessingFramebuffers[effect.name] = frameBufferList
    }
}

export async function render(gl,objects) {
    if (renderBufferWidth != rini.graphics.canvas.width || renderBufferHeight != rini.graphics.canvas.height){
        renderBufferWidth = rini.graphics.canvas.width
        renderBufferHeight = rini.graphics.canvas.height
        gl.bindTexture(gl.TEXTURE_2D,renderColorTexture)
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,renderBufferWidth,renderBufferHeight,0,gl.RGBA,gl.UNSIGNED_BYTE,null)
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D,renderDepthTexture)
        gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,renderBufferWidth,renderBufferHeight,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null)
        gl.bindFramebuffer(gl.FRAMEBUFFER,renderFramebuffer)
    
        gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,renderDepthTexture,0)
        gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,renderColorTexture,0)
    }
    // console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER));

    gl.enable(gl.CULL_FACE);


    setUpSkeletons(objects)

    let renderCalls = arrangeRenderCalls(objects)
    
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    //shadows
    if (rini.graphics.shadows.enabled){
        updateCamera(true,0)
        gl.viewport(0,0,rini.graphics.shadows.resolution*2,rini.graphics.shadows.resolution)
        gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFramebuffer)

        gl.clearColor(1.0, 0.0, Math.abs(Math.sin(Date.now() / 1000)), 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        drawRenderPass(gl,renderCalls[0],false,false)
    }

    // gl.viewport(rini.graphics.shadows.resolution,0,rini.graphics.shadows.resolution,rini.graphics.shadows.resolution)

    // updateCamera(true,1)
    // drawRenderPass(gl,renderCalls[0],false)

    //regular rendering
    updateCamera(false)
    gl.viewport(0,0,rini.graphics.canvas.width,rini.graphics.canvas.height)
    gl.bindFramebuffer(gl.FRAMEBUFFER,renderFramebuffer)
    
    gl.clearColor(1.0, 0.0, Math.abs(Math.sin(Date.now() / 1000)), 1.0);
    gl.clearColor(1.0, 0.0, Math.abs(Math.sin(Date.now() / 1000)), 1.0);
    gl.clearDepth(1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.colorMask(true, true, true, false);
    for (let i = 0;i<renderCalls.length;i++){
        drawRenderPass(gl,renderCalls[i],true,true)
    }
    gl.colorMask(true, true, true, true);

    for (let effect of postProcessingEffects){
        for (let i = 0;i<effect.effects.length;i++){
            let currentEffect = effect.effects[i]
            let attribs = {shader:currentEffect.shader,texture:"number5",normalMap:"number5",colorBuffers:[],depthBuffers:[]}
            for (let d = 0;d < currentEffect.inputFramebuffers.length;d++){
                if (currentEffect.inputFramebuffers[d] == "RENDERINI_MainFramebuffer"){
                    attribs.colorBuffers[d] = renderColorTexture
                    attribs.depthBuffers[d] = renderDepthTexture
                }
                else{
                    attribs.colorBuffers[d] = postProcessingFramebuffers[effect.name][currentEffect.inputFramebuffers[d]].colorTexture
                    attribs.depthBuffers[d] = postProcessingFramebuffers[effect.name][currentEffect.inputFramebuffers[d]].depthTexture
                }
            }
            if (currentEffect.outputFramebuffer == "RENDERINI_Output"){
                gl.bindFramebuffer(gl.FRAMEBUFFER,null)
            }
            else if (currentEffect.outputFramebuffer == "RENDERINI_MainFramebuffer"){
                gl.bindFramebuffer(gl.FRAMEBUFFER,renderFramebuffer)
            }
            else{
                gl.bindFramebuffer(gl.FRAMEBUFFER,postProcessingFramebuffers[effect.name][currentEffect.outputFramebuffer].buffer)
            }

            gl.clearColor(1.0, 0.0, Math.abs(Math.sin(Date.now() / 1000)), 1.0);
            gl.clearColor(1.0, 0.0, Math.abs(Math.sin(Date.now() / 1000)), 1.0);
            gl.clearDepth(1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // console.log(postProcessingFramebuffers[effect.name])

            let matrix = mat4.fromRotation([],0,[0,1,0])
            let renderCall = new RenderCall("uiPlane",0,matrix,attribs)
            renderCall.postProcessing = true
            drawRenderPass(gl,[renderCall],true,false)
        }
    }
    // gl.bindTexture(gl.TEXTURE_2D,renderColorTexture)
    // gl.generateMipmap(gl.TEXTURE_2D);

    // gl.bindFramebuffer(gl.FRAMEBUFFER,null)
    // gl.clearColor(1.0, 0.0, Math.abs(Math.sin(Date.now() / 1000)), 1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // console.log(matrix)
    // let renderCall = new RenderCall("uiPlane",0,matrix,{shader:"output",texture:"RENDERINI_render_color",normalMap:"sausageBoy"})
    // drawRenderPass(gl,[renderCall],true,true)
}
function drawRenderPass(gl,currentRenderPass,useShadows,shadowBool){
    let mdl
    let lastModel
    let lastSubMesh
    let lastShader
    let currentProgram
    let lastTexture
    let programPositions
    let updateCount = 0
    let triangleCount = 0
    let matrixArray = []
    let normalMatrixArray = []
    let instanceCount = 0
    for (let d = 0;d<currentRenderPass.length;d++){
        instanceCount ++
        let currentRenderCall = currentRenderPass[d]
        let nextRenderCall = currentRenderPass[d+1]
        let changeRender = false
        if (nextRenderCall == undefined){
            changeRender = true
        }
        else{
            if (nextRenderCall.model != currentRenderCall.model){
                changeRender = true
            }
            if (nextRenderCall.submesh != currentRenderCall.submesh){
                changeRender = true
            }
            if (nextRenderCall.shader != currentRenderCall.shader){
                changeRender = true
            }
            if (nextRenderCall.texture != currentRenderCall.texture){
                changeRender = true
            }
            if (nextRenderCall.normalMap != currentRenderCall.normalMap){
                changeRender = true
            }
            if (nextRenderCall.skinning){
                changeRender = true
            }
            if (!nextRenderCall.castShadow&&!shadowBool){
                changeRender = true
            }
            if (!currentRenderCall.castShadow && ! shadowBool) changeRender = true
        }
        
        // if (currentRenderCall.model != lastModel || currentRenderCall.submesh != lastSubMesh){
            // }

        if (currentRenderCall.model != lastModel){
            updateCount ++
            // console.log(updateCount)
            mdl = assets.models.get(currentRenderCall.model)
            lastModel = currentRenderCall.model
            lastSubMesh = currentRenderCall.submesh
        }
        else{
            if (currentRenderCall.submesh != lastSubMesh){
                updateCount ++
                // console.log(updateCount)
                lastSubMesh = currentRenderCall.submesh
                // gl.bindBuffer(gl.ARRAY_BUFFER, mdl[currentRenderCall.submesh].buffer)
            }
        }
        
        if (currentRenderCall.shader != lastShader){
            updateCount ++
            // console.log(updateCount)
            lastShader = currentRenderCall.shader
            let currentProgramGroup = assets.shaders.get(currentRenderCall.shader)
            programPositions = currentProgramGroup.positions
            currentProgram = currentProgramGroup.program;
            gl.useProgram(currentProgram);
            doVertexAttribs(gl,currentProgram, mdl.submeshes[currentRenderCall.submesh])
            gl.uniformMatrix4fv(programPositions.u_viewMatrix, false, currentViewMatrix);
            gl.uniformMatrix4fv(programPositions.u_projectionMatrix, false, currentProjectionMatrix);
            // console.log(rini.graphics.shadows.viewMatrix,rini.graphics.shadows.cascades[0].projectionMatrix)
            gl.uniformMatrix4fv(programPositions.u_shadowViewMatrix, false, [...rini.graphics.shadows.cascades[0].viewMatrix,...rini.graphics.shadows.cascades[1].viewMatrix]);
            gl.uniformMatrix4fv(programPositions.u_shadowProjectionMatrix, false, [...rini.graphics.shadows.cascades[0].projectionMatrix,...rini.graphics.shadows.cascades[1].projectionMatrix]);
            gl.uniform3fv(programPositions.u_oppositeLightDirection, new Float32Array(rini.graphics.light.direction));
            gl.uniform1f(programPositions.u_aspect, rini.graphics.camera.aspect);
            gl.uniform1f(programPositions.u_near, rini.graphics.camera.near);
            gl.uniform1f(programPositions.u_far, rini.graphics.camera.far);
            gl.uniform1f(programPositions.u_targetDepth, rini.graphics.camera.DOFTargetDepth);
            gl.uniform1f(programPositions.u_depthRange, rini.graphics.camera.DOFDepthRange);
            gl.uniform1f(programPositions.u_maxLevel, rini.graphics.camera.DOFMaxLevel);
            gl.uniform1i(programPositions.reflectionTexture, 1)
            gl.uniform2fv(programPositions.u_resolution,new Float32Array([1920.0, 1080.0]))
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, assets.textures.get(rini.graphics.skyboxTexture));
        }

        matrixArray.push(...currentRenderCall.transform)
        normalMatrixArray.push(...currentRenderCall.normalMatrix)

        let alpha = 1.0;
        if (currentRenderCall != null) {
            if (currentRenderCall.alpha != null) {
                alpha = currentRenderCall.alpha
                changeRender = true
            }
        }
        const alphaLoc = programPositions.u_alpha
        gl.uniform1f(alphaLoc, alpha);



        gl.enable(gl.CULL_FACE);
        if (!currentRenderCall.culling) {
            gl.disable(gl.CULL_FACE);
        }

        gl.enable(gl.DEPTH_TEST)
        if (!currentRenderCall.depth) {
            gl.disable(gl.DEPTH_TEST)
        }

        if (changeRender){
            mdl = assets.models.get(currentRenderCall.model)

            let firstCost = performance.now()
            let matrixData = new Float32Array(matrixArray)
            let normalMatrixData = new Float32Array(normalMatrixArray)
            let lastCost = performance.now()
            // performanceCounter += lastCost-firstCost
            gl.bindBuffer(gl.ARRAY_BUFFER,matrixBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, matrixData, gl.DYNAMIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER,normalMatrixBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, normalMatrixData, gl.DYNAMIC_DRAW);

            // console.log(programPositions.u_texture,programPositions.u_reflectionTexture,programPositions.u_shadowTexture)

            gl.uniform1i(programPositions.u_reflectionTexture, 1)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, assets.textures.get(rini.graphics.skybox));

            gl.uniform1i(programPositions.u_texture, 0)
            gl.activeTexture(gl.TEXTURE0)
            // console.log(rini.graphics.skyboxTexture)
            gl.bindTexture(gl.TEXTURE_2D, assets.textures.get(currentRenderCall.texture));

            gl.uniform1i(programPositions.u_normalMap, 2)
            gl.activeTexture(gl.TEXTURE2)
            // console.log(rini.graphics.skyboxTexture)
            // console.log(currentRenderCall.normalMap)
            gl.bindTexture(gl.TEXTURE_2D, assets.textures.get(currentRenderCall.normalMap));
            // console.log(currentRenderCall)

            gl.uniform1i(programPositions.u_shadowTexture, 3)
            gl.activeTexture(gl.TEXTURE3)
            if (useShadows){
                gl.bindTexture(gl.TEXTURE_2D, shadowDepthTexture);
            }
            else{
                gl.bindTexture(gl.TEXTURE_2D, dummyDepthTexture);
            }

            gl.uniform1i(programPositions.u_depthTexture, 4)
            gl.activeTexture(gl.TEXTURE4)
            // console.log(rini.graphics.skyboxTexture)
            // console.log(currentRenderCall.normalMap)
            gl.bindTexture(gl.TEXTURE_2D, renderDepthTexture);

            if (currentRenderCall.postProcessing){
                let currentTextureUnit = 8
                if (currentRenderCall.attribs != undefined && "colorBuffers" in currentRenderCall.attribs){
                    for (let i = 0;i<currentRenderCall.attribs.colorBuffers.length;i++){
                        // console.log("weeh")
                        let bufferName = "TEXTURE"+currentTextureUnit.toString()
                        // console.log(bufferName)
                        gl.activeTexture(gl[bufferName])
                        gl.bindTexture(gl.TEXTURE_2D, currentRenderCall.attribs.colorBuffers[i]);
                        gl.uniform1i(programPositions["u_colorTexture"+i.toString()], currentTextureUnit)
                        // console.log(programPositions["u_colorTexture"+i.toString()])
                        currentTextureUnit ++
                    }
                }

                if (currentRenderCall.attribs != undefined && "depthBuffers" in currentRenderCall.attribs){
                    for (let i = 0;i<currentRenderCall.attribs.depthBuffers.length;i++){
                        gl.activeTexture(gl["TEXTURE"+currentTextureUnit.toString()])
                        gl.bindTexture(gl.TEXTURE_2D, currentRenderCall.attribs.depthBuffers[i]);
                        gl.uniform1i(programPositions["u_depthTexture"+i.toString()], currentTextureUnit)
                        currentTextureUnit ++
                    }
                }
            }

            let submesh = mdl.submeshes[currentRenderCall.submesh]
            doVertexAttribs(gl,currentProgram, submesh)

            if (currentRenderCall.skinning){
                // console.log(currentRenderCall.boneMatrixData)
                gl.uniformMatrix4fv(programPositions.u_boneMatrices,false,currentRenderCall.boneMatrixData)
                gl.uniformMatrix4fv(programPositions.u_inverseBindMatrices,false,currentRenderCall.inverseBindMatrixData)
                // console.log("bone"+currentRenderCall.boneMatrixData.slice(48,64))
                // console.log("inverse"+currentRenderCall.inverseBindMatrixData.slice(48,64))
            }
            else{
                gl.uniformMatrix4fv(programPositions.u_boneMatrices,false,new Float32Array(32*16))
                gl.uniformMatrix4fv(programPositions.u_inverseBindMatrices,false,new Float32Array(32*16))
            }

            if (programPositions.u_skinning != -1){
                gl.uniform1i(programPositions.u_skinning, currentRenderCall.skinning)
            }
            gl.uniform1i(programPositions.u_renderShadow,0)
            if (programPositions.u_renderShadow != -1){
                if (rini.graphics.shadows.enabled){
                    gl.uniform1i(programPositions.u_renderShadow,1)
                }
                gl.uniform1f(programPositions.u_shadowDepth,400)
                gl.uniform1f(programPositions.u_shadowResolution,rini.graphics.shadows.resolution)
                gl.uniform1f(programPositions.u_shadowSize,rini.graphics.shadows.cascades[0].worldSize)
            }

            if (programPositions.u_time != -1){
                // console.log("time spotted")
                gl.uniform1f(programPositions.u_time, rini.time.time)
            }

            // console.log(aspect)
            // console.log(aspect)
            gl.uniform1f(programPositions.u_aspect, rini.graphics.camera.aspect)
            // console.log(matrixData)

            // console.log(instanceCount)
            gl.bindBuffer(gl.ARRAY_BUFFER,mdl.submeshes[currentRenderCall.submesh].buffer)
            let stride = 12
            if (currentRenderCall.skinning) stride = 20

            let triangleCount = mdl.submeshes[currentRenderCall.submesh].vertices.length/stride
            // console.log("a"+triangleCount)
            // console.log("b"+gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE)/8)
            // gl.enable(gl.DEPTH_TEST)
            // if (currentRenderCall.skybox){
            //     // console.log("Gughle",currentRenderCall.model)
            //     gl.depthFunc(gl.GEQUAL)
            // }
            // else{
            //     gl.depthFunc(gl.LESS)
            // }

            // gl.depthMask(true)
            // if (currentRenderCall.depthWrite){
            // }
            // else{
            //     gl.depthMask(false)
            // }

            if (useShadows){
                gl.drawArraysInstanced(gl.TRIANGLES, 0, triangleCount,instanceCount);
            }
            else{
                if (currentRenderCall.castShadow && !shadowBool){
                    gl.uniformMatrix4fv(programPositions.u_viewMatrix, false, rini.graphics.shadows.cascades[0].viewMatrix);
                    gl.uniformMatrix4fv(programPositions.u_projectionMatrix, false, rini.graphics.shadows.cascades[0].projectionMatrix);
                    gl.viewport(0,0,rini.graphics.shadows.resolution,rini.graphics.shadows.resolution)
                    gl.drawArraysInstanced(gl.TRIANGLES, 0, triangleCount,instanceCount);
                    
                    gl.uniformMatrix4fv(programPositions.u_viewMatrix, false, rini.graphics.shadows.cascades[1].viewMatrix);
                    gl.uniformMatrix4fv(programPositions.u_projectionMatrix, false, rini.graphics.shadows.cascades[1].projectionMatrix);
                    
                    gl.viewport(rini.graphics.shadows.resolution,0,rini.graphics.shadows.resolution,rini.graphics.shadows.resolution)
                    gl.drawArraysInstanced(gl.TRIANGLES, 0, triangleCount,instanceCount);
                }
            }

            instanceCount = 0
            matrixArray = []
            normalMatrixArray = []
        }

        // gl.bindBuffer(gl.ARRAY_BUFFER,matrixBuffer)
        // gl.bindBuffer(gl.ARRAY_BUFFER, mdl[currentRenderCall.submesh].buffer)
        // triangleCount += Math.floor(gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE) / 32)/3
    }
}
function setUpSkeletons(objects){
    for (let currentObject of objects){
        let currentModel = assets.models.get(currentObject.model)
        if (!currentModel){
            console.warn("Model '"+currentObject.model+"' does not exist!")
            continue
        }
        currentObject.skinning = currentModel.skinning
        if (currentObject.skinning){
            if (!Object.hasOwn(currentObject,"skeleton")){
                currentObject.skeleton = JSON.parse(JSON.stringify(currentModel.skeleton))
                let currentSkeleton = currentObject.skeleton
                for (let d = 0;d<currentSkeleton.bones.length;d++){
                    let currentBone = currentSkeleton.bones[d]

                    if (!Object.hasOwn(currentBone,"rotation")){
                        currentBone.rotation = [0,0,0,1]
                    }
                    if (!Object.hasOwn(currentBone,"scale")){
                        currentBone.scale = [1,1,1]
                    }
                    if (!Object.hasOwn(currentBone,"translation")){
                        currentBone.translation = [0,0,0]
                    }
                    else{
                        currentBone.translation = [currentBone.translation[1],currentBone.translation[0],currentBone.translation[2]]
                    }
                    currentBone.originalRotation = JSON.parse(JSON.stringify(currentBone.rotation))
                    currentBone.originalTranslation = JSON.parse(JSON.stringify(currentBone.translation))

                    // currentBone.matrix = mat4.fromRotationTranslationScale([],currentBone.rotation,currentBone.translation,currentBone.scale)
                    // mat4.invert(currentBone.inverseBindMatrix,currentBone.matrix)
                }
            }
            let currentSkeleton = currentObject.skeleton

            let boneMatrixArray = []
            let inverseBindMatrixArray = []

            for (let d = 0;d<currentSkeleton.bones.length;d++){
                let currentBone = currentSkeleton.bones[d]
                currentBone.matrix = mat4.fromRotationTranslationScale([],currentBone.rotation,[currentBone.translation[1],currentBone.translation[0],currentBone.translation[2]],currentBone.scale)
                boneMatrixArray.push(...currentBone.matrix)
                inverseBindMatrixArray.push(...currentBone.inverseBindMatrix)
            }

            currentObject.boneMatrixData = new Float32Array(boneMatrixArray)
            currentObject.inverseBindMatrixData = new Float32Array(inverseBindMatrixArray)
        }
    }
}
function arrangeRenderCalls(objects){
    let renderCalls = []
    for (let currentObject of objects){
        if (currentObject.render){
            while (renderCalls.length - 1 < currentObject.renderPass){
                // RenderObject(currentObject)
                renderCalls.push([])
            }
            let currentMdl = assets.models.get(currentObject.model)

            if (!currentMdl){
                continue
            }

            let thisPosition = currentObject.position
            let thisRotation = currentObject.rotation
            if (currentObject.interpolate){
                vec3.lerp(thisPosition,currentObject.oldInterpolatePosition,currentObject.targetPosition,rini.time.tickProgress)
                quat.slerp(thisRotation,currentObject.oldInterpolateRotation,currentObject.targetRotation,rini.time.tickProgress)
            }

            let currentTransform = mat4.create();
            mat4.fromRotationTranslationScale(currentTransform, thisRotation, thisPosition, currentObject.scale)

            for (let transform of currentObject.alternateTransforms){
                mat4.mul(currentTransform,mat4.fromRotationTranslationScale([],transform.rotation,transform.position,transform.scale),currentTransform)
            }


            // console.log(currentMdl)
            for (let d = 0;d<currentMdl.submeshes.length;d++){
                let textureIndex = d
                textureIndex = Math.min(Math.max(textureIndex, 0), currentObject.textures.length - 1);

                let nrmIndex = d
                nrmIndex = Math.min(Math.max(nrmIndex, 0), currentObject.normalMaps.length - 1);
                // console.log(textures.get(currentObject.textures[textureIndex]))

                let shaderIndex = d
                shaderIndex = Math.min(Math.max(shaderIndex, 0), currentObject.shaders.length - 1);
                // console.log(currentObject.normalMaps[nrmIndex])
                let renderCall = new RenderCall(currentObject.model,d,currentTransform,{shader:currentObject.shaders[shaderIndex],texture:currentObject.textures[textureIndex],normalMap:currentObject.normalMaps[nrmIndex],depthWrite:currentObject.depthWrite})

                renderCall.culling = currentObject.culling
                renderCall.depth = currentObject.depth
                renderCall.skinning = currentObject.skinning
                renderCall.boneMatrixData = currentObject.boneMatrixData
                renderCall.inverseBindMatrixData = currentObject.inverseBindMatrixData
                renderCall.castShadow = currentObject.castShadow
                renderCall.skybox = currentObject.skybox
                if ("alpha" in currentObject.attributes) renderCall.alpha = currentObject.attributes.alpha

                renderCalls[currentObject.renderPass].push(renderCall)
            }
        }
    }
    // console.log(renderCalls)
    return renderCalls
}
function doVertexAttribs(gl,program,vertexBuffer) {
    if ("vao" in vertexBuffer){
        gl.bindVertexArray(vertexBuffer.vao)
        return
    }
    // console.log("gogug")
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)

    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer.buffer)
    
    let stride = 48
    if (vertexBuffer.skinning){
        stride = 80
    }

    const positionLoc = gl.getAttribLocation(program, "a_position");
    if (positionLoc != -1){
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(positionLoc);
    }

    const normalLoc = gl.getAttribLocation(program, "a_normal");
    if (normalLoc != -1){
        gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, stride, 12);
        gl.enableVertexAttribArray(normalLoc);
    }

    const textureLoc = gl.getAttribLocation(program, "a_texcoord");
    if (textureLoc != -1){
        gl.vertexAttribPointer(textureLoc, 2, gl.FLOAT, false, stride, 24);
        gl.enableVertexAttribArray(textureLoc);
    }

    const tangentLoc = gl.getAttribLocation(program, "a_tangent");
    if (tangentLoc != -1){
        gl.vertexAttribPointer(tangentLoc, 3, gl.FLOAT, false, stride, 32);
        gl.enableVertexAttribArray(tangentLoc);    
    }

    if (vertexBuffer.skinning){
        const jointsLoc = gl.getAttribLocation(program, "a_joints");
        if (jointsLoc != -1){
            gl.vertexAttribPointer(jointsLoc, 4, gl.FLOAT, false, stride, 48);
            gl.enableVertexAttribArray(jointsLoc);
        }
        const weightsLoc = gl.getAttribLocation(program, "a_weights");
        if (weightsLoc != -1){
            gl.vertexAttribPointer(weightsLoc, 4, gl.FLOAT, false, stride, 64);
            gl.enableVertexAttribArray(weightsLoc);
        }
            // console.log(positionLoc,normalLoc,textureLoc,tangentLoc,jointsLoc,weightsLoc)
    }
    else{
        // console.log(positionLoc,normalLoc,textureLoc,tangentLoc)
    }

    gl.bindBuffer(gl.ARRAY_BUFFER,matrixBuffer)
    // const objMatrixLoc = gl.getAttribLocation(program, "u_objectMatrix")
    // if (objMatrixLoc == -1){
    //     alert("AAH!")
    // }
    const bytesPerMatrix = 4 * 16;
    for (let i = 0; i < 4; ++i) {
        const loc = gl.getAttribLocation(program, "a_objectMatrix")+i
        if (loc == -1){
            continue;
        }
        gl.enableVertexAttribArray(loc);
        // note the stride and offset
        const offset = i * 16;  // 4 floats per row, 4 bytes per float
        gl.vertexAttribPointer(
            loc,              // location
            4,                // size (num values to pull from buffer per iteration)
            gl.FLOAT,         // type of data in buffer
            false,            // normalize
            bytesPerMatrix,   // stride, num bytes to advance to get to next set of values
            offset,           // offset in buffer
        );
        // this line says this attribute only changes for each 1 instance
        gl.vertexAttribDivisor(loc, 1);
    }

    // console.log(normalMatrixBuffer)
    gl.bindBuffer(gl.ARRAY_BUFFER,normalMatrixBuffer)
    let normalMatrixBufferLoc = gl.getAttribLocation(program, "a_normalMatrix")
    // const nrmMatrixLoc = gl.getAttribLocation(program, "u_normalMatrix");
    if (normalMatrixBufferLoc != -1){
        for (let i = 0; i < 4; ++i) {
            const loc = normalMatrixBufferLoc+i;
            gl.enableVertexAttribArray(loc);
            // note the stride and offset
            const offset = i * 16;  // 4 floats per row, 4 bytes per float
            gl.vertexAttribPointer(
                loc,              // location
                4,                // size (num values to pull from buffer per iteration)
                gl.FLOAT,         // type of data in buffer
                false,            // normalize
                bytesPerMatrix,   // stride, num bytes to advance to get to next set of values
                offset,           // offset in buffer
            );
            // this line says this attribute only changes for each 1 instance
            gl.vertexAttribDivisor(loc, 1);
        }
    }
    vertexBuffer.vao = vao
}

let currentViewMatrix = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
let currentProjectionMatrix = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]

function updateCamera(shadowMode,id){
    if (shadowMode){
        currentViewMatrix = rini.graphics.shadows.cascades[id].viewMatrix
        currentProjectionMatrix = rini.graphics.shadows.cascades[id].projectionMatrix
    }
    else{
        currentViewMatrix = rini.graphics.camera.viewMatrix
        currentProjectionMatrix = rini.graphics.camera.projectionMatrix
    }
}