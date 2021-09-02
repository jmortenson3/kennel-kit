<script lang="ts">
  export let booking: any;
</script>

<article>
  {booking.id}
  <code>
    <pre>
  {JSON.stringify(booking, null, 2)}
</pre>
  </code>
</article>
