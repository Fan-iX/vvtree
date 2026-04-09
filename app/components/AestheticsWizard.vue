<script setup>
import { computed, ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import WidgetColorPicker from './widget/ColorPicker.vue'
import WidgetInventory from './widget/Inventory.vue'
import WTextarea from './widget/Textarea.vue'
import Popover from './widget/Popover.vue'
import FloatingPanel from './widget/FloatingPanel.vue'

const { config } = defineProps({
    config: Object,
})
const emit = defineEmits(['apply', 'clear'])

const activeTab = defineModel("tab", { type: String })
const inventory = useLocalStorage('tree-studio-inventory', {})

const aesthetics = [
    ['color', 'point_color', 'point_size'],
    ['branch_color', 'branch_width', 'branch_linetype'],
    ['text_color', 'text_size', 'text_label'],
    ['bar_range', 'bar_color', 'bar_width']
]
let colorFn = `node => {
    let categories = [
        (n) => n.name.startsWith("prefix"),
        ["val1", "val2"]
    ]
    let pal = palettes.Tableau10
    for (let i = 0; i < categories.length; i++) {
        let cate = categories[i]
        let fn = tip => tip.name == cate
        if (typeof cate == "function") fn = cate
        if (Array.isArray(cate)) fn = tip => cate.includes?.(tip.name)
        if (typeof fn == "function" && node.allTips.every(fn)) return pal[i]
    }
}`
const defaultAesthetics = {
    color: colorFn,
    point_color: colorFn,
    point_size: "node => +node.name > 90 ? 6 : 0",
    point_shape: "node => 'circle'",
    branch_color: colorFn,
    branch_width: "node => 1",
    branch_linetype: "node => 'solid'",
    text_color: colorFn,
    text_size: "node => 6",
    text_label: "node => node.isTip ? node.name : ''",
    bar_range: `node => {
    let CI = node.annotations?.['height_95%_HPD'] ?? node.annotations?.['reltime_95%_CI']
    let height = node.height
    return CI?.map(v => v - height)
}`,
    bar_color: "node => '#0000FF88'",
    bar_width: "node => 1"
}

const open = computed({
    get() { return activeTab.value != null },
    set(v) { if (!v) activeTab.value = null }
})

const aesFuncText = ref("")
const valuemap = ref("")

watch(activeTab, aes => {
    if (aes) aesFuncText.value = config?.[aes] ?? defaultAesthetics[aes] ?? ""
})
function saveAesthetic(aes, funcText) {
    inventory.value[aes] ??= []
    if (inventory.value[aes].some?.(x => x.value == funcText)) return
    inventory.value[aes].push({ name: funcText.replace(/\r\n/g, "").slice(0, 10), value: funcText })
}

function buildmap() {
    let map = {}
    for (let line of valuemap.value.trim().split("\n")) {
        let [node, val] = line.split(/\t/)
        if (!isNaN(val)) val = +val
        else if (val.toLowerCase() == "null") val = null
        else if (val.toLowerCase() == "true") val = true
        else if (val.toLowerCase() == "false") val = false
        map[node] = val
    }
    aesFuncText.value = `function(node) {
    if (node.isTip) {
        let map = ${JSON.stringify(map, null, 4)};
        return map[node.name]
    } else {
        let attr = node.children[0]?.attributes.${activeTab.value}
        return node.children.every(c => c.attributes.${activeTab.value} === attr) ? attr : null
    }
}`
}
</script>

<template>
    <FloatingPanel v-model:open="open" :width="600" :height="400" title="Advanced aesthetics">
        <div class="flex flex-col h-full">
            <div class="flex flex-wrap" v-for="tabs in aesthetics">
                <button v-for="tab in tabs"
                    class="rounded-sm hover:bg-current/10 px-1 rounded-b-none border border-gray-300"
                    :class="activeTab == tab ? 'bg-current/10 hover:bg-current/15' : ''" @click="activeTab = tab">
                    {{ tab }}
                </button>
            </div>
            <div class="flex">
                <Popover class="flex flex-col">
                    <template #trigger>
                        <button class="rounded-md px-1 py-1 hover:bg-current/5 whitespace-nowrap">
                            <Icon icon="lucide:table-properties" class="text-lg -scale-x-100 inline-block" />
                            from tsv
                        </button>
                    </template>
                    from key-value table:
                    <WTextarea v-model="valuemap" class="flex-2 whitespace-nowrap"
                        :placeholder="`node name\t${activeTab} value`" rows="10" />
                    <div class="flex flex-row-reverse">
                        <button
                            class="text-white bg-green-500 cursor-pointer rounded-md px-2 py-1 hover:bg-green-500/75"
                            @click="buildmap">
                            Apply
                        </button>
                    </div>
                </Popover>
            </div>
            <div class="flex-1 flex flex-row gap-1">
                <WTextarea v-model="aesFuncText" class="flex-2" />
                <div class="flex-1 overflow-auto">
                    <div>
                        <span class="font-bold">presets</span>
                        <button class="float-right inline-block align-middle rounded-md px-1 py-1 hover:bg-current/5"
                            @click="saveAesthetic(activeTab, aesFuncText)">
                            <Icon icon="lucide:save" />
                        </button>
                    </div>
                    <WidgetInventory v-model:inventory="inventory[activeTab]" v-model="aesFuncText"
                        class="overflow-auto" />
                </div>
            </div>
            <div class="flex whitespace-nowrap">
                <div>
                    palette color preview:
                    <WidgetColorPicker modelValue="black" />
                </div>
                <div class="ml-auto flex gap-2">
                    <button class="rounded-md px-2 py-1 border border-current hover:bg-current/5"
                        @click="emit('clear', activeTab)">
                        reset
                    </button>
                    <div class="flex float-right">
                        <button
                            class="text-white bg-green-500 cursor-pointer rounded-md px-2 py-1 hover:bg-green-500/75 rounded-r-none"
                            @click="emit('apply', 'root', activeTab, aesFuncText)">
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
                                <button @click="emit('apply', 'active', activeTab, aesFuncText)"
                                    class="px-2 py-1 hover:bg-current/5 text-left">
                                    Apply to current node and descendants
                                </button>
                                <button @click="emit('apply', 'tips', activeTab, aesFuncText)"
                                    class="px-2 py-1 hover:bg-current/5 text-left">
                                    Apply to all tip nodes
                                </button>
                                <button @click="emit('apply', 'activetips', activeTab, aesFuncText)"
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
