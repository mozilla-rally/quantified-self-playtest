<script>
    import { fly } from 'svelte/transition';
    import NamespaceGrid from '../components/NamespaceGrid.svelte';
    import NamespaceControls from "../components/NamespaceControls.svelte";
    import CheapDialog from '../components/CheapDialog.svelte';

    let namespaces = [
        {name: "attention", size: 5610},
        {name: "tabs", size: 1},
        {name: "twitter", size: 0},
        {name: "content", size: 1530}
    ];

    let confirm = undefined;
    const volumeFormatter = new Intl.NumberFormat();
</script>

{#if confirm}
<div transition:fly={{y: 2.5, duration: 100 }}>
    <CheapDialog on:escape={() => { confirm = undefined; }}>
        <svelte:fragment slot="title">
            🗑️ Clear all data for {confirm.name}?
        </svelte:fragment>
        <svelte:fragment slot="body">
            This will clear {volumeFormatter.format(confirm.size)} entr{#if confirm.size === 1}y{:else}ies{/if} the data from this collection.
            You can't undo this operation, so proceed carefully!
        </svelte:fragment>
        <svelte:fragment slot='cta'>
            <button class="btn-secondary" on:click={() => { confirm = undefined;  }}>cancel</button>
            <button class="btn-alarm" on:click={() => { 
                namespaces[confirm.index].size = 0;
                confirm = undefined; }}>clear data</button>
        </svelte:fragment>
    </CheapDialog>
</div>
{:else}
    <div transition:fly={{y:2.5, duration: 100 }}>
        <div style="position: absolute;">
            <NamespaceGrid>
                {#each namespaces as { name, size }, index (name)}
                    <NamespaceControls on:clear={() => { confirm = { name, size, index }; }} on:download={console.log} {name} {size} />    
                {/each}
            </NamespaceGrid>
        </div>
    </div>
{/if}
