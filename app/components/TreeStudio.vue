<script setup>
import WidgetJsonTable from './widget/JsonTable.vue'
import WTextarea from './widget/Textarea.vue'
import WInput from './widget/Input.vue'
import WSelect from './widget/Select.vue'
import WDetails from './widget/Details.vue'
import WCheckInput from './widget/CheckInput.vue'
import Popover from './widget/Popover.vue'
import AestheticsWizard from './AestheticsWizard.vue'
import AttributeInput from './AttributeInput.vue'
import Tree from './Tree.vue'
const emit = defineEmits(['load'])

import { downloadContent, openContentWindow, palettes, svg2png, svg2pdf, svg2svg } from '../js/utils.js'
import { ref, computed, watch, onMounted, useTemplateRef } from 'vue'
import { VVTreeNode } from '#base/js/vvtree.js'
const config = defineModel("config")

const tree = ref()
const activeNode = ref()
const containerRef = useTemplateRef('container')

watch([tree, config], ([nt, nc], [ot, oc]) => {
    if (nc != oc) {
        config.value.layout ??= 'rectangular'
        config.value.display ??= {}
        tree.value = VVTreeNode.parseNewick(nc.newick ?? nc.data) ?? new VVTreeNode()
        activeNode.value = tree.value
    } else {
        config.value.newick = nt?.toNewickString?.()
    }
}, { deep: true, immediate: true })
watch(() => config.value.layout, l => {
    config.value.display[l] ??= {}
    config.value.display[l].height ??= containerRef.value?.clientHeight
    config.value.display[l].width ??= containerRef.value?.clientWidth
    config.value.display[l].unit ??= "px"
}, { deep: true, immediate: true })
const zoom_scale = computed(() => config.value?.display?.[config.value.layout]?.zoom_scale ?? 1)

function buildTree() {
    tree.value = VVTreeNode.parseNewick(config.value.data) ?? new VVTreeNode()
}

async function onpaste(e) {
    if (e.clipboardData.getData('vvtree-tree-list')) {
        emit('load', JSON.parse(e.clipboardData.getData('vvtree-tree-list')))
    } else if (e.clipboardData.files.length) {
        let trees = []
        for (const file of e.clipboardData.files) {
            const text = await file.text()
            if (text.match(/begin trees;\s*(?:translate(.*?);)?.*^\s*(tree.*?[;\n$])/sim)) {
                let [, translation, nwk] = text.match(/begin trees;\s*(?:translate(.*?);)?.*^\s*(tree.*?[;\n$])/sim)
                nwk = nwk.replace(/^.*?=(\s+\[\S+\])?\s+/, "")
                if (translation) {
                    let tree = VVTreeNode.parseNewick(nwk)
                    translation = translation.trim().split(/\s*,\s*/).map(x => x.split(/\s+/))
                    translation = Object.assign(
                        Object.fromEntries(translation.map((x, i) => [i + 1, x[1]])),
                        Object.fromEntries(translation)
                    )
                    for (const tip of tree.allTips) {
                        if (tip.name && translation[tip.name]) {
                            tip.name = translation[tip.name]
                        }
                    }
                    nwk = tree.toNewickString()
                }
                trees.push({ name: file.name, data: nwk })
            } else if (text) {
                try {
                    VVTreeNode.parseNewick(text).toNewickString()
                    trees.push({ name: file.name, data: text })
                } catch { }
            }
        }
        emit('load', trees.reverse())
    }
}
async function oncopy(e) {
    e.preventDefault()
    e.clipboardData.setData('text/plain', tree.value.toNewickString({ attribute: false }))
    e.clipboardData.setData('vvtree-tree-list', JSON.stringify([config.value]))
}
function copy(e) {
    const range = document.createRange()
    range.selectNodeContents(e.currentTarget)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    document.execCommand('copy')
    selection.removeAllRanges()
}

