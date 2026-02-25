<script setup lang="ts">
import consola from "consola/browser";
import { computed, ref, watch } from "vue";
import { Participant, useDiscordSdk } from "~/plugins/useDiscordSdk";
import { useStore } from "~/store";
import TooltipIcon from "~/components/TooltipIcon.vue";

const store = useStore();
const discordSdk = useDiscordSdk();
const log = consola.withTag("UserList");

const isSubmitting = ref(false);
const popup = ref<string | undefined>();
const popupType = ref<"error" | "info">("error");
const popupCount = ref(0);
const spawnPopup = (message: string, type: "error" | "info") => {
  popup.value = message;
  popupType.value = type;
  popupCount.value++;
  setTimeout(() => {
    popupCount.value--;
  }, 5000);
};
const moveHostConfirm = ref<string | undefined>(undefined);
const temporaryHost = ref<string | undefined>(undefined);
watch(
  () => store.session.host,
  () => {
    temporaryHost.value = store.session.host;
  },
);

const moveHost = async (member: Participant) => {
  if (isSubmitting.value) return;
  log.info("Moving host", member.id);

  try {
    isSubmitting.value = true;
    moveHostConfirm.value = undefined;

    const res = await fetch(`/api/room/${discordSdk.instanceId}/host`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${store.me.id} ${store.token}`,
      },
      body: JSON.stringify({
        id: member.id,
      }),
    });
    if (!res.ok) {
      log.error("Failed to delete video");
      spawnPopup(`ホストを移動できませんでした。`, "error");
      return;
    }

    spawnPopup(`ホストを移動しました。`, "info");
    store.setIsHostOverride(false);
    temporaryHost.value = member.id;
  } finally {
    isSubmitting.value = false;
  }
};

const host = computed(() => {
  return (
    store.participants.find((user) => user.id === temporaryHost.value) ??
    store.participants.find((user) => user.id === store.session.host)
  );
});

const otherMembers = computed(() =>
  store.participants.filter((user) => user.id !== store.me.id && user.id !== host.value?.id),
);
const orderedMembers = computed(() => {
  if (host.value?.id === store.me.id || !host.value) {
    return [store.me, ...otherMembers.value];
  }
  return [host.value, store.me, ...otherMembers.value];
});
</script>
<template>
  <div
    un-h="screen sm:auto"
    un-min-h="full"
    un-w="full"
    un-relative
    un-flex="~ col"
    un-gap="1"
    un-overflow-y="scroll sm:auto"
    un-pt="1"
    un-pb="8 sm:0"
  >
    <div
      v-for="member in orderedMembers"
      :key="member.id"
      un-bg="black/50"
      un-p="2"
      un-flex
      un-gap="2"
      un-relative
      un-items="center"
    >
      <img un-rounded="full" un-h="8" un-mr="1" un-inline :src="store.getAvatarUrl(member.id)" />
      <div un-text="md">{{ store.getName(member.id) }}</div>
      <TooltipIcon
        v-if="host && host.id === member.id"
        name="md-star"
        tooltip="ホスト"
        direction="bottom"
      />
      <div un-flex-grow />

      <TooltipIcon
        v-if="host && moveHostConfirm === member.id"
        :disabled="isSubmitting"
        name="md-check"
        tooltip="確認"
        @click="moveHost(member)"
      />
      <TooltipIcon
        v-if="host && moveHostConfirm === member.id"
        :disabled="isSubmitting"
        name="md-close"
        offset="-2rem"
        tooltip="キャンセル"
        @click="moveHostConfirm = undefined"
      />
      <TooltipIcon
        v-if="
          host && moveHostConfirm !== member.id && host.id === store.me.id && host.id !== member.id
        "
        :disabled="isSubmitting"
        name="md-staroutline"
        offset="-2rem"
        tooltip="ホストを移動"
        @click="moveHostConfirm = member.id"
      />
    </div>
    <div
      un-w="full"
      un-sticky
      un-bottom="0"
      un-py="2"
      un-left="0"
      un-bg="black"
      un-transition="opacity"
      un-grid
      un-place-content="center"
      :un-text="popupType === 'error' ? 'red-500' : popupType === 'info' ? 'green-500' : null"
      :style="{ opacity: popupCount > 0 ? 1 : 0 }"
    >
      {{ popup }}
    </div>
  </div>
</template>
<style scoped lang="scss"></style>
