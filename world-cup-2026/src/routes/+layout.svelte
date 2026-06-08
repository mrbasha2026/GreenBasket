<script>
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href="/wc2026-logo-official.svg" />
</svelte:head>

{@render children()}