function onWheel(e) {
    let rect = containerRef.value.getBoundingClientRect()
    let layout = config.value.layout
    if (e.altKey) {
        e.preventDefault()
        let level = 2 ** (-e.deltaY / 1000)
        if (e.shiftKey) {
            config.value.display[layout].width *= level
            containerRef.value.scrollLeft += (e.clientX - rect.left + containerRef.value.scrollLeft) * (level - 1)
        } else {
            config.value.display[layout].height *= level
            containerRef.value.scrollTop += (e.clientY - rect.top + containerRef.value.scrollTop) * (level - 1)
        }
    }
    if (e.ctrlKey) {
        e.preventDefault()
        let level = 2 ** (-e.deltaY / 1000)
        config.value.display[layout].zoom_scale = zoom_scale.value * level
    }
}
onMounted(() => {
    config.value.layout ??= 'rectangular'
})
const vBind = computed(() => {
    let layout = config.value.layout
    return {
        layout,
        'time-scale': config.value.display[layout]?.time_scale,
        'align-tooltip': config.value.display[layout]?.align_tooltip,
        'branch-length': config.value.display[layout]?.branch_length,
        'label-offset': config.value.display[layout]?.label_offset,
        'tip-extension': config.value.display[layout]?.tip_extension,
        'reverse-labels': config.value.display[layout]?.reverse_labels,
        'show-node-labels': config.value.display[layout]?.show_node_labels,
        'show-node-bars': config.value.display[layout]?.show_node_bars,
        dpi: config.value.display[layout]?.dpi,
        theme: {
            plot: {
                margin: config.value.display[layout]?.margin ?? undefined,
                margin_right: config.value.display[layout]?.margin_right ?? undefined,
                margin_left: config.value.display[layout]?.margin_left ?? undefined,
                margin_top: config.value.display[layout]?.margin_top ?? undefined,
                margin_bottom: config.value.display[layout]?.margin_bottom ?? undefined,
            }
        }
    }
})
const treeRef = useTemplateRef('tree-ref')

const stat = computed(() => {
    let t = tree.value
    if (t == null) return null
    return {
        "height": t.height,
        "#nodes": t.allChildren.length,
        "#leaves": t.allTips.length,
    }
})

const nodeInfo = computed(() => {
    if (!activeNode.value) return null
    let depth = config.value.display[config.value.layout].branch_length ? activeNode.value.depth : activeNode.value.step_depth
    let height = config.value.display[config.value.layout].branch_length ? activeNode.value.height : activeNode.value.step_height
    return {
        name: activeNode.value.name,
        label: activeNode.value.label ?? activeNode.value.name,
        depth, height,
        'depth%': depth / (depth + height) * 100 || 0,
        annotations: activeNode.value.annotations,
    }
}, { deep: true })
function onNodeClick(e, c, d) {
    activeNode.value = d
}

const aes_panel_tab = ref(null)

const attributeTargets = ref("current node")
function resetAesthetics(aes) {
    if (config.value.aesthetics?.[aes]) delete config.value.aesthetics[aes]
    tree.value.allNodes.forEach(n => n.attributes[aes] = null)
}
function applyAesthetics(range, aes, funcText) {
    config.value.aesthetics ??= {}
    config.value.aesthetics[aes] = funcText
    let nodes = []
    if (range == 'root') nodes = tree.value.allNodes.toReversed()
    else if (range == 'active') nodes = activeNode.value.allNodes.toReversed()
    else if (range == 'tips') nodes = tree.value?.allTips ?? []
    else if (range == 'activetips') nodes = activeNode.value?.allTips ?? []
    try {
        let fn = new Function("palettes", "return " + funcText)(palettes)
        nodes.forEach(n => n.attributes[aes] = fn(n))
    } catch (e) { console.error(e) }
}
const pxToUnit = { "px": 1, "in": 1 / 96, "cm": 2.54 / 96, "mm": 25.4 / 96 }
const precision = computed(() => 10 ** -Math.ceil(Math.log10(pxToUnit[config.value.display[config.value.layout].unit] ?? 1)))
const unitRatio = computed(() => {
    let { unit = "px", dpi } = config.value.display[config.value.layout]
    if (unit == "px") return (dpi ?? 96) / 96
    return pxToUnit[unit]
})
const w = computed({
    get() { return Math.round(config.value.display[config.value.layout].width * unitRatio.value * precision.value) / precision.value },
    set(v) { config.value.display[config.value.layout].width = v / unitRatio.value }
})
const h = computed({
    get() { return Math.round(config.value.display[config.value.layout].height * unitRatio.value * precision.value) / precision.value },
    set(v) { config.value.display[config.value.layout].height = v / unitRatio.value }
})

defineExpose({ stat })

