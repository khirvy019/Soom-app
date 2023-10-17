<template>
  <q-page class="q-pa-md">
    <q-btn label="Call" @click="() => initCall()"/>
  </q-page>
</template>
<script setup>
import { connectWebsocket } from "src/webrtc/websocket-utils";
import { onUnmounted, ref, watch } from "vue"

const localPeerId = ref(Date.now())
const localIdentity = ref({
  id: localPeerId.value,
  name: 'John Doe',
})

const signallerWs = ref([].map(() => new WebSocket())[0])
const signallerUrl = ref('wss://commercehub.paytaca.com/ws/webrtc/test-call/')
watch(signallerWs, (newVal, oldVal) => {
  window.m.ws = signallerWs.value
  newVal?.addEventListener?.('message', onSignallerMessageHandler)
  oldVal?.removeEventListener?.('message', onSignallerMessageHandler)
})
async function initSignallerWs() {
  const ws = await connectWebsocket(signallerUrl.value)
  ws.addEventListener('close', () => {
    console.log('Signaller closed')
    ws.removeEventListener('message', onSignallerMessageHandler)
    if (ws === signallerWs.value) signallerWs.value = undefined
  })

  ws.addEventListener('message', onSignallerMessageHandler)
  signallerWs?.value?.close?.()
  signallerWs.value = ws
}

/**
 * @param {MessageEvent<any>} message 
 */
async function onSignallerMessageHandler(message) {
  const msgData = JSON.parse(message.data);

    const peerId = msgData?.peer;
    const action = msgData?.action;
    const channelName = msgData?.message?.receiver_channel_name;
    const peerIdentity = msgData?.message?.local_identity

    if (peerId == localPeerId.value) return;
    console.log(peerId, action, channelName);
    
    if (action === 'new-peer') {
      if (localPeerId.value < peerId) {
        // create offerer
      } else {
        sendSignal('request-offer', {
          receiver_channel_name: channelName,
          local_identity: localIdentity.value,
        })
      }
    }
}

/**
 * @param {String} action 
 * @param {any} message 
 */
async function sendSignal(action, message) {
  if (!signallerWs.value) return console.log('Websocket closed, unable to send signal')
  console.log('Sending signal', action, message)
  const data = {
    peer: localPeerId.value,
    action: action,
    message: message,
  }
  const dataStr = JSON.stringify(data)
  signallerWs.value.send(dataStr)
  return true
}


function createOfferer() {
  
}


async function initCall() {
  await Promise.all([
    initSignallerWs(),
  ])
  sendSignal('new-peer')
}

onUnmounted(() => hangUp())
async function hangUp() {
  signallerWs.value?.close?.()
}

window.m = {}
</script>
