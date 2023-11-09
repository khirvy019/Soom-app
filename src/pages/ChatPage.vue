<template>
  <q-page class="q-pa-md">
    <div class="row items-center">
      <q-space/>
      <q-btn-dropdown no-caps label="Other">
        <q-item
          clickable v-ripple
          @click="() => generateRandomBytes()"
        >
          <q-item-section>
            <q-item-label>Create random bytes</q-item-label>
          </q-item-section>
        </q-item>
      </q-btn-dropdown>
    </div>
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row">
          <div class="text-h6">Keypair</div>
          <q-space/>
          <q-btn no-caps label="Set" @click="() => setPriv()"/>
          <q-btn no-caps label="New" @click="() => generateKey()"/>
        </div>
        <div style="word-break:break-all;">priv: {{ kp?.priv }}</div>
        <div style="word-break:break-all;">pub: {{ kp?.pub }}</div>
        <q-separator spaced/>
        <div class="text-h6">Other Pubkeys</div>
        <div v-if="!otherPks.length" class="text-center text-grey q-mt-sm">No pubkeys</div>
        <ul class="q-pl-md q-my-xs">
          <li v-for="pk in otherPks" :key="pk" style="word-break:break-all;">
            {{ pk }}
          </li>
        </ul>
      </q-card-section>
    </q-card>
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row">
          <div class="text-h6">Image</div>
          <q-space/>
        </div>
        <q-file
          dense outlined
          label="Image"
          v-model="image.file"
        >
          <template v-slot:before>
            <img
              v-if="imageFileUrl"
              :src="imageFileUrl"
              class="rounded-borders"
              style="width:100%;height:3rem;"
            />
          </template>
          <template v-slot:append>
            <q-btn
              flat
              no-caps label="Encrypt"
              padding="xs"
              @click="() => encryptImage()"
            />
          </template>
        </q-file>
        <div v-if="image.encrypted">
          <div class="row items-center">
            <div class="text-subtitle1">Encrypted:</div>
            <q-space/>
            <q-btn flat no-caps label="Decrypt" @click="() => decryptImage()"/>
          </div>
          <div class="row items-start no-wrap">
            <img
              v-if="encryptedImageUrl"
              :src="encryptedImageUrl"
              class="rounded-borders"
              style="width:100%;height:3rem;"
              @load="onEncryptedImageLoad"
            />
            <div>
              {{ image.encrypted }}
            </div>
          </div>
        </div>

        <div v-if="image?.decrypted">
          <div class="text-subtitle1">Decrypted:</div>
          <div>{{ image?.decrypted }}</div>
          <img
            v-if="decryptedImageUrl"
            :src="decryptedImageUrl"
            class="rounded-borders"
            style="max-width:100%;height:3rem;"
            @load="onEncryptedImageLoad"
          />
        </div>
      </q-card-section>
    </q-card>
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row">
          <div class="text-h6">Message</div>
          <q-space/>
        </div>
        <q-input
          dense outlined
          label="Message"
          v-model="message.data"
          bottom-slots
        >
          <template #after>
            <q-btn flat padding="sm" no-caps label="Encrypt" @click="() => encryptMessage()"/>
          </template>
        </q-input>

        <div v-if="message.encrypted?.data">
          <div class="row items-center">
            <div class="text-subtitle1">Encrypted:</div>
            <q-space/>
            <q-btn flat no-caps label="Decrypt" @click="() => decryptMessage()"/>
          </div>
          <div style="word-break: break-all;">
            {{ message.encrypted?.data }}
            <q-menu class="q-pa-sm">
              <div style="word-break: break-all;">IV: {{ message?.encrypted?.iv }}</div>
              <div style="word-break: break-all;">Author pubkey: {{ message?.encrypted?.authorPubkey }}</div>
              <div>Pubkeys:</div>
              <ul class="q-my-none q-pl-md">
                <li v-for="(pubkey, index) in message.encrypted?.pubkeys" :key="index" style="word-break: break-all;">
                  {{ pubkey }}
                </li>
              </ul>
            </q-menu>
          </div>
        </div>

        <div v-if="message.decrypted">
          <div class="text-subtitle1">Decrypted:</div>
          <div style="word-break: break-all;">{{ message.decrypted }}</div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>
<script>
import crypto from 'crypto'
import * as secp from '@noble/secp256k1';
import * as chatUtils from 'src/utils/chat'
import { useQuasar } from 'quasar';
import { defineComponent, onMounted, ref, watch } from 'vue'

const otherPrivs = [
  '7356d55b1bef54c5ba4674edc220f5141441b5424f7b68fb503b603813404784',
  '279886165a0bdf23a2cef3ef17faa0b3152001a82ae1eeb0337ecdc84b8e91f9', // random byte
  // 'd05d6ebed9ffe7073eaf152d2827c5e20805e3d11bc40b5b99c414635ce2d6a2',
  // '552bfa873985650496dc553c81c7d7513ba0aa7c85c887cac303b0b160cb41b0',
]

