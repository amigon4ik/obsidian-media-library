import {ItemView, Plugin, WorkspaceLeaf} from 'obsidian';
import MediaLibrary from './ui/MediaLibrary.svelte';

const MEDIA_LIBRARY_VIEW_TYPE = 'media-library-view';

class MediaLibraryView extends ItemView {
    component: MediaLibrary;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }

    getViewType() {
        return MEDIA_LIBRARY_VIEW_TYPE;
    }

    getDisplayText() {
        return 'Media Library';
    }

    async onOpen() {
        this.component = new MediaLibrary({
            target: this.contentEl,
            props: {app: this.app},
        });
    }

    async onClose() {
        this.component?.$destroy();
    }
}

export default class MediaLibraryPlugin extends Plugin {
    async onload() {
        this.registerView(MEDIA_LIBRARY_VIEW_TYPE, (leaf: WorkspaceLeaf) => {
            return new MediaLibraryView(leaf);
        });

        this.addRibbonIcon('file-image', 'Open Media Library', async () => {
            const leaf = this.app.workspace.getLeaf(true);
            this.app.workspace.setActiveLeaf(leaf);
            await leaf.setViewState({type: MEDIA_LIBRARY_VIEW_TYPE});
        });
    }
}
