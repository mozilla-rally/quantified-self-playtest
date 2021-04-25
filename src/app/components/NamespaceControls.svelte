<script>
    import { createEventDispatcher } from 'svelte';
    export let name;
    export let size;
    const dispatch = createEventDispatcher();

    const volumeFormatter = new Intl.NumberFormat();
</script>

<div class='align-left'>
    {name}
</div>
<div class='as-number'>
    {#if size}
        {volumeFormatter.format(~~size)}
    {:else}
        <span class='no-data'>no data</span>
    {/if}
</div>
<div>
    <button disabled={size === 0} on:click={() => { dispatch("clear", name); }} class='btn-secondary'>🗑️ clear</button>
</div>
<div>
    <button disabled={size === 0} on:click={() => { dispatch("download", name); }}>{#if size === 0}😴{:else}🥳{/if} download</button>
</div>