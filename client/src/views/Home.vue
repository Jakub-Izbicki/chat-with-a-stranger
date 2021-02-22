<template>
  <div>
    <p>hello world {{ getRandom() }}</p>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import {v4 as uuid} from "uuid"

@Component
export default class Home extends Vue {

  private getRandom(): string {
    return uuid();
  }
}
</script>

<style scoped>

</style>
