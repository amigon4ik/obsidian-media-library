import {App, ItemView, Modal, Plugin, PluginSettingTab, Setting, WorkspaceLeaf} from 'obsidian';
import MediaLibrary from './ui/MediaLibrary.svelte';
import Uploader from './ui/Uploader.svelte';

const MEDIA_LIBRARY_VIEW_TYPE = 'media-library-view';

export interface Settings {
    folder: string;
}

const DEFAULT_SETTINGS: Settings = {
    folder: '',
};

const onCloseCallbacks: Array<() => void> = [];

class UploaderModal extends Modal {
    component: Uploader | null;

    private readonly settings: Settings;

    constructor(app: App, settings: Settings) {
        super(app);
        this.settings = settings;
    }

    onOpen() {
        const {contentEl: target} = this;
        const props = {app: this.app, settings: this.settings};
        this.component = new Uploader({target, props});
    }

    onClose() {
        this.component?.$destroy();
        this.component = null;

        while (onCloseCallbacks.length) {
            const callback = onCloseCallbacks.shift();

            if (callback) {
                callback();
            }
        }
    }
}

class MediaLibraryView extends ItemView {
    component: MediaLibrary | null;

    private readonly settings: Settings;

    constructor(leaf: WorkspaceLeaf, settings: Settings) {
        super(leaf);
        this.settings = settings;
    }

    getViewType() {
        return MEDIA_LIBRARY_VIEW_TYPE;
    }

    getDisplayText() {
        return 'Media Library';
    }

    async onOpen() {
        const {app, settings, contentEl: target} = this;
        const modal = new UploaderModal(this.app, this.settings);

        const props = {
            app,
            settings,
            openUploader(): void {
                modal.open();
            },
            onCloseUploader(callback: () => void): void {
                onCloseCallbacks.push(callback);
            },
        };

        this.component = new MediaLibrary({target, props});
    }

    async onClose() {
        this.component?.$destroy();
        this.component = null;
    }
}

class SettingTab extends PluginSettingTab {
    plugin: MediaLibraryPlugin;

    constructor(app: App, plugin: MediaLibraryPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const {containerEl} = this;
        containerEl.empty();
        containerEl.createEl('h2', {text: 'Media Library'});

        new Setting(containerEl)
            .setName('Folder')
            .setDesc('Choose the location where your media files will be stored and organized for easy access and management.')
            .addText(text => text
                .setPlaceholder('Enter your media folder')
                .setValue(this.plugin.settings.folder)
                .onChange(async (value) => {
                    this.plugin.settings.folder = value;
                    await this.plugin.saveSettings();
                }));
    }
}

export default class MediaLibraryPlugin extends Plugin {
    settings: Settings;

    async onload() {
        await this.loadSettings();

        this.registerView(MEDIA_LIBRARY_VIEW_TYPE, (leaf: WorkspaceLeaf) => {
            return new MediaLibraryView(leaf, this.settings);
        });

        this.addRibbonIcon('file-image', 'Open Media Library', async () => {
            const leaf = this.app.workspace.getLeaf(true);
            this.app.workspace.setActiveLeaf(leaf);
            await leaf.setViewState({type: MEDIA_LIBRARY_VIEW_TYPE});
        });

        this.addSettingTab(new SettingTab(this.app, this));
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
