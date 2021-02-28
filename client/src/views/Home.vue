<template>
  <div>
    <p>hello world {{ getRandom() }}</p>
    <p>Server status: {{ `${serverStatus} ${tick}` }}</p>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import {v4 as uuid} from "uuid"
import axios from "axios";

@Component
export default class Home extends Vue {

  private serverStatus = "?";

  private tick = "/";

  mounted() {
    setInterval(() => {
      axios.get("/api/status")
          .then((response) => {
            this.serverStatus = response?.data?.status ? response?.data?.status : response.status;
            this.updateTick();
          });
    }, 1000);
  }

  private updateTick(): void {
    if (this.tick === "/") {
      this.tick = "\\";
    } else {
      this.tick = "/";
    }
  }

  private getRandom(): string {
    return uuid();
  }
}
</script>

<style scoped>

</style>
