<template>
  <div>
    <p v-if="chatLobby" class="p-3">{{ chatState }}</p>
    <ul class="text-xs">
      <li v-for="(logMsg) in logMessages" :key="logMsg.id" :class="`text-${logMsg.color}`">
        {{ `> ${logMsg.index}. ${logMsg.msg}` }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {Component, Vue} from "vue-property-decorator";
import {v4 as uuid4} from "uuid";
import Chat from "@/domain/Chat";
import {ChatState} from "@/domain/ChatState";
import Logger from "@/domain/Logger";

@Component
export default class Home extends Vue {

  private logMessages = Logger.getInstance().getMessages();

  private chatLobby: Chat | null = null;

  mounted() {
    this.reenterChat();
  }

  beforeDestroy() {
    this.chatLobby = null;
  }

  get chatState(): string {
    return ChatState[this.chatLobby?.state as ChatState];
  }

  private reenterChat(): void {
    this.chatLobby = new Chat(uuid4()[0]);
    this.chatLobby.addEventListener("leave", () => this.reenterChat());
    this.chatLobby.enterChat();
  }
}
</script>

<style scoped>

</style>
