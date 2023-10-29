<script lang="ts">
    import copy from 'copy-to-clipboard';
    import type {App} from 'obsidian';
    import {TFile, TFolder, Vault} from 'obsidian';
    import type {Settings} from '../index';
    import Notify from 'simple-notify';
    import 'simple-notify/dist/simple-notify.min.css';
    import '../assets/notify.css';

    export let app: App;
    export let settings: Settings;
    export let openUploader: Function;
    export let onCloseUploader: Function;
    type FileTypes = 'image' | 'video' | 'audio' | 'document' | 'other';

    type FilterTypes = 'all' | 'images' | 'videos' | 'audios' | 'documents';
    let filterType: FilterTypes;
    const files: Array<{ file: TFile, type: FileTypes }> = [];
    const limit = 100;
    let totalCount = 0;
    let page = 1;
    let offset = 0;
    let start = 1;
    $: start = Math.min(offset + 1, totalCount);
    let end = 1;
    $: end = Math.min(offset + limit, totalCount);
    let lastPage = Math.max(Math.ceil(totalCount / limit), 1);

    const IMAGE_EXTENSIONS = ['png', 'jpeg', 'jpg', 'bmp', 'gif', 'webp'];
    const VIDEO_EXTENSIONS = ['avi', 'mpg', 'mpeg', 'mkv', 'ogg', 'webm'];
    const AUDIO_EXTENSIONS = ['mp3'];
    const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];

    function getFileType(file: TFile): FileTypes {
        if (IMAGE_EXTENSIONS.includes(file.extension)) {
            return 'image'
        } else if (VIDEO_EXTENSIONS.includes(file.extension)) {
            return 'video'
        } else if (AUDIO_EXTENSIONS.includes(file.extension)) {
            return 'audio'
        } else if (DOCUMENT_EXTENSIONS.includes(file.extension)) {
            return 'document'
        }

        return 'other';
    }

    function checkFilters(fileType: FileTypes): boolean {
        return (
            filterType === 'all'
            || (filterType === 'images' && fileType === 'image')
            || (filterType === 'videos' && fileType === 'video')
            || (filterType === 'audios' && fileType === 'audio')
            || (filterType === 'documents' && fileType === 'document')
        );
    }

    function readFiles(): void {
        totalCount = 0;
        files.length = 0;
        const folder = app.vault.getAbstractFileByPath(settings.folder);

        if (folder instanceof TFolder) {
            Vault.recurseChildren(folder, (file): void => {
                if (file instanceof TFile) {
                    const type = getFileType(file);

                    if (checkFilters(type)) {
                        if (totalCount >= offset && files.length < limit) {
                            files.push({file, type});
                        }

                        totalCount++;
                    }
                }
            });
        }
    }

    function setFilterType(type: FilterTypes): void {
        filterType = type;
        readFiles();
    }

    function changePage(dir: number): void {
        page = Math.max(Math.min(page + dir, Math.ceil(totalCount / limit)), 1);
        offset = (page - 1) * limit;
        readFiles();
    }

    function prev() {
        changePage(-1);
    }

    function next() {
        changePage(1);
    }

    function showFile(file: TFile): void {
        app.workspace.openLinkText('', file.path, true, {active: true});
    }

    function copyToClipboard(file: TFile): void {
        const config = {
            position: 'x-center top',
            effect: 'slide',
            showIcon: false,
        };

        if (copy(file.path)) {
            Object.assign(config, {
                status: 'success',
                text: 'Copied to clipboard!',
                customClass: 'ml-notify--success',
                autoclose: true,
                autotimeout: 1000,
            });
        } else {
            Object.assign(config, {
                status: 'error',
                text: 'Failed to copy to clipboard!',
                customClass: 'ml-notify--error',
            });
        }

        new Notify(config);
    }

    onCloseUploader(() => readFiles());
    setFilterType('all');
</script>

