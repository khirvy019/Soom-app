<template>
  <div>
    <q-btn
      v-if="isRecording"
      outline
      rounded
      no-caps label="Stop"
      icon="stop"
      color="red"
      padding="none xs"
      @click="() => stopRecording()"
    />
    <q-btn
      v-else
      no-caps label="Record"
      color="primary"
      padding="none xs"
    >
      <q-menu class="q-pa-md">
        <q-btn
          no-caps label="Start"
          icon="fiber_manual_record"
          class="full-width q-mb-md"
          color="primary"
          v-close-popup
          @click="() => initRecorder()"
        />

        <div class="row items-center no-wrap">
          <div>Recordings</div>
          <q-toggle v-model="downloadMode" dense label="Download"/>
        </div>
        <div v-if="!recordings?.length" class="text-grey text-center">No recordings</div>
        <q-item
          v-for="(recording, index) in recordings"
          :key="index"
          clickable v-close-popup
          @click="() => openRecording(recording.url)"
        >
          <q-item-section>
            <q-item-label>{{ recording?.name }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-menu>
    </q-btn>
  </div>
</template>
<script>
import { useQuasar } from 'quasar';
import { computed, defineComponent, ref } from 'vue'
import VideoPlayerDialog from './VideoPlayerDialog.vue';

export default defineComponent({
  name: 'MediaStreamRecorder',
  props: {
    mediaStream: MediaStream,
  },
  setup(props) {
    const $q = useQuasar()
    const options = { mimeType: "video/webm; codecs=vp9" };
    const mediaRecorder = ref([].map(() => new MediaRecorder())[0])
    const recordedChunks = ref([])

    const isRecording = computed(() => mediaRecorder.value?.state === 'recording')
    const downloadMode = ref(true)
    const recordings = ref([].map(() => {
      return {
        name: '',
        url: '',
        blob: new Blob(),
        // file: new File(),
      }
    }))

    function initRecorder() {
      if (!props.mediaStream) return console.log('No media stream')
      mediaRecorder.value?.stop?.()
      mediaRecorder.value?.removeEventListener?.('dataavailable', onDataAvailable)
      recordedChunks.value = []

      mediaRecorder.value = new MediaRecorder(props.mediaStream, options);
      mediaRecorder.value.addEventListener('dataavailable', onDataAvailable)
      mediaRecorder.value.start()
    }
    
    function stopRecording() {
      mediaRecorder.value.state === 'recording'
      mediaRecorder.value?.stop()
      mediaRecorder.value = undefined
    }

    /**
     * @param {BlobEvent} evt 
     */
    function onDataAvailable(evt) {
      const hasSize = evt.data.size > 0
      if (!hasSize) return
      recordedChunks.value.push(evt.data);
      saveRecordedChunks()
    }

    function saveRecordedChunks() {
      const blob = new Blob(recordedChunks.value, {
        type: options.mimeType?.split(';')[0],
      })
      const url = URL.createObjectURL(blob);
      const name = `Recording-${Date.now()}`
      // const file = new File([blob], name)

      recordings.value.push({
        name: name,
        url: url,
        blob: blob,
        // file: file,
      })

      console.log('New recording', name, url, blob)
      recordedChunks.value = []
    }

    function openRecording(url) {
      $q.dialog({
        component: VideoPlayerDialog,
        componentProps: {
          fileUrl: url,
        }
      })
    }

    return {
      mediaRecorder,
      isRecording,
      downloadMode,
      recordings,
      initRecorder,
      stopRecording,
      openRecording,
    }
  },
})
</script>
