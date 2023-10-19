<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">WebRTC 2</div>
    <q-input
      dense
      outlined
      label="Call ID (arbitrary string)"
      :readonly="Boolean(manager)"
      v-model="callId"
      bottom-slots
    />
    <q-input
      dense
      outlined
      :readonly="Boolean(manager)"
      label="Name"
      v-model="localIdentity.name"
      bottom-slots
    />
    <div class="row q-gutter-x-xs">
      <q-btn
        v-if="!manager?.signaller?.isWebsocketOpen && !manager?.members?.length"
        :disable="initializingWebsocket || loadingLocalStream"
        :loading="initializingWebsocket || loadingLocalStream"
        label="Start call"
        @click="() => startCall()"
      />
      <q-btn
        v-else
        label="Hang up"
        @click="() => hangUp()"
      />
      <q-space/>

      <div class="text-center">
        <q-btn
          round
          :icon="constraints?.video ? 'videocam' : 'videocam_off'"
          color="grey"
          @click="() => {
            constraints.video = !constraints?.video
          }"
        />
        <!-- <div>{{ constraints?.audio ? 'Mic on' : 'Mic off' }}</div> -->
      </div>
      <div class="text-center">
        <q-btn
          round
          :icon="constraints?.audio ? 'mic' : 'mic_off'"
          color="grey"
          @click="() => {
            constraints.audio = !constraints?.audio
          }"
        />
        <!-- <div>{{ constraints?.audio ? 'Mic on' : 'Mic off' }}</div> -->
      </div>
      <div class="text-center">
        <q-btn
          round
          :icon="!membersMuted ? 'volume_up' : 'volume_off'"
          color="grey"
          @click="() => {
            membersMuted = !membersMuted
          }"
        />
        <!-- <div>{{ !membersMuted ? 'Mute' : 'Unmute' }}</div> -->
      </div>
    </div>
    <div class="row">
      <div class="col-12 col-sm-6 q-pa-xs member-container">
        <div class="row items-center member-toolbar">
          <div>
            <div>{{ localIdentity?.name }}</div>
            <div v-if="manager?.localPeerId" class="text-caption">#{{ manager?.localPeerId }}</div>
          </div>
          <q-space/>
          <MediaStreamRecorder v-if="manager?.localStream" :mediaStream="manager?.localStream"/>
          <q-toggle
            :icon="muteLocalStream ? 'volume_off' : 'volume_up'"
            v-model="muteLocalStream"
          />
          <AVMedia 
            v-if="manager?.localStream?.getAudioTracks?.().length"
            ref="localAudioBarRef"
            :id="`local-audio-bar-${manager?.localStream?.id}`"
            :media="manager?.localStream"
            type="vbar" class="audio-meter"
          />
        </div>
        <video
          ref="localAudioRef"
          :id="`local-stream-${manager?.localStream?.id}`"
          :srcObject="manager?.localStream"
          autoplay playsinline
          :muted="muteLocalStream"
          style="width:100%;height:100%;border-radius: 4px;"
          class="stream-video"
        ></video>
      </div>
      <div
        v-for="member in manager?.members" :key="member?.id"
        class="col-12 col-sm-6 q-pa-xs member-container"
      >
        <div class="row items-center member-toolbar">
          <div>
            <div>{{ member?.identity?.name }}</div>
            <div v-if="member?.id" class="text-caption">{{ member?.handle }}</div>
          </div>
          <q-space/>
          <MediaStreamRecorder
            v-if="member?.mediaStream" :mediaStream="member?.mediaStream"
            class="q-mr-xs"
          />
          <AVMedia 
            v-if="member?.mediaStream?.getAudioTracks?.().length"
            ref="localAudioBarRef"
            :id="`local-audio-bar-${member?.mediaStream?.id}`"
            :media="member?.mediaStream"
            type="vbar" class="audio-meter"
          />
        </div>
        <video
          :ref="val => membersVideoRefs[member?.id] = val"
          :id="`remote-stream-${member?.mediaStream?.id}`"
          :srcObject="member?.mediaStream"
          autoplay playsinline
          style="width:100%;height:100%;border-radius: 4px;"
          class="stream-video"
        ></video>
      </div>
    </div>
  </q-page>
</template>
<script>
import { WebRtcCallManager } from 'src/webrtc'
import { defineComponent, onDeactivated, onUnmounted, ref, watch } from 'vue'
import { AVMedia } from 'vue-audio-visual'
import MediaStreamRecorder from 'src/components/MediaStreamRecorder.vue'

export default defineComponent({
  name: 'WebRTC2',
  components: {
    AVMedia,
    MediaStreamRecorder,
  },
  setup() {
    const callId = ref('test-call')
    const membersVideoRefs = ref({})
    const muteLocalStream = ref(true)
    const localIdentity = ref({
      id: 0,
      type: 'none',
      name: 'Bob',
    })
    const constraints = ref({ audio: true, video: true })
    watch(constraints, () => {
      if (!manager.value) return
      manager.value.constraints = constraints.value
      manager.value.updateStreamConstraints?.()
    }, { deep: true })
    
    const manager = ref([].map(() => new WebRtcCallManager())[0])
    async function initManager() {
      manager.value?.cleanUp?.()
      if (manager.value) {
        manager.value.callId = callId.value
        return
      }

      manager.value = new WebRtcCallManager({
        callId: callId.value,
        handshakeProtocol: 'v2',
        peerId: Date.now(),
        identity: localIdentity.value,
        constraints: constraints.value,
        signaller: callId => {
          return `wss://commercehub.paytaca.com/ws/webrtc/${callId}/`
        }
      })
      window.m  = manager.value
    }

    const initializingWebsocket = ref(false)
    function initWebsocket() {
      initializingWebsocket.value = true
      return manager.value.signaller.connectWs()
        .finally(() => {
          initializingWebsocket.value = false
        })
    }

    const loadingLocalStream = ref(false)
    function loadLocalStream() {
      loadingLocalStream.value = true
      return manager.value.getLocalStream()
        .finally(() => {
          loadingLocalStream.value = false
        })
    }

    async function startCall() {
      await initManager()
      await Promise.all([
        initWebsocket(),
        loadLocalStream(),
      ])
      
      manager.value.joinRoom()
    }


    const membersMuted = ref(false)
    watch(membersMuted, () => updateMemberAudioStatus())
    function updateMemberAudioStatus() {
      if (!manager.value) return
      manager.value.members.forEach(member => {
        member.mediaStream.getAudioTracks().forEach(track => {
          track.enabled = !Boolean(membersMuted.value)
        })
      })
    }

    onDeactivated(() => hangUp())
    onUnmounted(() => hangUp())
    function hangUp() {
      manager.value?.cleanUp?.()
      manager.value = undefined
      membersMuted.value = false
    }

    return {
      callId,
      membersVideoRefs,
      muteLocalStream,
      localIdentity,
      constraints,
      manager,
      initializingWebsocket,
      loadingLocalStream,
      startCall,
      membersMuted,
      hangUp,
    }
  },
})
</script>
<style lang="scss" scoped>
.stream-video {
  border: 1px solid red;
  border-radius: 4px;
}

.member-container {
  position: relative;
}

.member-container > .member-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 0.5em 0.5em 0 0.5em;
  border-radius: 4px;
  z-index: 2;
}
</style>
