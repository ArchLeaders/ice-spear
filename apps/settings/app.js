/**
* @copyright 2018 - Max Bebök
* @author Max Bebök
* @license GNU-GPLv3 - see the "LICENSE" file in the root directory
*/

const electron = require('electron');
const fs       = require('fs');
const path     = require('path');
const url      = require('url');
const Split    = require('split.js');
const Filter   = requireGlobal("lib/filter.js");

const {dialog} = electron.remote;
const BrowserWindow = electron.remote.BrowserWindow;

const App_Base = requireGlobal("./apps/base.js");
const File_Drop = requireGlobal("./lib/file_drop.js");

module.exports = class App extends App_Base
{
    constructor(window, args)
    {
        super(window, args);

        this.tabNodeTabs    = this.node.querySelector("#main-sidebar-left");
        this.tabNodeContent = this.node.querySelector("#main-sidebar-right");
        this.valueNodes = [];

        this.fileFilter = new Filter(this.tabNodeTabs.querySelector(".list-group-header input"), this.tabNodeTabs, ".list-group-item");

        let tabs = this.tabNodeTabs.querySelectorAll(".list-group-item");
        for(let tab of tabs)
        {
            tab.onclick = () => {
                
                for(let otherTab of tabs)
                    otherTab.classList.remove("active");

                tab.classList.add("active");

                let tabName = tab.getAttribute("data-tab");
                for(let tabContent of this.tabNodeContent.children)
                {
                    tabContent.hidden = tabContent.getAttribute("data-tab") != tabName;
                }
            };
        }

        document.addEventListener('drop',     e => e.preventDefault());
        document.addEventListener('dragover', e => e.preventDefault());

        let autoSaveNodes = this.node.querySelectorAll("[data-autoSave=true]");
        for(let node of autoSaveNodes)
        {
            node.onclick = () => this.save();
            node.onchange = () => this.save();
        }

        this.initDragDrop();
        this.initValues();
    }

    initDragDrop()
    {
        let dragNodes = this.node.querySelectorAll(".drag-drop-dir");
        for(let dragNode of dragNodes) {
            File_Drop.create(dragNode, () => this.save());
            dragNode.onchange = () => this.save();
        }
    }

    initValues()
    {
        this.valueNodes = this.node.querySelectorAll("input[data-configRef]");
        for(let node of this.valueNodes)
        {
            const nodeVal = this.config.getValue(node.getAttribute("data-configRef"));
            const nodeType = node.getAttribute("data-dataType");

            if(nodeType == "bool")
                node.checked = nodeVal;
            else
                node.value = nodeVal;
        }
    }

    save()
    {
        for(let node of this.valueNodes)
        {
            const configRef = node.getAttribute("data-configRef");
            const dataType = node.getAttribute("data-dataType") || "text";
            let configVal = null;

            if(dataType == "path") {
                node.value = node.value.trim().replace(/[\/\\]+$/g, '');
                configVal = node.value;
            }else if(dataType == "bool"){
                configVal = node.checked;
            }

            this.config.setValue(configRef, configVal);
        }
        this.config.save();
    }
};
