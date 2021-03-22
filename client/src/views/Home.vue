<template>
  <div>
    <p v-if="chatLobby" class="p-3">{{ chatState }}</p>
    <ul class="text-xs">
      <li v-for="(msg, i) in messages" :key="i">{{ `> ${i}. ${msg}` }}</li>
    </ul>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import Chat from "@/domain/Chat";
import {ChatState} from "@/domain/ChatState";
import Logger from "@/domain/Logger";

@Component
export default class Home extends Vue {

  private tick = "/";

  private messages = Logger.getInstance().getMessages();

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
