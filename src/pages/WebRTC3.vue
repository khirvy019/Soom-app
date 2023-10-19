<template>
  <q-page class="q-pa-md" :key="forceUpdateCtr">
    <div class="row items center q-mb-md">
      <div class="text-h5">WebRTC 3</div>
      <q-space/>
      <q-btn flat padding="none" no-caps label="Help" @click="() => showHelp = true"/>
    </div>
    <q-tabs v-model="role" class="q-mb-md" >
      <q-tab :disable="Boolean(peerConnection)" no-caps label="Offerer" name="offerer"/>
      <q-tab :disable="Boolean(peerConnection)" no-caps label="Answerer" name="answerer"/>
    </q-tabs>
    <div class="column items-center q-mb-md q-gutter-sm">
      <q-btn v-if="!peerConnection" no-caps label="Start" @click="() => start()" color="green"/>
      <q-btn v-else no-caps label="Clean up" @click="() => cleanUp()" color="red"/>
        <template v-if="peerConnection">
          <q-btn no-caps label="Connect media stream to peer" @click="() => addMediaStreamToPeer()" color="primary"/>
          <q-btn
            no-caps label="Copy local sdp"
            @click="() => copyLocalSdpToClipboard()"
            color="primary"
          />
          <q-btn
            no-caps label="Set Remote SDP"
            @click="() => setRemoteDescriptionPrompt()"
            color="primary"
          />
      </template>
    </div>
    <div class="text-center q-mb-md">
      <div v-if="mediaStream">
        <div>Local stream</div>
        <video
          :srcObject="mediaStream"
          autoplay playsinline
          style="width:50vw;height:100%"
        ></video>
      </div>

      <div v-if="remoteStream" class="text-center q-mb-md">
        <div>Remote stream</div>
        <video
          :srcObject="remoteStream"
          autoplay playsinline
          style="width:50vw;height:100%"
        ></video>
      </div>
    </div>
    <q-dialog v-model="showHelp" position="bottom">
      <q-card>
        <q-card-section>
          <div class="text-h6">Help</div>
          <ol class="q-pl-md q-gutter-y-md text-body1">
            <li>
              Open 2 tabs, one for offerer and one for answerer by selecting the tabs above
            </li>
            <li>(Offerer/Answerer) Click start on both tabs</li>
            <li>
              (Offerer)Click "Connect media stream to peer",
              then wait for "ICE gathering complete" to prompt
            </li>
            <li>(Offerer)Click "Copy local sdp"</li>
            <li>
              (Answerer)Open "Set remote sdp" to copied sdp from offerer,
              then wait for "ICE gathering complete" to prompt
            </li>
            <li>(Answerer)Click "Copy local sdp"</li>
            <li>(Answerer)Click "Copy local sdp"</li>
            <li>(Offerer)Open "Set remote sdp" and input copied sdp from offerer</li>
          </ol>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>
<script>
import { useQuasar } from 'quasar'
import { defineComponent, inject, onUnmounted, ref } from 'vue'

