<template>
  <q-page class="q-pa-md">
    <q-item
      clickable
      :to="{ name: 'webrtc1' }"
    >
      <q-item-section>
        <q-item-label>WebRTC1</q-item-label>
        <q-item-label caption>Paytaca Implementation</q-item-label>
      </q-item-section>
    </q-item>
    <q-item
      clickable
      :to="{ name: 'webrtc2' }"
    >
      <q-item-section>
        <q-item-label>WebRTC2</q-item-label>
        <q-item-label caption>Another version with different handshake protocol</q-item-label>
      </q-item-section>
    </q-item>
    <q-item
      clickable
      :to="{ name: 'local-stream-test' }"
    >
      <q-item-section>
        <q-item-label>Local Stream Test</q-item-label>
        <q-item-label caption>Test media stream</q-item-label>
      </q-item-section>
    </q-item>
  </q-page>
</template>
<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'IndexPage',
})
</script>
