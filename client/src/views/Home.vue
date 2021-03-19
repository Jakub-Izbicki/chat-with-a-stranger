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
    this.chatLobby = new Chat();
    this.chatLobby.enterChat();
  }

  beforeDestroy() {
    this.chatLobby?.leaveChat("component being destroyed");
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