function downloadAsSvg(svgXml, options) {
    let blob = new Blob([svgXml], { type: 'image/svg+xml' })
    downloadContent(blob, options)
}
function openAsSvg(svgXml) {
    let blob = svg2svg(svgXml)
    openContentWindow(blob)
}
async function downloadAsPng(svgXml, options) {
    let blob = await svg2png(svgXml, { dpi: config.value.display[config.value.layout]?.dpi ?? 96 })
    downloadContent(blob, options)
}
async function openAsPng(svgXml) {
    let blob = await svg2png(svgXml, { dpi: config.value.display[config.value.layout]?.dpi ?? 96 })
    openContentWindow(blob)
}
async function downloadAsPdf(svgXml, options) {
    let blob = await svg2pdf(svgXml)
    downloadContent(blob, options)
}
async function openAsPdf(svgXml) {
    let blob = await svg2pdf(svgXml)
    openContentWindow(blob)
}
</script>

<template>
    <div class="flex flex-1 overflow-hidden gap-1">
        <div class="flex-1 flex flex-col gap-1 overflow-auto">
            <WTextarea v-model.lazy="config.data" class="text-sm border-2 border-gray-300 rounded-md min-h-40"
                @change="buildTree" placeholder="Paste newick string here" @paste="onpaste" />
            <div class="relative z-1">
                <div class="absolute right-2 top-0 flex flex-row">
                    <Popover inline variant="tooltip">
                        <template #trigger>
                            <button class="cursor-pointer text-xl rounded-md p-1 hover:bg-current/5"
                                @click="tree = VVTreeNode.from(VVTreeNode.parseNewick(config.data))">
                                <Icon icon="lucide:undo-2" />
                            </button>
                        </template>
                        reset tree
                    </Popover>
                    <Popover inline variant="tooltip">
                        <template #trigger>
                            <button class="cursor-pointer text-xl rounded-md p-1 hover:bg-current/5" @click="copy"
                                @copy="oncopy">
                                <Icon icon="lucide:clipboard" />
                                <div class="sr-only">copy</div>
                            </button>
                        </template>
                        copy tree to clipboard
                    </Popover>
                </div>
            </div>
            <div class="overflow-auto flex-1" ref="container" @paste="onpaste" @copy="oncopy" tabindex="-1">
                <div :style="{ transform: `scale(${zoom_scale})` }" class="origin-top-left w-max h-max">
                    <Tree ref="tree-ref" v-model:tree="tree" v-model:width="config.display[config.layout].width"
                        v-model:height="config.display[config.layout].height" v-bind="vBind" @wheel="onWheel"
                        @nodeclick.prevent="onNodeClick" resize />
                </div>
            </div>
        </div>
        <div class="overflow-auto row-span-2 flex flex-col gap-1 w-80">
            <WDetails open summary-class="bg-current/10">
                <template #summary>plot settings</template>
                <div class="flex flex-col ml-4 whitespace-nowrap w-min">
                    layout
                    <hr class="text-gray-300">
                    <div class="grid grid-cols-2 ml-2 justify-items-start">
                        <WSelect :options="['rectangular', 'unrooted', 'circular']" v-model="config.layout"
                            class="appearance-none min-w-[1ex] field-sizing-content bg-transparent border-b" />
                        <div class="col-span-full">
                            tip extension:
                            <WInput type="number" v-model.number="config.display[config.layout].tip_extension"
                                :step="0.01" class="w-[5ch]" placeholder="0" />
                            <Icon icon="lucide:x" @click="delete config.display[config.layout].tip_extension"
                                class="inline-block align-middle hover:text-red-500 cursor-pointer" />
                        </div>
                        <div class="col-span-full">
                            label offset:
                            <WInput type="number" v-model.number="config.display[config.layout].label_offset" :step="1"
                                class="w-[4ch]" placeholder="6" />
                            <Icon icon="lucide:x" @click="delete config.display[config.layout].label_offset"
                                class="inline-block align-middle hover:text-red-500 cursor-pointer" />
                        </div>
                        <label>
                            <input type="checkbox" v-model="config.display[config.layout].branch_length">branch length
                        </label>
                        <label>
                            <input type="checkbox" v-model="config.display[config.layout].time_scale">time scale
                        </label>
                        <label v-if="config.layout == 'rectangular' || config.layout == 'circular'">
                            <input type="checkbox" v-model="config.display[config.layout].align_tooltip">align tooltip
                        </label>
                        <label v-if="config.layout == 'unrooted' || config.layout == 'circular'">
                            <input type="checkbox" v-model="config.display[config.layout].reverse_labels">reverse label
                        </label>
                        <label>
                            <input type="checkbox" v-model="config.display[config.layout].show_node_labels">node labels
                        </label>
                        <label v-if="config.layout == 'rectangular' || config.layout == 'circular'">
                            <input type="checkbox" v-model="config.display[config.layout].show_node_bars">node bars
                        </label>
                    </div>
                    plot size
                    <hr class="text-gray-300">
                    <div class="grid grid-cols-2 ml-2">
                        <div class="col-span-full">
                            width:
                            <WInput type="number" v-model.lazy="w" :step="10 / precision" class="w-[6ch]" />
                            <select v-model="config.display[config.layout].unit"
                                class="appearance-none min-w-[1ex] field-sizing-content bg-transparent border-b">
                                <option v-for="_, u in pxToUnit">{{ u }}</option>
                            </select>
                        </div>
                        <div class="col-span-full">
                            height:
                            <WInput type="number" v-model.lazy="h" :step="10 / precision" class="w-[6ch]" />
                            <select v-model="config.display[config.layout].unit"
                                class="appearance-none min-w-[1ex] field-sizing-content bg-transparent border-b">
                                <option v-for="_, u in pxToUnit">{{ u }}</option>
                            </select>
                        </div>
                        <div>
                            <label>
                                zoom:
                                <WInput type="number" v-model.number.lazy="config.display[config.layout].zoom_scale"
                                    :step="0.1" :min="0" class="w-[4ch]" placeholder="1" />
                            </label>
                            <Popover inline variant="tooltip" side="top">
                                <template #trigger>
                                    <Icon icon="lucide:x" @click="delete config.display[config.layout].zoom_scale"
                                        class="inline-block align-middle hover:text-red-500 cursor-pointer" />
                                </template>
                                reset zoom
                            </Popover>
                        </div>
                        <div>
                            DPI:
                            <WInput type="number" v-model.int.lazy="config.display[config.layout].dpi" :step="24"
                                :min="72" class="w-[5ch]" :placeholder="96" />
                            <Popover inline variant="tooltip" side="top">
                                <template #trigger>
                                    <Icon icon="lucide:x" @click="delete config.display[config.layout].dpi"
                                        class="inline-block align-middle hover:text-red-500 cursor-pointer" />
                                </template>
                                reset dpi
                            </Popover>
                        </div>
                    </div>
                    <WCheckInput type="number" v-model.int="config.display[config.layout].margin" class="w-[6ch]"
                        :step="config.layout == 'rectangular' ? 5 : 25">
                        margin:
                    </WCheckInput>
                    <hr class="text-gray-300">
                    <div class="grid grid-rows-2 grid-flow-col ml-2">
                        <WCheckInput type="number" v-model.int="config.display[config.layout].margin_right"
                            class="w-[6ch]" :step="config.layout == 'rectangular' ? 20 : 25">
                            right:
                        </WCheckInput>
                        <WCheckInput type="number" v-model.int="config.display[config.layout].margin_left"
                            class="w-[6ch]" :step="config.layout == 'rectangular' ? 5 : 25">
                            left:
                        </WCheckInput>
                        <WCheckInput type="number" v-model.int="config.display[config.layout].margin_top"
                            class="w-[6ch]" :step="config.layout == 'rectangular' ? 5 : 25">
                            top:
                        </WCheckInput>
                        <WCheckInput type="number" v-model.int="config.display[config.layout].margin_bottom"
                            class="w-[6ch]" :step="config.layout == 'rectangular' ? 5 : 25">
                            bottom:
                        </WCheckInput>
                    </div>
                </div>
            </WDetails>
            <WDetails open summary-class="bg-current/10">
                <template #summary>
                    node
                    <Popover mode="hover" variant="tooltip" inline>
                        <template #trigger>
                            <Icon icon="lucide:circle-question-mark"
                                class="text-blue-500 cursor-help inline-block align-middle" />
                        </template>
                        <p>pick a node by clicking at the node circle</p>
                    </Popover>
                    <Popover mode="hover" variant="tooltip" trigger-class="float-right mr-1">
                        <template #trigger>
                            <button class="align-middle rounded-md px-1 py-1 hover:bg-current/5 whitespace-nowrap"
                                @click="console.info(activeNode)">
                                <Icon icon="lucide:search-code" />
                            </button>
                        </template>
                        <p>dump node to console</p>
                    </Popover>
                    <Popover mode="hover" variant="tooltip" trigger-class="float-right mr-1" v-if="activeNode?.parent">
                        <template #trigger>
                            <button class="align-middle rounded-md px-1 py-1 hover:bg-current/5"
                                @click="activeNode = activeNode.parent">
                                <Icon icon="lucide:git-merge" />
                            </button>
                        </template>
                        <p>select parent node</p>
                    </Popover>
                </template>
                <div class="overflow-auto">
                    <WidgetJsonTable :data="nodeInfo" v-if="nodeInfo" />
                </div>
            </WDetails>
            <WDetails summary-class="bg-current/10" open>
                <template #summary>
                    attributes of
                    <WSelect :options="['current node', 'descendant nodes', 'descendant tips', 'all nodes', 'all tips']"
                        v-model="attributeTargets" />
                    <Popover mode="hover" variant="tooltip" side="left" trigger-class="float-right mr-1">
                        <template #trigger>
                            <button class="align-middle rounded-md px-1 py-1 hover:bg-current/5"
                                @click="aes_panel_tab = 'color'">
                                <Icon icon="lucide:square-function" />
                            </button>
                        </template>
                        <p>apply custom function</p>
                    </Popover>
                </template>
                <div class="flex flex-col px-2 whitespace-nowrap">
                    global
                    <hr class="text-gray-300">
                    <AttributeInput :node="activeNode" :target="attributeTargets" aes="color" type="color"
                        label="color" />
                    point
                    <hr class="text-gray-300">
                    <AttributeInput :node="activeNode" :target="attributeTargets" aes="point_color" type="color"
                        label="color" />
                    <AttributeInput :node="activeNode" :target="attributeTargets" aes="point_size" type="number"
                        :min="1" :step="1" placeholder="6" label="size" />
                    <AttributeInput :node="activeNode" :target="attributeTargets" aes="point_shape" type="option"
                        placeholder="circle" :options="['circle', 'square', 'triangle', 'diamond']" label="shape" />
                    branch
                    <hr class="text-gray-300">
                    <AttributeInput :node="activeNode" :target="attributeTargets" aes="branch_color" type="color"
                        label="color" />
                    <AttributeInput :node="activeNode" :target="attributeTargets" aes="branch_width" type="number"
                        :min="1" :step="1" placeholder="1" label="line width" />
                    <AttributeInput :node="activeNode" :target="attributeTargets" aes="branch_linetype" type="option"
                        :options="['solid', 'dashed', 'dotted', 'dotdash', 'longdash', 'twodash']" placeholder="solid"
                        label="line type" />
                    text
                    <hr class="text-gray-300">
                    <AttributeInput :node="activeNode" :target="attributeTargets" aes="text_label" type="text"
                        :placeholder="activeNode.label ?? activeNode.name ?? '<empty>'" label="label" />
                    <AttributeInput :node="activeNode" :target="attributeTargets" aes="text_color" type="color"
                        label="color" />
                    <AttributeInput :node="activeNode" :target="attributeTargets" aes="text_size" type="number" :min="1"
                        :step="1" placeholder="4" label="size" />
                    <template v-if="config.display[config.layout].show_node_labels && !activeNode.isTip">
                        label
                        <hr class="text-gray-300">
                        <AttributeInput :node="activeNode" :target="attributeTargets" aes="node_anchor_x" type="number"
                            :step="0.1" placeholder="0.5" label="anchor x" />
                        <AttributeInput :node="activeNode" :target="attributeTargets" aes="node_anchor_y" type="number"
                            :step="0.1" placeholder="0.5" label="anchor y" />
                        <AttributeInput :node="activeNode" :target="attributeTargets" aes="node_translate_x"
                            type="number" :step="0.1" placeholder="0" label="translate x" />
                        <AttributeInput :node="activeNode" :target="attributeTargets" aes="node_translate_y"
                            type="number" :step="0.1" placeholder="0" label="translate y" />
                    </template>
                    <template v-if="config.display[config.layout].show_node_bars && !activeNode.isTip">
                        bar
                        <hr class="text-gray-300">
                        <AttributeInput :node="activeNode" :target="attributeTargets" aes="bar_range" type="range"
                            label="range" />
                        <AttributeInput :node="activeNode" :target="attributeTargets" aes="bar_width" type="number"
                            :min="1" :step="1" :placeholder="(activeNode.attributes.branch_width || 1) * 5"
                            label="width" />
                        <AttributeInput :node="activeNode" :target="attributeTargets" aes="bar_color" type="color"
                            label="color" placeholder="#0000FF88" />
                    </template>
                </div>
            </WDetails>
            <WDetails summary-class="bg-current/10" open>
                <template #summary>export</template>
                <div class="inline-flex">
                    <Popover inline variant="tooltip" side="top" :open-delay="0" class="whitespace-nowrap">
                        <template #trigger>
                            <button class="cursor-pointer inline rounded-md px-2 py-1 hover:bg-current/5 rounded-r-none"
                                @click="downloadAsSvg(treeRef.plot.serialize(), { filename: `${config?.name ?? 'tree'}.svg` })">
                                <Icon icon="lucide:download" class="text-xl inline-block align-middle" />SVG
                            </button>
                        </template>
                        download SVG file
                    </Popover>
                    <Popover align="end" variant="contextmenu" trigger-class="flex">
                        <template #trigger>
                            <button
                                class="cursor-pointer inline text-xl rounded-md px-1 py-1 hover:bg-current/5 rounded-l-none">
                                <Icon icon="lucide:chevron-down" />
                            </button>
                        </template>
                        <div class="flex flex-col">
                            <button @click="openAsSvg(treeRef.plot.serialize())" class="px-2 py-1 hover:bg-current/5">
                                <Icon icon="lucide:square-arrow-out-up-right"
                                    class="text-xl inline-block align-middle" />
                                open in new tab
                            </button>
                        </div>
                    </Popover>
                </div>
                <div class="inline-flex">
                    <Popover inline variant="tooltip" side="top" :open-delay="0" class="whitespace-nowrap">
                        <template #trigger>
                            <button class="cursor-pointer inline rounded-md px-2 py-1 hover:bg-current/5 rounded-r-none"
                                @click="downloadAsPng(treeRef.plot.serialize(), { filename: `${config?.name ?? 'tree'}.png` })">
                                <Icon icon="lucide:download" class="text-xl inline-block align-middle" />PNG
                            </button>
                        </template>
                        download PNG file
                    </Popover>
                    <Popover align="end" variant="contextmenu" trigger-class="flex">
                        <template #trigger>
                            <button
                                class="cursor-pointer inline text-xl rounded-md px-1 py-1 hover:bg-current/5 rounded-l-none">
                                <Icon icon="lucide:chevron-down" />
                            </button>
                        </template>
                        <div class="flex flex-col">
                            <button @click="openAsPng(treeRef.plot.serialize())" class="px-2 py-1 hover:bg-current/5">
                                <Icon icon="lucide:square-arrow-out-up-right"
                                    class="text-xl inline-block align-middle" />
                                open in new tab
                            </button>
                        </div>
                    </Popover>
                </div>
                <div class="inline-flex">
                    <Popover inline variant="tooltip" side="top" :open-delay="0" class="whitespace-nowrap">
                        <template #trigger>
                            <button class="cursor-pointer inline rounded-md px-2 py-1 hover:bg-current/5 rounded-r-none"
                                @click="downloadAsPdf(treeRef.plot.serialize(), { filename: `${config?.name ?? 'tree'}.pdf` })">
                                <Icon icon="lucide:download" class="text-xl inline-block align-middle" />PDF
                            </button>
                        </template>
                        download PDF file
                    </Popover>
                    <Popover align="end" variant="contextmenu" trigger-class="flex">
                        <template #trigger>
                            <button
                                class="cursor-pointer inline text-xl rounded-md px-1 py-1 hover:bg-current/5 rounded-l-none">
                                <Icon icon="lucide:chevron-down" />
                            </button>
                        </template>
                        <div class="flex flex-col">
                            <button @click="openAsPdf(treeRef.plot.serialize())" class="px-2 py-1 hover:bg-current/5">
                                <Icon icon="lucide:square-arrow-out-up-right"
                                    class="text-xl inline-block align-middle" />
                                open in new tab
                            </button>
                        </div>
                    </Popover>
                </div>
            </WDetails>
        </div>
        <AestheticsWizard :config="config.aesthetics" v-model:tab="aes_panel_tab" @apply="applyAesthetics"
            @clear="resetAesthetics" />
    </div>
</template>
