<script setup>
import Popover from './widget/Popover.vue'

const { aes } = defineProps({
    aes: String,
})

const emit = defineEmits(['spread', 'gather', 'panel'])
</script>

<template>
    <div class="ml-2 flex">
        <div class="flex-1">
            <slot></slot>
        </div>
        <Popover mode="hover" variant="tooltip" side="left">
            <template #trigger>
                <button class="align-middle rounded-md px-1 py-1 hover:bg-current/5" @click="emit('spread', aes)">
                    <Icon icon="lucide:git-fork" class="rotate-90" />
                </button>
            </template>
            <p>apply to descendants</p>
        </Popover>
        <Popover mode="hover" variant="tooltip" side="left">
            <template #trigger>
                <button class="align-middle rounded-md px-1 py-1 hover:bg-current/5" @click="emit('gather', aes)">
                    <Icon icon="lucide:git-fork" class="rotate-270" />
                </button>
            </template>
            <p>gather from tips</p>
        </Popover>
        <Popover mode="hover" variant="tooltip" side="left">
            <template #trigger>
                <button class="align-middle rounded-md px-1 py-1 hover:bg-current/5" @click="emit('panel', aes)">
                    <Icon icon="lucide:square-function" />
                </button>
            </template>
            <p>apply custom function</p>
        </Popover>
    </div>
</template>
