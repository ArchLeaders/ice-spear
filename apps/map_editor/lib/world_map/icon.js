/**
* @copyright 2018 - Max Bebök
* @author Max Bebök
* @license GNU-GPLv3 - see the "LICENSE" file in the root directory
*/

const path = require('path');
const fs = require('fs-extra');

const PicoGL = require("picogl");

module.exports = class Icon
{
    constructor(engine)
    {
        this.engine = engine;
        this.glApp = this.engine.getApp();

        this.selectionBuffer = undefined;
        this.selectionVertexBuffer = undefined;

        this.iconMap = new Map();
        this.radius = 0.022;
    }

    getIcons()
    {
        return this.iconMap;
    }

    getRadius()
    {
        return this.radius;
    }

    selectIcon(icon, val, update = true)
    {
        if(icon.index < 0 || icon.index >= this.selectionBuffer.length)
            return;

        this.selectionBuffer[icon.index] = Math.min(val, 1.0);
        this.updateSelectionBuffer(update);
    }

    deselectAll(update = true)
    {
        this.selectionBuffer.fill(0.0);
        this.updateSelectionBuffer(update);
    }

    updateSelectionBuffer(update = true)
    {
        if(update)
            this.selectionVertexBuffer.data(this.selectionBuffer);
    }

    async createDrawCall(locations)
    {
        this.iconShrineBuffer = await fs.readFile(path.join(__BASE_PATH, "assets", "img", "map", "shrine.bin"));
    
        const posBuffer = this.glApp.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            -this.radius, -this.radius,  this.radius, -this.radius,
             this.radius,  this.radius, -this.radius,  this.radius,
        ]));

        const uvBuffer = this.glApp.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array([
            0.0, 0.0, 1.0, 0.0,
            1.0, 1.0, 0.0, 1.0,
        ]));

        const iconPosScale = 1.0 / 1000.0;
        const instPosArray = [];
        let index = 0;
        for(let entry of locations)
        {
            if(entry.Icon && entry.Icon.value == "Dungeon")
            {       
                const pos = {
                    x: entry.Translate.X.value * iconPosScale,
                    y: entry.Translate.Z.value * -iconPosScale
                };

                instPosArray.push(pos.x, pos.y);

                entry.index = index++;
                this.iconMap.set(entry, pos);
            }
        }

        this.selectionBuffer = new Float32Array(this.iconMap.size);
        this.selectionVertexBuffer = this.glApp.createVertexBuffer(PicoGL.FLOAT, 1, this.selectionBuffer);

        const instanceBuffer = this.glApp.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array(instPosArray));
        const idxBuffer      = this.glApp.createIndexBuffer(PicoGL.UNSIGNED_INT, 3, new Uint32Array([0, 1, 2, 2, 3, 0]));

        const iconVertexArray = this.glApp.createVertexArray()
            .indexBuffer(idxBuffer)
            .vertexAttributeBuffer(0, posBuffer)
            .vertexAttributeBuffer(1, uvBuffer)
            .instanceAttributeBuffer(2, instanceBuffer)
            .instanceAttributeBuffer(3, this.selectionVertexBuffer)
        ;

        const iconShrineTexture =  this.engine.createTexture(this.iconShrineBuffer, {x: 128, y:128}, {
            wrapS: PicoGL.CLAMP_TO_EDGE,
            wrapT: PicoGL.CLAMP_TO_EDGE,
            flipY: true
        });

        const drawCall = this.engine.createDrawCall("icon", iconVertexArray, true)
            .texture("texColor", iconShrineTexture)
            .uniformBlock("globalUniforms", this.engine.getGlobalUniform());
/*
        setInterval(() => {
            const instanceBuffer = this.glApp.createVertexBuffer(PicoGL.FLOAT, 2, new Float32Array(this.pos));
            drawCall.currentVertexArray.instanceAttributeBuffer(2, instanceBuffer);
            drawCall.currentVertexArray.numInstances = 1;
            drawCall.numInstances = 1;
        }, 50);
*/
        console.log(drawCall);

        return drawCall;
    }
}