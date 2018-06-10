module.exports = class Actor_Editor
{   
    /**
     * @param {Actor_Handler} actorHandler 
     */
    constructor(shrineRenderer, actorHandler)
    {
        this.actorHandler = actorHandler;
        this.shrineRenderer = shrineRenderer;

        this.selectedActors = [];
        this.actorAdded = false;

        this.eventEmitter = this.shrineRenderer.renderer.getSelectorEventEmitter();
        this.eventEmitter.on("select", (...data) => { this.eventActorSelected(...data); });
        this.eventEmitter.on("move",   (...data) => { this.eventActorMove(...data);     });

        this.eventEmitter.on("end", () => { this.actorAdded = false; });
    }

    update()
    {

    }

    async addActor(name, params)
    {        
        const actor = await this.actorHandler.addActor(name, params);
    }

    eventActorSelected(objects, isMouseUp, mouseMoved)
    {
        if(objects.length == 0) 
        {
            this._resetSelection();
        }else{
            const selObj = objects[0];
            const actor = this._findActorByModel(selObj.object);

            if(actor)
            {
                if(!isMouseUp)
                {
                    if(!this.selectedActors.includes(actor))
                    {
                        this._addToSelection(actor);
                    }
                }else if(!mouseMoved && !this.actorAdded && this.selectedActors.includes(actor))
                {
                    this._removeFromSelection(actor);    
                }
            }
            else if(isMouseUp && !mouseMoved)
            {
                this._resetSelection();
            }
        }
    }

    eventActorMove(ev, camera)
    {
        if(this.selectedActors.length == 0)
            return;

        const speedMulti = 0.02;
        let speedVec;
        if(ev.shiftKey)
        {
            speedVec = { y: -ev.movementY * speedMulti };
        }else{
            const moveVec = new THREE.Vector2(ev.movementX, -ev.movementY);            
            moveVec.rotateAround(new THREE.Vector2(0.0, 0.0), camera.rotation.y % (Math.PI * 2));

            speedVec = {
                x: moveVec.x * speedMulti,
                z: -moveVec.y * speedMulti
            };
        }

        for(const actor of this.selectedActors)
        {
            actor.move(speedVec);
        }
    }

    _resetSelection()
    {
        for(const actor of this.selectedActors)
            this._deSelectActor(actor);

        this.selectedActors = [];
    }

    _addToSelection(actor)
    {
        console.log(actor);

        this.selectedActors.push(actor);
        actor.object.setColor(0xff4444);
        this.actorAdded = true;
    }

    _removeFromSelection(actor)
    {
        const idx = this.selectedActors.indexOf(actor);
        if(idx > -1) 
        {
            this.selectedActors.splice(idx, 1);
            this._deSelectActor(actor);
        }
    }

    _deSelectActor(actor)
    {
        actor.object.setColor(0xFFFFFF);   
    }

    /**
     * scans through all parent elements until a actor was found or the end was reached
     * @param {*} model 
     * @returns {Actor|undefined}
     */
    _findActorByModel(model) // @TODO move actor logic out of here
    {
        if(model.userData && model.userData.actor)
            return model.userData.actor;
        
        if(model.parent)
            return this._findActorByModel(model.parent);
    }
};