export default defineComponent({
  name: 'ChatPage',
  setup() {
    const $q = useQuasar()
    const kp = ref({ priv: '', pub: '' })
    onMounted(() => {
      const priv = '9be1dba63026caf437d90b6beefebea47d347300756b1ebd951872689f5e80d3'
      const privBytes = secp.etc.hexToBytes(priv)
      const pub = secp.getPublicKey(privBytes)
      const pubHex = secp.etc.bytesToHex(pub)

      kp.value = { priv: priv, pub: pubHex }
    })

    function setPriv() {
      $q.dialog({
        title: 'Set private key',
        color: 'brandblue',
        prompt: { type: 'text' }
      })
        .onOk(priv => {
          const privBytes = secp.etc.hexToBytes(priv)
          const pub = secp.getPublicKey(privBytes)
          const pubHex = secp.etc.bytesToHex(pub)
          kp.value = { priv: priv, pub: pubHex }
        })
    }
    function generateKey() {
      const privkey = secp.utils.randomPrivateKey()
      const priv = secp.etc.bytesToHex(privkey)

      const pubkey = secp.getPublicKey(priv)
      const pubkeyHex = secp.etc.bytesToHex(pubkey)
      kp.value = { priv: priv, pub: pubkeyHex }
    }

    const otherPks = ref([])
    onMounted(() => {
      otherPks.value = otherPrivs.map(priv => {
        const privBytes = secp.etc.hexToBytes(priv)
        const pub = secp.getPublicKey(privBytes)
        const pubHex = secp.etc.bytesToHex(pub)
        return pubHex
      })
    })

    const image = ref({
      file: null,
      encrypted: [].map(() => new File())[0],
      decrypted: [].map(() => new File())[0],
    })
    const imageFileUrl = ref('')
    watch(() => image.value?.file, (newVal, oldVal) => {
      if (newVal) imageFileUrl.value = URL.createObjectURL(newVal)
      else imageFileUrl.value = ''
      if (oldVal) URL.revokeObjectURL(oldVal)
    })

    const encryptedImageUrl = ref('')
    watch(() => image.value?.encrypted, (newVal, oldVal) => {
      if (newVal) encryptedImageUrl.value = URL.createObjectURL(newVal)
      else encryptedImageUrl.value = ''
      if (oldVal) URL.revokeObjectURL(oldVal)
    })

    const decryptedImageUrl = ref('')
    watch(() => image.value?.decrypted, (newVal, oldVal) => {
      if (newVal) decryptedImageUrl.value = URL.createObjectURL(newVal)
      else decryptedImageUrl.value = ''
      if (oldVal) URL.revokeObjectURL(oldVal)
    })
    async function encryptImage() {
      const encryptResp = await chatUtils.encryptImage({
        file: image.value.file,
        privkey: kp.value.priv,
        pubkeys: otherPks.value,
      })
      image.value.encrypted = await chatUtils.compressEncryptedImage(encryptResp)
      console.log('image.value.encrypted', image.value.encrypted)
    }
    function onEncryptedImageLoad(...args) {
      console.log('onEncryptedImageLoad', ...args)
    }

    async function decryptImage() {
      const decompressed = await chatUtils.decompressEncryptedImage(image.value.encrypted)
      const opts = { ...decompressed, privkey: kp.value.priv }
      image.value.decrypted = await chatUtils.decryptImage(opts)
    }

    const message = ref({
      data: 'Test message',
      data: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In in nisl lectus. Cras rhoncus faucibus libero, eget dapibus ante gravida et. Sed vulputate blandit nisl eu aliquam. Suspendisse gravida, enim vel imperdiet mollis, leo ante sagittis tellus, hendrerit suscipit orci diam in tellus. Suspendisse iaculis facilisis mi, in blandit eros.',
      encrypted: { data: '', iv: '', authorPubkey: '', pubkeys: [].map(String) },
      decrypted: '',
    })
    function encryptMessage() {
      const encryptResp =chatUtils.encryptMessage({
        data: message.value.data,
        privkey: kp.value.priv,
        pubkeys: otherPks.value,
      })
      message.value.encrypted = {
        data: encryptResp?.encrypted,
        iv: encryptResp?.iv,
        authorPubkey: encryptResp?.authorPubkey,
        pubkeys: encryptResp?.pubkeys,
      }
    }

    function decryptMessage() {
      message.value.decrypted = chatUtils.decryptMessage({
        data: message.value.encrypted?.data,
        iv: message.value.encrypted?.iv,
        pubkeys: message.value.encrypted?.pubkeys,
        authorPubkey: message.value.encrypted?.authorPubkey,
        privkey: kp.value.priv,
      })
      console.log(message.value.decrypted)
    }

    function generateRandomBytes() {
      $q.dialog({
        title: 'Create random bytes',
        message: 'Input number of bytes',
        color: 'brandblue',
        prompt: {
          type: 'number',
        }
      }).onOk(length => {
        const bytes = crypto.randomFillSync(new Uint8Array(length))
        const hex = secp.etc.bytesToHex(bytes)
        $q.dialog({
          title: 'Random bytes',
          message: hex,
          color: 'brandblue',
          style: 'word-break:break-all;'
        })
      })
    }

    return {
      kp,
      setPriv,
      generateKey,

      otherPks,

      image,
      imageFileUrl,
      encryptedImageUrl,
      decryptedImageUrl,
      encryptImage,
      onEncryptedImageLoad,
      decryptImage,

      message,
      encryptMessage,
      decryptMessage,

      generateRandomBytes,
    }
  },
})
</script>
