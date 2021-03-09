<template>
  <div>
    <p>Server status: {{ serverStatus }} {{ tick }}</p>
    <p>Server env: {{ serverEnv }}</p>
    <p v-if="chatLobby">{{ chatState }}</p>
    <p v-for="(msg, i) in messages" :key="i">{{ msg }}</p>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import axios from "axios";
import Chat from "@/domain/Chat";
import {ChatState} from "@/domain/ChatState";

@Component
export default class Home extends Vue {

  private serverStatus = "?";

  private serverEnv = "?";

  private tick = "/";

  private messages = new Array<string>();

  private chatLobby: Chat | null = null;

  mounted() {
    setInterval(() => {
      axios.get("/api/status")
          .then((response) => {
            this.serverStatus = `${response.status}`;
            this.serverEnv = `${response.data.env}`;
            this.updateTick();
          });
    }, 1000);

    this.chatLobby = new Chat();
    this.chatLobby.enterChat();
  }

  get chatState(): string {
    return ChatState[this.chatLobby?.state as ChatState];
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
