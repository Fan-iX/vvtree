<script setup>
import { ref, watch } from 'vue'
import WidgetDragList from './DragList.vue'
import Popover from './Popover.vue'
const inventory = defineModel("inventory")

const { nameAttribute, valueAttribute, modelValue } = defineProps({
    nameAttribute: { type: String, default: "name" },
    valueAttribute: { type: String, default: "value" },
    modelValue: null,
})
const emit = defineEmits(['update:modelValue'])
const editIdx = ref(-1)
const onpick = (i) => {
    editIdx.value = i
    emit('update:modelValue', inventory.value[i][valueAttribute])
}
watch(() => modelValue, () => {
    if (editIdx.value != -1) {
        inventory.value[editIdx.value][valueAttribute] = modelValue
    }
}, { deep: true })
function dropitem(i) {
    inventory.value = inventory.value.toSpliced(i, 1)
}
function reorder(i, j) {
    inventory.value = inventory.value.toSpliced(i, 1).toSpliced(j > i ? j - 1 : j, 0, inventory.value[i])
}
</script>
<template>
    <WidgetDragList @reorder="reorder">
        <div v-for="item, i in inventory" class="flex-1 flex flex-row justify-between hover:bg-current/5"
            :class="{ 'bg-current/10': editIdx == i, 'hover:bg-current/15': editIdx == i }" v-tw-merge>
            <div @click="onpick(i)" class="flex-1">
                <input v-if="editIdx == i" v-model="inventory[i][nameAttribute]" @blur="editIdx = -1"
                    class="appearance-none min-w-4 field-sizing-content bg-transparent border-b outline-none" />
                <span v-else>{{ item[nameAttribute] }}</span>
            </div>
            <Icon icon="lucide:check" class="text-xl hover:text-green-500 cursor-pointer" @click="editIdx = -1"
                v-if="editIdx == i" />
            <Popover class="p-2" inline trigger-class="cursor-pointer">
                <template #trigger>
                    <Icon icon="lucide:eye" class="text-xl cursor-pointer hover:text-red-500" />
                </template>
                <pre class="max-h-80 max-w-80 overflow-auto">{{ item[valueAttribute] }}</pre>
            </Popover>
            <Icon icon="lucide:x" class="text-xl cursor-pointer hover:text-red-500" @click="dropitem(i)" />
        </div>
    </WidgetDragList>
</template>
