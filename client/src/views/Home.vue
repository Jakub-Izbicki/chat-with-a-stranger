<template>
  <div>
    <p>Server status: {{ serverStatus }} {{ tick }}</p>
    <p>Server env: {{ serverEnv }}</p>
    <p>Websocket ping: {{ socketTick }}</p>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import axios from "axios";
import {io, Socket} from "socket.io-client";

@Component
export default class Home extends Vue {

  private serverStatus = "?";

  private serverEnv = "?";

  private tick = "/";

  private socketTick = "/";

  private socket!: Socket;

  mounted() {
    setInterval(() => {
      axios.get("/api/status")
          .then((response) => {
            this.serverStatus = `${response.status}`;
            this.serverEnv = `${response.data.env}`;
            this.updateTick();
          });
    }, 1000);

    if (this.getSocketUrl()) {
      this.socket = io(this.getSocketUrl() as string);
    } else {
      this.socket = io();
    }

    this.socket.on("connect", () => {
      console.info("Connected to socket");
    });

    this.socket.on("ping", () => {
      console.info("received ping");
      this.updateSocketTick();
    });
  }

  private updateTick(): void {
    if (this.tick === "/") {
      this.tick = "\\";
    } else {
      this.tick = "/";
    }
  }

  private updateSocketTick(): void {
    if (this.socketTick === "/") {
      this.socketTick = "\\";
    } else {
      this.socketTick = "/";
    }
  }

  private getSocketUrl(): string | null {
    if (process.env.NODE_ENV !== "production") {
      return "http://localhost:3000";
    } else {
      return null;
    }
  }
}
</script>

<style scoped>

</style>