export default defineComponent({
  name: 'WebRTC3',
  setup() {
    const $q = useQuasar()
    const forceUpdateCtr = ref(0)
    const $forceUpdate = () => forceUpdateCtr.value++

    const $copyText = inject('$copyText')
    function copyToClipboard(value, message) {
      $copyText(value)
      $q.notify({
        message: message || 'Copied to clipboard',
        timeout: 800,
        color: 'blue-9',
        icon: 'mdi-clipboard-check'
      })
    }

    const role = ref(Date.now() % 2 === 0 ? 'offerer' : 'answerer')

    const mediaStream = ref([].map(() => new MediaStream())[0])
    async function initMediaStream() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      closeMediaStream()
      mediaStream.value = stream
      window.ms = mediaStream.value
      return mediaStream.value
    }

    async function closeMediaStream() {
      mediaStream.value?.getTracks?.().forEach(track => track.stop())
      mediaStream.value = null
      window.ms = null
    }

    const remoteStream = ref([].map(() => new MediaStream())[0])
    function initRemoteStream() {
      closeRemoteStream()
      remoteStream.value = new MediaStream()
    }
    function closeRemoteStream() {
      remoteStream.value?.getTracks?.().forEach(track => track.stop())
      remoteStream.value = null
      window.rs = null

    }

    const RTC_PEER_CONFIG = {
      iceServers: [
        // { urls: 'stun:stun.l.google.com:19302' },
        // { urls: 'stun:stun1.l.google.com:19302' },
        // { urls: 'stun:stun2.l.google.com:19302' },
        // { urls: 'stun:stun3.l.google.com:19302' },
        // { urls: 'stun:stun4.l.google.com:19302' },
        // { urls: 'stun:stun5.l.google.com:19302' },
        // { urls: 'stun:stun6.l.google.com:19302' },
        // { urls: 'stun:stun7.l.google.com:19302' },
        { urls: 'stun:stun8.l.google.com:19302' },
      ]
    }
    const peerConnection = ref([].map(() => new RTCPeerConnection())[0])
    async function addPeerEventListeners() {
      peerConnection.value.addEventListener('icecandidate', onIceCandidate)
      peerConnection.value.addEventListener('negotiationneeded', onNegotiationNeeded)
      peerConnection.value.addEventListener('track', onNewTrack)
      peerConnection.value.addEventListener('icegatheringstatechange', onIceGatheringStateChange)
    }
    
    async function removePeerEventListeners() {
      peerConnection.value?.removeEventListener?.('icecandidate', onIceCandidate)
      peerConnection.value?.removeEventListener?.('negotiationneeded', onNegotiationNeeded)
      peerConnection.value?.removeEventListener?.('track', onNewTrack)
      peerConnection.value?.removeEventListener?.('icegatheringstatechange', onIceGatheringStateChange)
    }

    async function addMediaStreamToPeer(opts = {forceNewStream: true }) {
      if (!mediaStream.value || opts?.forceNewStream) {
        console.log('Creating media stream')
        await initMediaStream()
      }
      console.log('Adding stream to peer connection')
      mediaStream.value.getTracks().forEach(track => {
        if (peerConnection.value.getSenders().map(sender => sender.track).includes(track)) {
          return
        }

        peerConnection.value.addTrack(track, mediaStream.value)
      })

      if (role.value === 'offerer') await setLocalOffer()
    }

    async function copyLocalSdpToClipboard() {
      const sdp = JSON.stringify(peerConnection.value.localDescription.toJSON())
      copyToClipboard(sdp)
    }

    async function setRemoteDescriptionPrompt() {
      $q.dialog({
        color: 'primary',
        title: 'Set remote sdp',
        prompt: { type: 'text' },
      }).onOk(sdpStr => {
        const sdp = JSON.parse(sdpStr)
        console.log('sdp', sdp)
        peerConnection.value.setRemoteDescription(sdp)
          .finally(() => console.log('Successfully set remote sdp'))
        if (role.value == 'answerer') setLocalAnswer()
      })
    }

    async function setLocalOffer() {
      console.log('Creating offer')
      const offer = await peerConnection.value.createOffer()

      console.log('Setting offer local description')
      peerConnection.value.setLocalDescription(offer)
      $forceUpdate()
    } 

    async function setLocalAnswer() {
      console.log('Creating answer')
      const asnwer = await peerConnection.value.createAnswer()

      console.log('Setting answer local description')
      peerConnection.value.setLocalDescription(asnwer)
      $forceUpdate()
    }

    async function start() {
      console.log('Creating peer connection')
      peerConnection.value = new RTCPeerConnection(RTC_PEER_CONFIG)
      window.pc = peerConnection.value
      initMediaStream()
      await addPeerEventListeners()
    }

    onUnmounted(() => cleanUp())
    async function cleanUp() {
      closeRemoteStream()
      await removePeerEventListeners()
      peerConnection.value?.close?.()
      peerConnection.value = null
      closeMediaStream()
    }

    /**
     * @param {RTCPeerConnectionIceEvent} evt 
     */
    function onIceCandidate(evt) {
      console.log(evt.type, evt)
    }

    function onNegotiationNeeded(evt) {
      console.log(evt.type, evt)
    }

    /**
     * @param {Event} evt 
     */
    function onIceGatheringStateChange(evt) {
      console.log(evt.type, evt)
      if (peerConnection.value.iceGatheringState === 'complete') {
        $q.dialog({
          color: 'primary',
          title: 'ICE Gathering complete',
          message: role.value === 'offerer'
            ? 'Copy local sdp and set as remote sdp to an answerer'
            : 'Copy local sdp and set as remote sdp to an offerer',
          ok: {
            flat: true,
            noCaps: true,
            label: 'Copy local sdp',
          }
        }).onOk(() => copyLocalSdpToClipboard())
      }
    }

    /**
     * @param {RTCTrackEvent} evt 
     */
    function onNewTrack(evt) {
      console.log('New track')
      if (!remoteStream.value) initRemoteStream()
      
      if (remoteStream.value.getTracks().includes(evt.track)) return

      remoteStream.value.addTrack(evt.track, remoteStream.value)
    }

    const showHelp = ref(false)

    return {
      forceUpdateCtr,
      copyToClipboard,
      role,

      mediaStream,
      initMediaStream,
      closeMediaStream,

      remoteStream,
      initRemoteStream,
      closeRemoteStream,

      peerConnection,
      addMediaStreamToPeer,
      copyLocalSdpToClipboard,
      setRemoteDescriptionPrompt,

      start,
      cleanUp,

      showHelp,
    }
  },
})
</script>
