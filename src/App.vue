<template>
  <router-view />
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App',
  computed: {
    darkMode() {
      return this.$q.dark.isActive
    },
  },
  watch: {
    darkMode() {
      localStorage.setItem('dark_mode', this.darkMode)
    },
  },
  mounted() {
    this.$q.dark.set(localStorage.getItem('dark_mode') === 'true')
  }
})
</script>
