/**
 * 3D Foundation Project
 * Copyright 2025 Smithsonian Institution
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Popup, { customElement, html } from "@ff/ui/Popup";

import "@ff/ui/Button";
import "@ff/ui/TextEdit";
import CVLanguageManager from "client/components/CVLanguageManager";
import { EDerivativeQuality, TDerivativeQuality } from "client/schema/model";
import CVModel2 from "client/components/CVModel2";
import Notification from "@ff/ui/Notification";

////////////////////////////////////////////////////////////////////////////////

@customElement("sv-import-menu")
export default class ImportMenu extends Popup
{
    protected url: string;
    protected languageManager: CVLanguageManager = null;
    protected filename: string = "";
    protected errorString: string = "";
    protected modelOptions: {name: string, id: string}[] = [];
    protected qualitySelection: EDerivativeQuality = null;
    protected parentSelection: {name: string, id: string} = null;

    static show(parent: HTMLElement, languageManager: CVLanguageManager, filename: string): Promise<[EDerivativeQuality, string]>
    {
        const menu = new ImportMenu(languageManager, filename);
        parent.appendChild(menu);

        return new Promise((resolve, reject) => {
            menu.on("confirm", () => resolve([menu.qualitySelection, menu.parentSelection.name]));
            menu.on("close", () => reject());
        });
    }

    constructor( languageManager: CVLanguageManager, filename: string )
    {
        super();

        this.languageManager = languageManager;
        this.filename = filename;
        this.modelOptions = this.modelOptions.concat(languageManager.getGraphComponents(CVModel2).map(model => ({name: model.node.name, id: model.id})));
        this.position = "center";
        this.modal = true;
        this.parentSelection = this.modelOptions.length > 0 ? this.modelOptions[0] : {name: "Model"+this.modelOptions.length.toString(), id: "-1"};

        this.url = window.location.href;
    }

    close()
    {
        this.dispatchEvent(new CustomEvent("close"));
        this.remove();
    }

    confirm()
    {
        if(this.qualitySelection === null) {
            this.errorString = this.languageManager.getUILocalizedString("Please select derivative quality.");
            this.requestUpdate();
        }
        else {
            this.dispatchEvent(new CustomEvent("confirm"));
            this.remove();
        }
    }

    protected firstConnected()
    {
        super.firstConnected();
        this.classList.add("sv-option-menu", "sv-import-menu");
    }

    protected renderQualityEntry(quality: EDerivativeQuality, index: number)
    {
        return html`<div class="sv-entry" @click=${e => this.onClickQuality(e, index)} ?selected=${ quality === this.qualitySelection }>
            ${EDerivativeQuality[quality] as TDerivativeQuality}
        </div>`;
    }

    protected renderParentEntry(option: string, index: number)
    {
        return html`<div class="sv-entry" @click=${e => this.onClickParent(e, index)} ?selected=${ option === this.parentSelection.name }>
            ${option}
        </div>`;
    }

    protected render()
    {
        const languageManager = this.languageManager;

        return html`
        <div>
            <div class="ff-flex-column ff-fullsize">
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-title">${languageManager.getUILocalizedString("File:")} <i>${this.filename}</i></div>
                    <ff-button icon="close" transparent class="ff-close-button" title=${languageManager.getUILocalizedString("Close")} @click=${this.close}></ff-button>
                </div>
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-header">${languageManager.getUILocalizedString("Select Derivative Quality:")}</div>
                </div>
                <div class="ff-splitter-section" style="flex-basis: 70%">
                    <div class="ff-scroll-y">
                        ${Object.keys(EDerivativeQuality).filter(key => typeof EDerivativeQuality[key] === 'number').map((key, index) => this.renderQualityEntry(EDerivativeQuality[key], index))}
                    </div>
                </div>
                <div class="ff-flex-row">
                    <div class="ff-flex-spacer ff-header">${languageManager.getUILocalizedString("Select Model:")}</div>
                </div>
                <div class="ff-splitter-section" style="flex-basis: 30%">
                    ${this.modelOptions.length > 0 ? html`<div class="ff-scroll-y">
                        ${this.modelOptions.map((option, index) => this.renderParentEntry(option.name, index))}
                    </div>` : html`<div class="ff-flex-row sv-centered sv-notification" style="height:100%; align-items:center">${languageManager.getUILocalizedString("No Models In Scene")}</div>`}
                </div>
                <div class="sv-entry" @click=${e => this.onClickParent(e, -1)} ?selected=${ "-1" === this.parentSelection.id }>
                    <div class="ff-flex-row">
                        <label class="ff-label ff-off">${languageManager.getUILocalizedString("Add New Model")}:</label>
                        <div class="ff-flex-spacer"></div>
                        <input id="modelName" tabindex="0" class="ff-property-field ff-input" @change=${this.onNameChange} value=${"Model"+this.modelOptions.length.toString()} touch-action="none" style="touch-action: none;" title="Parent.Name [string]"><div class="ff-fullsize ff-off ff-content"></div></input>
                    </div>
                </div>
                <div class="ff-flex-row sv-centered">
                    <ff-button icon="upload" class="ff-button ff-control" text=${languageManager.getUILocalizedString("Import Model")} title=${languageManager.getUILocalizedString("Import Model")} @click=${this.confirm}></ff-button>
                </div>
                <div class="ff-flex-row sv-centered sv-import-error-msg">
                    <div>${this.errorString}</div>
                </div>
            </div>
        </div>
        `;
    }

    protected onClickQuality(e: MouseEvent, index: number)
    {
        e.stopPropagation();

        this.qualitySelection = EDerivativeQuality[EDerivativeQuality[index]];
        this.requestUpdate();
    }

    protected onClickParent(e: MouseEvent, index: number)
    {
        e.stopPropagation();

        this.parentSelection = this.modelOptions[index] || {name: (this.querySelector("#modelName") as HTMLInputElement).value, id: "-1"};
        this.requestUpdate();
    }

    protected onNameChange() {
        this.parentSelection.name = (this.querySelector("#modelName") as HTMLInputElement).value;
    }
}