<div class="ml-toolbar">
    <button class="ml-button"
            on:click={() => setFilterType('all')}
            class:ml-button--active={filterType === 'all'}>
        ALL
    </button>

    <button class="ml-button"
            on:click={() => setFilterType('images')}
            class:ml-button--active={filterType ==='images'}>
        Images
    </button>

    <button class="ml-button"
            on:click={() => setFilterType('videos')}
            class:ml-button--active={filterType === 'videos'}>
        Videos
    </button>

    <button class="ml-button"
            on:click={() => setFilterType('audios')}
            class:ml-button--active={filterType === 'audios'}>
        Audio
    </button>

    <button class="ml-button"
            on:click={() => setFilterType('documents')}
            class:ml-button--active={filterType === 'documents'}>
        Documents
    </button>

    <button class="ml-button"
            style="margin-inline-start: 1rem;" on:click={() => openUploader()}>
        Upload
    </button>
</div>

{#if totalCount > 0}
    <div style="display: flex; align-items: center; gap: var(--size-4-1); margin-bottom: var(--size-4-2);">
        {#if files.length < totalCount}
            <button class="ml-button" on:click={prev} disabled={page === 1}>◀️</button>
            <button class="ml-button" on:click={next} disabled={page === lastPage}>▶️</button>
        {/if}
        <span style="padding-left: var(--size-4-2);">
            Showing <strong>{start}</strong>–<strong>{end}</strong> of <strong>{totalCount}</strong> files.
        </span>
    </div>
{/if}

<div class="ml-content">
    {#each files as item, index}
        <div class="ml-item" on:click={() => showFile(item.file)}>
            <div class="ml-item__image">
                {#if item.type === 'image'}
                    <img src={app.vault.getResourcePath(item.file)} alt="{item.file.basename}">
                {:else}
                    {item.file.extension}
                {/if}
                <div class="ml-action-copy" on:click|stopPropagation={() => copyToClipboard(item.file)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"
                         fill="currentColor">
                        <path
                            d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                        <path
                            d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                    </svg>
                </div>
            </div>
            <div class="ml-item__label" title={item.file.basename}>
                {item.file.basename}
            </div>
        </div>
    {/each}
</div>

<style>
    .ml-toolbar {
        display: flex;
        gap: var(--size-4-1);
        padding-bottom: var(--size-4-4);
        margin-bottom: var(--size-4-4);
        border-bottom: var(--border-width) solid var(--background-modifier-border);
    }

    .ml-button:hover {
        background-color: var(--interactive-hover);
    }

    .ml-button.ml-button--active {
        background-color: var(--interactive-accent);
    }

    .ml-button.ml-button--active:hover {
        background-color: var(--interactive-accent-hover);
    }

    .ml-content {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }

    .ml-content:empty {
        display: block;
    }

    .ml-content:empty:after {
        content: "No files found";
        display: block;
        text-align: center;
    }

    .ml-item {
        position: relative;
        cursor: pointer;
    }

    .ml-item__image {
        border: var(--border-width) solid var(--background-modifier-border);
        border-radius: var(--radius-m);
        aspect-ratio: 1;
        background-color: var(--background-secondary);
        overflow: hidden;
        font-size: var(--font-ui-large);
        display: flex;
        justify-content: center;
        align-items: center;
        text-transform: uppercase;
        position: relative;
    }

    .ml-item__image > img {
        object-fit: cover;
        object-position: center;
        width: 100%;
        height: 100%;
    }

    .ml-item__label {
        width: 100%;
        margin: 0 var(--size-4-1);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: var(--font-smaller);
        text-align: center;
    }

    .ml-action-copy {
        display: none;
        width: 2.25rem;
        aspect-ratio: 1;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: var(--text-on-accent);
        background-color: var(--interactive-accent);
    }

    .ml-item__image:hover .ml-action-copy {
        display: grid;
        place-content: center;
        z-index: 10;
    }

    .ml-item__image:hover .ml-action-copy:hover {
        background-color: var(--interactive-accent-hover);
    }

    .ml-item__image:before {
        content: '';
        position: absolute;
        inset: 0;
        background-color: var(--background-primary);
        opacity: 0;
    }

    .ml-item__image:hover:before {
        opacity: 0.5;
    }
</style>
