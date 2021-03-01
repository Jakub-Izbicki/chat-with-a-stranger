<template>
  <div>
    <p>Server status: {{ serverStatus }}</p>
    <p>Server env: {{ serverEnv }}</p>
    <p>{{ tick }}</p>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import axios from "axios";

@Component
export default class Home extends Vue {

  private serverStatus = "?";

  private serverEnv = "?";

  private tick = "/";

  mounted() {
    setInterval(() => {
      axios.get("/api/status")
          .then((response) => {
            this.serverStatus = `${response.status}`;
            this.serverEnv = `${response.data.env}`;
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
}
</script>

<style scoped>

</style>
