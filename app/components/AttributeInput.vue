<script setup>
defineOptions({ inheritAttrs: false })
import { ref, watch } from 'vue'
import Popover from './widget/Popover.vue'
import WInput from './widget/Input.vue'
import WSelect from './widget/Select.vue'
import WSelectInput from './widget/SelectInput.vue'
import WRangeInput from './widget/RangeInput.vue'
import WColorPicker from './widget/ColorPicker.vue'
import { VVTreeNode } from '#base/js/vvtree.js'

const { aes, type, label, node, target } = defineProps({
    aes: String, type: String, label: String,
    node: VVTreeNode, target: String
})

function applyToDescendants() {
    let val = node.attributes[aes]
    node.allChildren.forEach(n => n.attributes[aes] = val)
}

function gatherFromDescendants() {
    node.allNodes.toReversed().filter(n => !n.isTip).forEach(n => {
        let attr = n.children[0]?.attributes[aes]
        if (n.children.every(c => c.attributes[aes] === attr))
            n.attributes[aes] = attr
    })
}
function updateAttributes(value) {
    if (target == "all nodes") {
        node.root.allNodes.forEach(n => n.attributes[aes] = value)
    } else if (target == "tips") {
        node.root.allTips.forEach(n => n.attributes[aes] = value)
    } else if (target == "descendant nodes") {
        node.allNodes.forEach(n => n.attributes[aes] = value)
    } else if (target == "descendant tips") {
        node.allTips.forEach(n => n.attributes[aes] = value)
    } else {
        node.attributes[aes] = value
    }
}
const model = ref()
watch([() => node, () => target], () => {
    model.value = node.attributes[aes]
}, { immediate: true })
</script>

<template>
    <div class="ml-2 flex">
        <div class="flex-1 min-w-0 flex items-center gap-1">
            <slot>
                {{ label }}:
                <WInput type="number" v-if="type == 'number'" v-bind="$attrs" v-model="model"
                    @update:model-value="updateAttributes" />
                <WColorPicker v-else-if="type == 'color'" v-bind="$attrs" v-model="model"
                    @update:model-value="updateAttributes" />
                <WSelect v-else-if="type == 'select'" v-bind="$attrs" v-model="model"
                    @update:model-value="updateAttributes" />
                <WSelectInput v-else-if="type == 'option'" v-bind="$attrs" v-model="model"
                    @update:model-value="updateAttributes" />
                <WRangeInput v-else-if="type == 'range'" v-bind="$attrs" v-model="model"
                    @update:model-value="updateAttributes" />
                <WInput v-else-if="type == 'text'" v-bind="$attrs" v-model="model"
                    @update:model-value="updateAttributes" />
                <Icon icon="lucide:x" @click="updateAttributes(model = undefined)"
                    class="hover:text-red-500 cursor-pointer shrink-0" />
            </slot>
        </div>
        <Popover mode="hover" variant="tooltip" side="left">
            <template #trigger>
                <button class="align-middle rounded-md px-1 py-1 hover:bg-current/5" @click="applyToDescendants">
                    <Icon icon="lucide:git-fork" class="rotate-90" />
                </button>
            </template>
            <p>apply to descendants</p>
        </Popover>
        <Popover mode="hover" variant="tooltip" side="left">
            <template #trigger>
                <button class="align-middle rounded-md px-1 py-1 hover:bg-current/5" @click="gatherFromDescendants">
                    <Icon icon="lucide:git-fork" class="rotate-270" />
                </button>
            </template>
            <p>gather from tips</p>
        </Popover>
    </div>
</template>
