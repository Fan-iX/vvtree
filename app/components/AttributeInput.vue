<script setup>
defineOptions({ inheritAttrs: false })
import Popover from './widget/Popover.vue'
import WInput from './widget/Input.vue'
import WSelect from './widget/Select.vue'
import WSelectInput from './widget/SelectInput.vue'
import WRangeInput from './widget/RangeInput.vue'
import WColorPicker from './widget/ColorPicker.vue'

const { aes, type, label } = defineProps({
    aes: String,
    type: String,
    label: String,
})
const model = defineModel()

const emit = defineEmits(['spread', 'gather'])
</script>

<template>
    <div class="ml-2 flex">
        <div class="flex-1 min-w-0 flex items-center gap-1">
            <slot>
                {{ label }}:
                <WInput type="number" v-if="type == 'number'" v-bind="$attrs" v-model="model" />
                <WColorPicker v-else-if="type == 'color'" v-bind="$attrs" v-model="model" />
                <WSelect v-else-if="type == 'select'" v-bind="$attrs" v-model="model" />
                <WSelectInput v-else-if="type == 'option'" v-bind="$attrs" v-model="model" />
                <WRangeInput v-else-if="type == 'range'" v-bind="$attrs" v-model="model" />
                <WInput v-else-if="type == 'text'" v-bind="$attrs" v-model="model" />
                <Icon icon="lucide:x" @click="model = undefined" class="hover:text-red-500 cursor-pointer shrink-0" />
            </slot>
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
    </div>
</template>
