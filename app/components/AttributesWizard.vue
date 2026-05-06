<script setup>
import { computed, ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import WidgetColorPicker from './widget/ColorPicker.vue'
import WidgetInventory from './widget/Inventory.vue'
import WTextarea from './widget/Textarea.vue'
import Popover from './widget/Popover.vue'
import FloatingPanel from './widget/FloatingPanel.vue'
import { palettes } from '../js/utils.js'

const { config, node } = defineProps({
    config: Object, node: Object
})
const emit = defineEmits(['apply', 'clear'])

const inventory = useLocalStorage('tree-studio-attr-inventory', {})

const attributes = [
    'color', 'point_color', 'point_size',
    'branch_color', 'branch_width', 'branch_linetype',
    'text_color', 'text_size', 'text_label',
    'bar_range', 'bar_color', 'bar_width',
    'anchor_x', 'anchor_y', 'translate_x', 'translate_y',
]
const defaultValue = {
    color: "node1\tred\n...etc\tblue",
    point_color: "node1\tred\n...etc\tblue",
    point_size: "node1\t0\n...etc\t6",
    point_shape: "node1\tcircle\n...etc\tsquare",
    branch_color: "node1\tred\n...etc\tblue",
    branch_width: "node1\t2\n...etc\t1",
    branch_linetype: "node1\tdashed\n...etc\tsolid",
    text_color: "node1\tred\n...etc\tblue",
    text_size: "node1\t8\n...etc\t6",
    text_label: "node1\tlabel1\n...etc\t",
    bar_range: `node1\t0\t1\n...etc\tnull`,
    bar_color: "node1\t#FF000088\n...etc\t#0000FF88",
    bar_width: "node1\t1.5\n...etc\t1",
    anchor_x: "node1\t0.5\n...etc\t0",
    anchor_y: "node1\t0.5\n...etc\t0.5",
    translate_x: "node1\t10\n...etc\t0",
    translate_y: "node1\t10\n...etc\t0",
}


const aes = ref("color")
const valuemap = ref("")

watch(aes, v => valuemap.value = config?.[v] ?? defaultValue[v] ?? "", { immediate: true })
function saveValue(key, value) {
    inventory.value[key] ??= []
    if (inventory.value[key].some?.(x => x.value == value)) return
    inventory.value[key].push({ name: value.replace(/\r\n/g, "").slice(0, 10), value })
}

function resetAttributes() {
    if (config?.[aes.value]) delete config[aes.value]
    if (!node?.root) return
    node.root.allNodes.forEach(n => n.attributes[aes.value] = null)
}
function autoType(val) {
    if (!isNaN(val)) return +val
    else if (val.toLowerCase() == "null") return null
    else if (val.toLowerCase() == "true") return true
    else if (val.toLowerCase() == "false") return false
    return val
}
function applyAttributes(nodes) {
    config[aes.value] = valuemap.value
    if (!nodes?.length) return
    let map = {}
    for (let line of valuemap.value.trim().split("\n")) {
        let [n, ...val] = line.split(/\t/)
        if (val.length == 1) map[n] = autoType(val[0])
        else map[n] = val.map(autoType)
    }
    nodes.forEach(n => n.attributes[aes.value] = map[n.name] ?? map['...etc'])
}
</script>

<template>
    <FloatingPanel :width="600" :height="400" title="Apply attribute map">
        <div class="flex flex-col h-full">
            <div class="grid grid-cols-[auto_2fr_1fr] grid-rows-[auto_1fr] grid-flow-col overflow-auto flex-1">
                <span class="font-bold">attribute</span>
                <div class="flex flex-col overflow-auto">
                    <button v-for="tab in attributes" class="rounded-sm hover:bg-current/10 px-1 text-left"
                        :class="aes == tab ? 'bg-current/10 hover:bg-current/15' : ''" @click="aes = tab">
                        {{ tab }}
                    </button>
                </div>
                <span class="font-bold">
                    map
                    <Popover mode="hover" variant="tooltip" inline>
                        <template #trigger>
                            <Icon icon="lucide:circle-question-mark"
                                class="text-blue-500 cursor-help inline-block align-middle" />
                        </template>
                        <p>syntax:</p>
                        <pre>node_name1&#9;attribute_value1
node_name2&#9;attribute_value2
...etc&#9;default_value</pre>
                    </Popover>
                </span>
                <WTextarea v-model="valuemap" class="whitespace-nowrap flex-2" />
                <div>
                    <span class="font-bold">presets</span>
                    <button class="float-right inline-block align-middle rounded-md px-1 py-1 hover:bg-current/5"
                        @click="saveValue(aes, valuemap)">
                        <Icon icon="lucide:save" />
                    </button>
                </div>
                <WidgetInventory v-model:inventory="inventory[aes]" v-model="valuemap" class="overflow-auto" />
            </div>
            <div class="flex whitespace-nowrap">
                <div>
                    palette color preview:
                    <WidgetColorPicker modelValue="black" />
                </div>
                <div class="ml-auto flex gap-2">
                    <button class="rounded-md px-2 py-1 border border-current hover:bg-current/5"
                        @click="resetAttributes(aes)">
                        reset
                    </button>
                    <div class="flex float-right">
                        <button
                            class="text-white bg-green-500 cursor-pointer rounded-md px-2 py-1 hover:bg-green-500/75 rounded-r-none"
                            @click="applyAttributes(node?.root?.allNodes)">
                            Apply
                        </button>
                        <Popover align="end" variant="contextmenu" trigger-class="flex">
                            <template #trigger>
                                <button
                                    class="text-white bg-green-500 cursor-pointer rounded-md px-1 py-1 hover:bg-green-500/75 rounded-l-none">
                                    <Icon icon="lucide:chevron-down" class="text-xl " />
                                </button>
                            </template>
                            <div class="flex flex-col">
                                <button @click="applyAttributes(node?.allNodes)"
                                    class="px-2 py-1 hover:bg-current/5 text-left">
                                    Apply to current node and descendants
                                </button>
                                <button @click="applyAttributes(node?.root?.allTips)"
                                    class="px-2 py-1 hover:bg-current/5 text-left">
                                    Apply to all tip nodes
                                </button>
                                <button @click="applyAttributes(node?.allTips)"
                                    class="px-2 py-1 hover:bg-current/5 text-left">
                                    Apply to tip nodes of current node
                                </button>
                            </div>
                        </Popover>
                    </div>
                </div>
            </div>
        </div>
    </FloatingPanel>
</template>
