/**
 * FF Typescript Foundation Library
 * Copyright 2019 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { Dictionary } from "@ff/core/types";
import uniqueId from "@ff/core/uniqueId";

import CustomElement, { customElement, property, html, PropertyValues, TemplateResult, repeat } from "./CustomElement";

////////////////////////////////////////////////////////////////////////////////

export { customElement, property, html, PropertyValues, TemplateResult };

export interface ITreeNode extends Dictionary<any>
{
    id?: string;
    children?: ITreeNode[];
    selected?: boolean;
    expanded?: boolean;
}

@customElement("ff-tree")
export default class Tree<T extends ITreeNode = ITreeNode> extends CustomElement
{
    static readonly dragDropMimeType: string = "application/x-ff-tree-node";

    @property({ attribute: false })
    root: T = null;

    @property({ type: Boolean })
    includeRoot = false;

    @property({ type: Boolean })
    draggable = false;

    private _nodeById: Dictionary<T> = {};
    private _idByNode: Map<T, string> = new Map();
    private _containerId = uniqueId(4);

    constructor(root?: T)
    {
        super();
        this.root = root;
    }

    toggleSelected(treeNode: T)
    {
        this.setSelected(treeNode, undefined);
    }

    //Raq - CHANGED attribute to "aria-selected"
    setSelected(treeNode: T, state: boolean)
    {
        const id = this._idByNode.get(treeNode);
        if (id) {
            const nodeElement = document.getElementById(id);
            if (state === undefined) {
                state = !nodeElement.hasAttribute("selected");
            }

            if (state) {
                nodeElement.setAttribute("selected", "");
                nodeElement.setAttribute("aria-selected", "true");
            }
            else {
                nodeElement.removeAttribute("selected");
                nodeElement.setAttribute("aria-selected", "false");
            }
        }
    }

    isSelected(treeNode: T)
    {
        const id = this._idByNode.get(treeNode);
        if (id) {
            const nodeElement = document.getElementById(id);
            return nodeElement.hasAttribute("selected");
        }

        return false;
    }

    toggleExpanded(treeNode: T)
    {
        this.setExpanded(treeNode, undefined);
    }

    //RAQ - CHANGED setAttribute to aria-expanded
    setExpanded(treeNode: T, state: boolean)
    {
        const id = this._idByNode.get(treeNode);
        if (id) {
            const nodeElement = document.getElementById(id);
            if (state === undefined) {
                state = !nodeElement.hasAttribute("expanded");
            }

            if (state) {
                nodeElement.setAttribute("expanded", "");
                nodeElement.setAttribute("aria-expanded", "true");
            }
            else {
                nodeElement.removeAttribute("expanded");
                nodeElement.setAttribute("aria-expanded", "false");
            }
        }
    }

    isExpanded(treeNode: T)
    {
        const id = this._idByNode.get(treeNode);
        if (id) {
            const nodeElement = document.getElementById(id);
            return nodeElement?.hasAttribute("expanded");
        }

        return false;
    }

    protected firstConnected()
    {
        this.classList.add("ff-tree");
        this.setAttribute("role", "tree");
        this.setAttribute("tabindex", "-1");

        if (this.draggable) {
            this.addEventListener("dragstart", this.onDragStart.bind(this));
            this.addEventListener("dragover", this.onDragOver.bind(this));
            this.addEventListener("dragenter", this.onDragEnter.bind(this));
            this.addEventListener("dragleave", this.onDragLeave.bind(this));
            this.addEventListener("drop", this.onDrop.bind(this));
        }
    }

    protected render()
    {
        this._nodeById = {};
        this._idByNode.clear();

        const root = this.root;
        if (!root) {
            return html``;
        }

        if (this.includeRoot) {
            const id = this.getId(root) + this._containerId;
            return this.renderNode(root, id, 0);
        }
        else {
            const children = this.getChildren(root);
            if (children.length > 0) {
                return this.renderNodeChildren(root, children, 0);
            }
            else {
                return html``;
            }
        }
    }

    protected getId(treeNode: T): string
    {
        return treeNode.id || uniqueId();
    }

    protected getClasses(treeNode: T): string
    {
        return "";
    }

    protected getChildren(treeNode: T): any[] | null
    {
        return treeNode.children || null;
    }

    protected isNodeSelected(treeNode: T): boolean
    {
        return !!treeNode.selected;
    }

    protected isNodeExpanded(treeNode: T): boolean
    {
        return treeNode.expanded !== undefined ? treeNode.expanded : true;
    }

    protected renderNodeHeader(treeNode: T): TemplateResult | string
    {
        return treeNode.toString();
    }

    protected renderNodeContent(treeNode: T, children: T[] | null, level: number): TemplateResult | string
    {
        return this.renderNodeChildren(treeNode, children, level);
    }

    protected renderNodeChildren(treeNode: T, children: T[] | null, level: number): TemplateResult
    {
        if (!children || children.length === 0) {
            return null;
        }

        let id;

        return html`
            ${repeat(children, child => (
                id = this.getId(child) + this._containerId), child => this.renderNode(child, id, level))}
        `;
    }

    protected renderNode(treeNode: T, id: string, level: number): TemplateResult
    {
        this._nodeById[id] = treeNode;
        this._idByNode.set(treeNode, id);

        const children = this.getChildren(treeNode);
        
        const selected = this.isNodeSelected(treeNode);
        const expanded = this.isNodeExpanded(treeNode);

        const typeClass = children && children.length > 0 ? "ff-inner " : "ff-leaf ";
        const levelClass = level % 2 === 0 ? "ff-even " : "ff-odd ";
        const levelStep = "level-" + level.toString() + " "; //testing the level of the node
        let classes = "ff-tree-node " + typeClass + levelClass + this.getClasses(treeNode);

        const headerClasses = "ff-header " + levelStep;

        const header = this.renderNodeHeader(treeNode);
        // const headerName = this.getName(treeNode);
        const content = this.renderNodeContent(treeNode, children, level + 1);

        // const headerHTML = this.draggable ?
        //     html`<div class="ff-header" draggable="true" @click=${this.onClick} @dblclick=${this.onDblClick}
        //         @dragstart=${this.onDragStart} @dragover=${this.onDragOver} @drop=${this.onDrop}
        //         @dragenter=${this.onDragEnter} @dragleave=${this.onDragLeave}>${header}</div>` :
        //     html`<div class="ff-header" @click=${this.onClick} @dblclick=${this.onDblClick}>${header}</div>`;


        /**Raq Notes:
         * Camera & Lights that are created are rendering as HEADERS
         * Lights & Models do functionality when clicked by a mouse but not when tabbed into by a keyboard
         * 
         * ff-button text="" icon=""
         * ${header}
         * @keydown.enter=${this.onEnter} - create a function?
         * 
         * Semantics recommended for an Accordion Pattern:
         * <div class="ff-tree-node-container">
                <div class=${classes} id=${id} ?selected=${selected} ?expanded=${expanded}>
                    <h4>
                        <button class="ff-header" draggable="true"
                            @click=${this.onClick} @dblclick=${this.onDblClick}  aria-expanded="true">${headerName}</button>
                    </h4>
                    <div class="ff-content">${content}</div>
                </div>
            </div>

            original one
             <div class="ff-tree-node-container">
                <li role="treeitem" class=${classes} id=${id} ?selected=${selected} ?expanded=${expanded} tabindex="0"> 
                    <div class="ff-header" draggable="true"
                            @click=${this.onClick} @dblclick=${this.onDblClick}>${header}</div>
                    <div class="ff-content">${content}</div>
                </li>
            </div>

            GENERATE A CLICK FROM A KEYDOWN EVENT (COPY THE CODE FROM FF-BUTTON TO SIMULATE A CLICK. IF CLICK IS SIMULATED, CALL THE ONCLICK FUNCTION)
            @keydown=${this.onKeyDown}
         */
        return html`
            <div class="ff-tree-node-container">
                <div role="treeitem" class=${classes} id=${id} ?selected=${selected} ?expanded=${expanded} aria-expanded="true" aria-selected="false">
                    <div class=${headerClasses} draggable="true"
                        @click=${this.onClick} @dblclick=${this.onDblClick} @keydown=${this.onKeyDown} tabindex="0">${header}</div>
                    <div class="ff-content" role="group">${content}</div>
                </div>
            </div>
        `;
    }

    protected onKeyDown(event: KeyboardEvent)
    {   
        console.log("made it into the function onKeyDown! Key Pressed: " + event.code.toString());

        const treeNode = this.getNodeFromEventTarget(event);
        //event codes based on the keyboard event code values
        if (event.code === "Space" || event.code === "Enter") {

            console.log("made it inside of Enter/Space if statement!");
            
            event.preventDefault();        
            console.log("inside of Enter/Space key, AFTER dispatching a mouse event");

        this.onNodeKeyDown(event, treeNode);
        
        }
    //     if (event.code === "ArrowUp") {

    //     }
    //     if (event.code === "ArrowDown") {

    //     }
    //     if (event.code === "ArrowLeft") {

    //     }
        if (event.code === "ArrowRight") {
            console.log("reached here once ArrowRight was pressed!");
            event.preventDefault();

            if (this.isExpanded(treeNode))
            {
                //if the node is alreadylibs/ff-ui/source/Tree.ts expanded - go to the first node
            }
            else
            {
                //expand the node
                this.toggleExpanded(treeNode);
            }


        }
        if (event.code === "Home") {
            //shift focus to the node that has role="tree"
            console.log("reached here once home button was pressed!");
            event.preventDefault(); //prevents home button from performing its default function

            const treeNodeByClass = document.getElementsByClassName("level-0")[0] as HTMLElement; //for TESTING to make sure it works
            const treeNodeByRole = document.querySelector('[role="tree"]') as HTMLElement; //go to the first element with the role="tree" - should be the current active one? 
            //does this work if the navigation panel is open and we are in the task menu? (test it!)
            //it DOES select the tree in the navigation panel - find a way to select the CURRENT tree            

            console.log(treeNodeByClass);

            treeNodeByClass.focus();
        }
        // if (event.code === "End") {
        //     //shift focus to the node that has role="tree"
        // } 
    }

    // protected visible ()
    // {

    // }
    
    // protected isExpandable(treeNode: T)
    // {
    //     return treeNode.hasAttribute("aria-expanded");
    // }

    protected onDragStart(event: DragEvent)
    {
        const treeNode = this.getNodeFromEventTarget(event);

        if (treeNode && this.onNodeDragStart(event, treeNode)) {
            event.dataTransfer.setData(Tree.dragDropMimeType, this.getId(treeNode));
        }
        else {
            event.preventDefault();
        }
    }

    protected onDragEnter(event: DragEvent)
    {
        let treeNode = this.getNodeFromEventTarget(event);

        if (treeNode && this.canDrop(event, treeNode)) {
            this.onNodeDragEnter(event, treeNode);
        }
    }

    protected onDragOver(event: DragEvent)
    {
        const treeNode = this.getNodeFromEventTarget(event);

        if (treeNode && this.canDrop(event, treeNode)) {
            if (this.onNodeDragOver(event, treeNode)) {
                event.preventDefault();
            }
        }
    }

    protected onDragLeave(event: DragEvent)
    {
        const treeNode = this.getNodeFromEventTarget(event);

        if (treeNode && this.canDrop(event, treeNode)) {
            this.onNodeDragLeave(event, treeNode);
        }
    }

    protected onDrop(event: DragEvent)
    {
        const treeNode = this.getNodeFromEventTarget(event);

        if (treeNode && this.canDrop(event, treeNode)) {
            this.onNodeDrop(event, treeNode);
            event.stopPropagation();
        }

        event.preventDefault();
    }

    protected onClick(event: MouseEvent)
    {
        const treeNode = this.getNodeFromEventTarget(event);

        if (treeNode) {
            this.onNodeClick(event, treeNode);
        }

        event.stopPropagation();
    }

    protected onDblClick(event: MouseEvent)
    {
        const treeNode = this.getNodeFromEventTarget(event);

        if (treeNode) {
            this.onNodeDblClick(event, treeNode);
        }

        event.stopPropagation();
    }

    /**
     * Test whether the payload of the given drag event can be dropped onto the given tree node.
     * The tree node may be null, indicating a drop onto the "empty" area below the tree.
     * @param event
     * @param targetTreeNode
     */
    protected canDrop(event: DragEvent, targetTreeNode: T): boolean
    {
        return !!event.dataTransfer.types.find(type => type === Tree.dragDropMimeType);
    }

    protected onNodeDragStart(event: DragEvent, sourceTreeNode: T)
    {
        return true;
    }

    protected onNodeDragOver(event: DragEvent, targetTreeNode: T)
    {
        return true;
    }

    protected onNodeDragEnter(event: DragEvent, targetTreeNode: T)
    {
        const element = this.getElementByNode(targetTreeNode);
        element.classList.add("ff-drop-target");
    }

    protected onNodeDragLeave(event: DragEvent, targetTreeNode: T)
    {
        const element = this.getElementByNode(targetTreeNode);
        element.classList.remove("ff-drop-target");
    }

    protected onNodeDrop(event: DragEvent, targetTreeNode: T)
    {
        const element = this.getElementByNode(targetTreeNode);
        element.classList.remove("ff-drop-target");
    }

    protected onNodeClick(event: MouseEvent, treeNode: T)
    {
        this.toggleExpanded(treeNode);
    }

    protected onNodeDblClick(event: MouseEvent, treeNode: T)
    {
    }

    protected onNodeKeyDown(even: KeyboardEvent, treeNode: T) 
    {
        //this.toggleExpanded(treeNode);
    }

    protected getNodeFromEventTarget(event: Event): T | null
    {
        let target = event.target as HTMLElement;

        while(target && !target.classList.contains("ff-tree-node")) {
            target = target === this ? null : target.parentElement;
        }

        return target && this._nodeById[target.id];
    }

    protected getElementByNode(treeNode: T)
    {
        const id = this._idByNode.get(treeNode);
        return id && document.getElementById(id) as HTMLDivElement;
    }
}
