<script lang="ts">
    import {onDestroy, onMount} from 'svelte';
    import type {App} from 'obsidian';
    import {TFolder} from 'obsidian';
    import type {Settings} from '../index';
    import Dropzone from 'dropzone';
    import 'dropzone/dist/dropzone.css';
    import '../assets/uploader.css';
    import {v1} from 'uuid';

    export let app: App;
    export let settings: Settings;

    let container;
    let dropzone;

    function getNewFilePath(file: File): string {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        let path = `${settings.folder}/${year}/${month}/${day}/${v1()}`;
        const parts = file.name.split('.');

        if (parts.length > 1) {
            path += '.' + parts.pop();
        }

        return path;
    }

    function upload(file: File): void {
        const reader = new FileReader();

        reader.addEventListener('load', () => {
            const filePath = getNewFilePath(file);
            const parts = filePath.split('/');
            parts.pop();
            const folderPath = parts.join('/');

            if (app.vault.getAbstractFileByPath(folderPath) instanceof TFolder) {
                app.vault.createBinary(filePath, reader.result);
            } else {
                app.vault.createFolder(folderPath).then(() => {
                    app.vault.createBinary(filePath, reader.result);
                });
            }
        });

        reader.readAsArrayBuffer(file);
    }

    onMount(() => {
        dropzone = new Dropzone(container, {
            url: '/',
            autoProcessQueue: false,
            autoQueue: false,
            maxFilesize: 0,
            addedfiles(files) {
                [...files].filter(file => file instanceof File).forEach(file => upload(file));
            },
        });
    });

    onDestroy(() => {
        dropzone?.destroy();
    });
</script>

<h4>Upload files</h4>

<div class="ml-uploader dropzone" bind:this={container}></div>

<style>
    .ml-uploader {
        position: relative;
        min-height: min(90vh, 400px);
        border: var(--border-width) dashed var(--background-modifier-border);
    }
</style>
