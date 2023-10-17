<template>
  <q-page class="q-pa-md">
    <q-btn
      :disable="loadingStream"
      :loading="loadingStream"
      no-caps :label="mediaStream ? 'Stop' : 'Start'"
      color="primary"
      class="full-width"
      @click="mediaStream ? stopMediaStream() : loadMediaStream()"
    />

    <div class="row items-center q-mt-sm">
      <q-space/>
      <q-toggle
        dense
        :disable="loadingStream"
        :icon="constraints.audio ? 'mic' :'mic_off'"
        v-model="constraints.audio"
        class="q-mx-sm"
      />
      <q-space/>
      <q-toggle
        dense
        :disable="loadingStream"
        :icon="constraints.video ? 'videocam' : 'videocam_off'"
        v-model="constraints.video"
        class="q-mx-sm"
      />
      <q-space/>
    </div>
    <div class="row items-center justify-center q-mt-md">
      <div>
        <div class="row items-center">
          <AVMedia 
            v-if="mediaStream?.getAudioTracks?.().length"
            :id="`local-audio-bar-${mediaStream?.id}`"
            :media="mediaStream"
            type="vbar" class="audio-meter"
          />
          <q-space/>
          <MediaStreamRecorder :mediaStream="mediaStream"/>
        </div>
        <video
          :srcObject="mediaStream"
          autoplay playsinline
          style="max-width: 50vw;height: 100%;"
        ></video>  
      </div>
    </div>
  </q-page>
</template>
<script>
import { defineComponent, onUnmounted, ref, watch } from 'vue'
import MediaStreamRecorder from 'src/components/MediaStreamRecorder.vue'
import { AVMedia } from 'vue-audio-visual'

export default defineComponent({
  name: 'LocalStreamTest',
  components: {
    AVMedia,
    MediaStreamRecorder,
  },
  setup() {
    const constraints = ref({ audio: true, video: true })
    const mediaStream = ref([].map(() => new MediaStream())[0])

    const loadingStream = ref(false)
    watch(constraints, () => {
      const videoTracks = mediaStream.value.getVideoTracks()
      videoTracks.forEach(track => {
        track.enabled = constraints.value.video
      })
      if (constraints.value.video && !videoTracks.length) {
        loadMediaStream()
        return
      }

      const audioTracks = mediaStream.value.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = constraints.value.audio
      })

      if (constraints.value.audio && !audioTracks.length) {
        loadMediaStream()
        return
      }
    }, { deep: true })
    function loadMediaStream() {
      loadingStream.value = true
      navigator.mediaDevices.getUserMedia(constraints.value)
        .then(_mediaStream => {
          stopMediaStream()
          mediaStream.value = _mediaStream
        })
        .finally(() => {
          loadingStream.value = false
        })
    }

    onUnmounted(() => stopMediaStream())
    function stopMediaStream() {
      mediaStream.value?.getTracks?.().forEach(track => track.stop())
      mediaStream.value = undefined
    }

    return {
      constraints,
      mediaStream,
      loadingStream,
      loadMediaStream,
      stopMediaStream,
    }
  },
})
</script>
