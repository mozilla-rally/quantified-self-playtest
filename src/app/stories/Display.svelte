<script>
    import Main from "../routes/Main.svelte";
    const namespaces = [
      {
        name: "tabs",
        size: 40
      },
      {
        name: "attention",
        size: 60
      }
    ]
;
</script>

<Main {namespaces} />
