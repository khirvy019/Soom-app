<template>
  <q-dialog v-model="innerVal" ref="dialogRef" @hide="onDialogHide" position="bottom">
    <q-card>
      <q-card-section>
        <div class="row items-center q-pb-sm">
          <div class="text-h5 q-space">Video</div>
          <q-btn flat icon="close" padding="sm" v-close-popup/>
        </div>
      </q-card-section>
      <video
        autoplay
        playsinline
        :src="fileUrl"
        style="width:100%;height:100%;"
        controls
        class="q-mb-md"
      ></video>
    </q-card>
  </q-dialog>
</template>
<script>
import { useDialogPluginComponent } from 'quasar'
import { defineComponent, onMounted, ref, watch } from 'vue'

export default defineComponent({
  name: 'VideoPlayerDialog',
  props: {
    modelValue: Boolean,
    fileUrl: String,
  },
  emits: [
    'update:modelValue',

    // REQUIRED; need to specify some events that your
    // component will emit through useDialogPluginComponent()
    ...useDialogPluginComponent.emits,
  ],
  setup(props, { emit: $emit }) {
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

    const innerVal = ref(props.modelValue)
    watch(() => [props.modelValue], () => innerVal.value = props.modelValue)
    watch(innerVal, () => $emit('update:modelValue', innerVal.value))
    return {
      dialogRef, onDialogHide, onDialogOK, onDialogCancel,
      innerVal,
    }
  },
})
</script>
