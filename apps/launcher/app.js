/**
* @copyright 2018 - Max Bebök
* @author Max Bebök
* @license GNU-GPLv3 - see the "LICENSE" file in the root directory
*/

const SARC = require("sarc-lib");

const electron = require('electron');
const fs       = require('fs');
const path     = require('path');
const url      = require('url');
const swal     = require('sweetalert2')
const Filter   = requireGlobal("lib/filter.js");
const Notify   = requireGlobal("lib/notify/notify.js");

const {dialog} = electron.remote;
const BrowserWindow = electron.remote.BrowserWindow;

const App_Base = requireGlobal("./apps/base.js");

module.exports = class App extends App_Base
{
    constructor(window, args)
    {
        super(window, args);
        var that = this;

        let appButtons = this.node.querySelectorAll(".button-open-app");

        for(let btn of appButtons)
        {
            btn.onclick = async () => 
            {
                let appName = btn.getAttribute("data-appName");
                if(appName != null)
                {
                    // @TODO open a world map here
                    if(appName == "field_editor")
                    {
                        const {value: section} = await swal({
                            title: "Field Section (e.g. I-3)<br/>@TODO show world-map instead",
                            type: 'question',
                            input: 'text',
                            showCloseButton: true,
                            showCancelButton: true,
                            cancelButtonText: 'Cancel',
                            confirmButtonText: 'Open',
                        });

                        if(section)
                            this.windowHandler.open(appName, {section});
                    }else{
                        this.windowHandler.open(appName);
                    }
                }
            };
        }

        this.selectShrine = this.node.querySelector("select.shrineList");
        this.selectModel  = this.node.querySelector("select.modelList");

        this.selectShrine.ondblclick = function(a,b) 
        {
            if(this.value != null)
                that.windowHandler.open("shrine_editor", {file: this.value});
        };

        this.selectModel.ondblclick = function(a,b) 
        {
            if(this.value != null)
                that.windowHandler.open("bfres_editor", {file: this.value});
        };

        this.shrineFilter = new Filter(this.node.querySelector(".shrine input"), this.selectShrine, "option", null);
        this.modelFilter  = new Filter(this.node.querySelector(".model  input"), this.selectModel,  "option", null);

        this.clear();
    }

    clear()
    {
    }

    async openProject()
    {
        let projectNames;
        try{
            projectNames = await this.project.listProjectNames();
        } catch(e) {
            console.error(e);
        }

        if(!Array.isArray(projectNames) || projectNames.length == 0) {
            Notify.info(`You don't have any Projects!`);
            return false;
        }

        const {value: projectName} = await swal({
            title: "Select a project",
            type: 'question',
            input: 'select',
            inputOptions: new Map(projectNames.map((name) => [name, name])),
            showCloseButton: true,
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'Open',
        });
        
        if(projectName) 
        {
            if(this.project.open(projectName))
            {
                Notify.success(`Project '${projectName}' opened`);
                return true;
            }
            Notify.error(`Error opening '${projectName}'`);
        }

        return false;
    }

    async createProject()
    {
        const {value: projectName} = await swal({
            title: "What's your new project called?",
            type: 'question',
            input: 'text',
            showCloseButton: true,
            showCancelButton: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'Create',
        });

        if(projectName) 
        {
            try {
                await this.project.create(projectName);
            } catch(e) {
                console.error(e);
                Notify.error(`Error creating project!`);
                return false;
            }

            Notify.success(`Project '${projectName}' created and opened!`);
            this.project.open(projectName);
        }

        return true;
    }

    async scanShrineDir()
    {
        const shrineRegex = /^Dungeon[0-9]{3}\.pack$/;
        let shrineDir = this.config.getValue("game.path") + "/content/Pack";
        
        let files = fs.readdir(shrineDir, (err, files) => 
        {
            if(files == null)return;
            let shrinesHtml = "";

            files.forEach(file => {
                if(shrineRegex.test(file)){
                    shrinesHtml += `<option value="${shrineDir + "/" + file}">${file}</option>`;
                }
            });
            this.selectShrine.innerHTML = shrinesHtml;
        });
    }

    async scanModelTextureDir()
    {
        let modelDir = this.config.getValue("game.path") + "/content/Model";

        let files = fs.readdir(modelDir, (err, files) => 
        {
            if(files == null)return;

            let modelsHtml = "";
            let texHtml = "";
            files.forEach(file => {
               // if(!file.includes(".Tex1") && !file.includes(".Tex2")) // @TODO make that an option
                    modelsHtml += `<option value="${modelDir + "/" + file}">${file}</option>`;
            });
            this.selectModel.innerHTML = modelsHtml;
        });
    }

    async run()
    {
        await super.run();
        
        this.scanShrineDir();
        this.scanModelTextureDir();
    }

};
