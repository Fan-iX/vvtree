<script setup>
import WidgetJsonTable from './widget/JsonTable.vue'
import WidgetColorPicker from './widget/ColorPicker.vue'
import WTextarea from './widget/Textarea.vue'
import WInput from './widget/Input.vue'
import WSelectInput from './widget/SelectInput.vue'
import WDetails from './widget/Details.vue'
import WCheckInput from './widget/CheckInput.vue'
import Popover from './widget/Popover.vue'
import AestheticsWizard from './AestheticsWizard.vue'
import AttributeInput from './AttributeInput.vue'
import BioTree from './Tree.vue'

import { downloadContent, openContentWindow, palettes, svg2png, svg2pdf, svg2svg } from '../js/utils.js'
import { ref, computed, watch, onMounted, useTemplateRef } from 'vue'
import { VVTreeNode } from '#base/js/vvtree.js'
const config = defineModel("config")

const tree = ref()
const activeNode = ref()
const containerRef = useTemplateRef('container')

watch([tree, config], ([nt, nc], [ot, oc]) => {
    if (nc != oc) {
        tree.value = VVTreeNode.parseNewick(nc.newick ?? nc.data)
        config.value.height ??= containerRef.value?.clientHeight
        config.value.width ??= containerRef.value?.clientWidth
        activeNode.value = tree.value
    } else {
        config.value.newick = nt?.toNewickString?.()
    }
}, { deep: true, immediate: true })

function buildTree() {
    tree.value = VVTreeNode.from(VVTreeNode.parseNewick(config.value.data))
}

async function onpaste(e) {
    if (!e.clipboardData.files.length) return
    config.value.data = await e.clipboardData.files[0].text()
    buildTree()
}

function onWheel(e) {
    let rect = containerRef.value.getBoundingClientRect()
    if (e.altKey) {
        e.preventDefault()
        let level = 2 ** (-e.deltaY / 1000)
        if (e.shiftKey) {
            config.value.width *= level
            containerRef.value.scrollLeft += (e.clientX - rect.left + containerRef.value.scrollLeft) * (level - 1)
        } else {
            config.value.height *= level
            containerRef.value.scrollTop += (e.clientY - rect.top + containerRef.value.scrollTop) * (level - 1)
        }
    }
    if (e.ctrlKey) {
        e.preventDefault()
        let level = 2 ** (-e.deltaY / 1000)
        zoom_scale.value *= level
    }
}
onMounted(() => {
    config.value.height ??= containerRef.value?.clientHeight
    config.value.width ??= containerRef.value?.clientWidth
})
const theme = computed(() => ({
    plot: {
        margin: config.value.margin || undefined,
        margin_right: config.value.margin_right || undefined,
        margin_left: config.value.margin_left || undefined,
        margin_top: config.value.margin_top || undefined,
        margin_bottom: config.value.margin_bottom || undefined,
    }
}))
const biotree = useTemplateRef('biotree')

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
    let depth = config.value.branch_length ? activeNode.value.depth : activeNode.value.step_depth
    let height = config.value.branch_length ? activeNode.value.height : activeNode.value.step_height
    return {
        name: activeNode.value.name,
        label: activeNode.value.label ?? activeNode.value.name,
        depth, height,
        'depth%': depth / (depth + height) * 100,
        annotation: activeNode.value.annotations,
    }
})
function onNodeClick(e, c, d) {
    activeNode.value = d
}

function gatherFromDescendants(aes) {
    activeNode.value.allNodes.toReversed().filter(n => !n.isTip).forEach(n => {
        let attr = n.children[0]?.attributes[aes]
        if (n.children.every(c => c.attributes[aes] === attr))
            n.attributes[aes] = attr
    })
}
function applyToDescendants(aes) {
    let val = activeNode.value.attributes[aes]
    activeNode.value.allChildren.forEach(n => n.attributes[aes] = val)
}
const aes_panel_tab = ref(null)

function toggleAesPanel(aes) {
    aes_panel_tab.value = aes != aes_panel_tab.value ? aes : null
}
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
    let blob = await svg2png(svgXml)
    downloadContent(blob, options)
}
async function openAsPng(svgXml) {
    let blob = await svg2png(svgXml)
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
const zoom_scale = ref(1)
</script>

<template>
    <div class="grid grid-rows-[10em_1fr] grid-cols-[1fr_clamp(18em,25%,20em)] flex-1 overflow-hidden gap-x-1">
        <WTextarea v-model.lazy="config.data" class="text-sm border-2 border-gray-300 rounded-md" @change="buildTree"
            placeholder="Paste newick string here" @paste="onpaste" />
        <div class="overflow-auto row-span-2 flex flex-col gap-1">
            <WDetails open summary-class="bg-current/10">
                <template #summary>plot settings</template>
                <div class="flex flex-col ml-4 whitespace-nowrap w-min">
                    layout
                    <hr class="text-gray-300">
                    <div class="grid grid-cols-2 ml-2 justify-items-start">
                        <select v-model="config.layout"
                            class="appearance-none min-w-[1ex] field-sizing-content bg-transparent border-b">
                            <option value="rectangular">rectangular</option>
                            <option value="unrooted">unrooted</option>
                        </select>
                        <label class="col-span-full">
                            label offset:
                            <WInput type="number" v-model.number="config.label_offset" :step="1" class="w-[6ch]"
                                placeholder="6" />
                        </label>
                        <label>
                            <input type="checkbox" v-model="config.branch_length">branch length
                        </label>
                        <label>
                            <input type="checkbox" v-model="config.time_scale">time scale
                        </label>
                        <label v-if="config.layout == 'rectangular'">
                            <input type="checkbox" v-model="config.align_tooltip">align tooltip
                        </label>
                    </div>
                    plot size
                    <hr class="text-gray-300">
                    <div class="grid grid-cols-2 ml-2">
                        <label>
                            width:
                            <WInput type="number" v-model.int="config.width" :step="10" class="w-[6ch]" />
                        </label>
                        <label>
                            height:
                            <WInput type="number" v-model.int="config.height" :step="10" class="w-[6ch]" />
                        </label>
                        <div>
                            <label>
                                zoom:
                                <WInput type="number" v-model.number="zoom_scale" :step="0.1" class="w-[4ch]" />
                            </label>
                            <Popover inline variant="tooltip" side="top">
                                <template #trigger>
                                    <Icon icon="lucide:x" @click="zoom_scale = 1"
                                        class="inline-block align-middle hover:text-red-500 cursor-pointer" />
                                </template>
                                reset zoom
                            </Popover>
                        </div>
                    </div>
                    <WCheckInput type="number" v-model.int="config.margin" class="w-[6ch]"
                        :step="config.layout == 'rectangular' ? 5 : 25">
                        margin:
                    </WCheckInput>
                    <hr class="text-gray-300">
                    <div class="grid grid-rows-2 grid-flow-col ml-2">
                        <WCheckInput type="number" v-model.int="config.margin_right" class="w-[6ch]"
                            :step="config.layout == 'rectangular' ? 20 : 25">
                            right:
                        </WCheckInput>
                        <WCheckInput type="number" v-model.int="config.margin_left" class="w-[6ch]"
                            :step="config.layout == 'rectangular' ? 5 : 25">
                            left:
                        </WCheckInput>
                        <WCheckInput type="number" v-model.int="config.margin_top" class="w-[6ch]"
                            :step="config.layout == 'rectangular' ? 5 : 25">
                            top:
                        </WCheckInput>
                        <WCheckInput type="number" v-model.int="config.margin_bottom" class="w-[6ch]"
                            :step="config.layout == 'rectangular' ? 5 : 25">
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
                </template>
                <div class="ml-2">
                    <Popover mode="hover" variant="tooltip" inline>
                        <template #trigger>
                            <button class="align-middle rounded-md px-1 py-1 hover:bg-current/5 whitespace-nowrap"
                                @click="console.info(activeNode)">
                                <Icon icon="lucide:search-code" class="text-lg" />
                            </button>
                        </template>
                        <p>dump node to console</p>
                    </Popover>
                    <Popover mode="hover" variant="tooltip" inline v-if="activeNode.parent">
                        <template #trigger>
                            <button class="align-middle rounded-md px-1 py-1 hover:bg-current/5"
                                @click="activeNode = activeNode.parent">
                                <Icon icon="lucide:git-merge" class="text-lg" />
                            </button>
                        </template>
                        <p>select parent node</p>
                    </Popover>
                </div>
                <div class="overflow-auto">
                    <WidgetJsonTable :data="nodeInfo" v-if="nodeInfo" />
                </div>
            </WDetails>
            <WDetails summary-class="bg-current/10" open>
                <template #summary>node attributes</template>
                <div class="flex flex-col px-2 whitespace-nowrap">
                    global
                    <hr class="text-gray-300">
                    <AttributeInput @spread="applyToDescendants" @gather="gatherFromDescendants" @panel="toggleAesPanel"
                        aes="color">
                        color:
                        <WidgetColorPicker v-model="activeNode.attributes.color" />
                        <Icon icon="lucide:x" @click="activeNode.attributes.color = null"
                            class="inline-block align-middle hover:text-red-500 cursor-pointer" />
                    </AttributeInput>
                    point
                    <hr class="text-gray-300">
                    <AttributeInput @spread="applyToDescendants" @gather="gatherFromDescendants" @panel="toggleAesPanel"
                        aes="point_color">
                        color:
                        <WidgetColorPicker v-model="activeNode.attributes.point_color" />
                        <Icon icon="lucide:x" @click="activeNode.attributes.point_color = null"
                            class="inline-block align-middle hover:text-red-500 cursor-pointer" />
                    </AttributeInput>
                    <AttributeInput @spread="applyToDescendants" @gather="gatherFromDescendants" @panel="toggleAesPanel"
                        aes="point_size">
                        size:
                        <WInput type="number" :min="1" :step="1" v-model="activeNode.attributes.point_size"
                            placeholder="6" />
                        <Icon icon="lucide:x" @click="activeNode.attributes.point_size = null"
                            class="inline-block align-middle hover:text-red-500 cursor-pointer" />
                    </AttributeInput>
                    <AttributeInput @spread="applyToDescendants" @gather="gatherFromDescendants" @panel="toggleAesPanel"
                        aes="point_shape">
                        shape:
                        <WSelectInput v-model="activeNode.attributes.point_shape"
                            :options="['circle', 'square', 'triangle', 'diamond']" placeholder="circle" />
                        <Icon icon="lucide:x" @click="activeNode.attributes.point_shape = null"
                            class="inline-block align-middle hover:text-red-500 cursor-pointer" />
                    </AttributeInput>
                    branch
                    <hr class="text-gray-300">
                    <AttributeInput @spread="applyToDescendants" @gather="gatherFromDescendants" @panel="toggleAesPanel"
                        aes="branch_color">
                        color:
                        <WidgetColorPicker v-model="activeNode.attributes.branch_color" />
                        <Icon icon="lucide:x" @click="activeNode.attributes.branch_color = null"
                            class="inline-block align-middle hover:text-red-500 cursor-pointer" />
                    </AttributeInput>
                    <AttributeInput @spread="applyToDescendants" @gather="gatherFromDescendants" @panel="toggleAesPanel"
                        aes="branch_width">
                        line width:
                        <WInput type="number" :min="1" :step="1" v-model="activeNode.attributes.branch_width"
                            placeholder="1" />
                        <Icon icon="lucide:x" @click="activeNode.attributes.branch_width = null"
                            class="inline-block align-middle hover:text-red-500 cursor-pointer" />
                    </AttributeInput>
                    <AttributeInput @spread="applyToDescendants" @gather="gatherFromDescendants" @panel="toggleAesPanel"
                        aes="branch_linetype">
                        line type:
                        <WSelectInput v-model="activeNode.attributes.branch_linetype"
                            :options="['solid', 'dashed', 'dotted', 'dotdash', 'longdash', 'twodash']"
                            placeholder="solid" />
                    </AttributeInput>
                    text
                    <hr class="text-gray-300">
                    <AttributeInput @spread="applyToDescendants" @gather="gatherFromDescendants" @panel="toggleAesPanel"
                        aes="text_label">
                        label:
                        <WInput v-model="activeNode.attributes.text_label"
                            :placeholder="activeNode.label ?? activeNode.name ?? '<empty>'" />
                        <Icon icon="lucide:x" @click="activeNode.attributes.text_label = null"
                            class="inline-block align-middle hover:text-red-500 cursor-pointer" />
                    </AttributeInput>
                    <AttributeInput @spread="applyToDescendants" @gather="gatherFromDescendants" @panel="toggleAesPanel"
                        aes="text_color">
                        color:
                        <WidgetColorPicker v-model="activeNode.attributes.text_color" />
                        <Icon icon="lucide:x" @click="activeNode.attributes.text_color = null"
                            class="inline-block align-middle hover:text-red-500 cursor-pointer" />
                    </AttributeInput>
                    <AttributeInput @spread="applyToDescendants" @gather="gatherFromDescendants" @panel="toggleAesPanel"
                        aes="text_size">
                        size:
                        <WInput type="number" :min="1" :step="1" v-model="activeNode.attributes.text_size"
                            placeholder="4" />
                        <Icon icon="lucide:x" @click="activeNode.attributes.text_size = null"
                            class="inline-block align-middle hover:text-red-500 cursor-pointer" />
                    </AttributeInput>
                </div>
            </WDetails>
            <WDetails summary-class="bg-current/10" open>
                <template #summary>export</template>
                <div class="inline-flex">
                    <Popover inline variant="tooltip" side="top" :open-delay="0" class="whitespace-nowrap">
                        <template #trigger>
                            <button class="cursor-pointer inline rounded-md px-2 py-1 hover:bg-current/5 rounded-r-none"
                                @click="downloadAsSvg(biotree.plot.serialize(), { filename: `${config?.name ?? 'tree'}.svg` })">
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
                            <button @click="openAsSvg(biotree.plot.serialize())" class="px-2 py-1 hover:bg-current/5">
                                <Icon icon="lucide:square-arrow-out-up-right"
                                    class="text-xl inline-block align-middle" /> open in
                                new tab
                            </button>
                        </div>
                    </Popover>
                </div>
                <div class="inline-flex">
                    <Popover inline variant="tooltip" side="top" :open-delay="0" class="whitespace-nowrap">
                        <template #trigger>
                            <button class="cursor-pointer inline rounded-md px-2 py-1 hover:bg-current/5 rounded-r-none"
                                @click="downloadAsPng(biotree.plot.serialize(), { filename: `${config?.name ?? 'tree'}.png` })">
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
                            <button @click="openAsPng(biotree.plot.serialize())" class="px-2 py-1 hover:bg-current/5">
                                <Icon icon="lucide:square-arrow-out-up-right"
                                    class="text-xl inline-block align-middle" /> open in
                                new tab
                            </button>
                        </div>
                    </Popover>
                </div>
                <div class="inline-flex">
                    <Popover inline variant="tooltip" side="top" :open-delay="0" class="whitespace-nowrap">
                        <template #trigger>
                            <button class="cursor-pointer inline rounded-md px-2 py-1 hover:bg-current/5 rounded-r-none"
                                @click="downloadAsPdf(biotree.plot.serialize(), { filename: `${config?.name ?? 'tree'}.pdf` })">
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
                            <button @click="openAsPdf(biotree.plot.serialize())" class="px-2 py-1 hover:bg-current/5">
                                <Icon icon="lucide:square-arrow-out-up-right"
                                    class="text-xl inline-block align-middle" /> open in
                                new tab
                            </button>
                        </div>
                    </Popover>
                </div>
            </WDetails>
        </div>
        <div class="overflow-auto relative" ref="container">
            <div :style="{ transform: `scale(${zoom_scale})`, width: `${config.width * zoom_scale}px`, height: `${config.height * zoom_scale}px` }"
                class="origin-top-left">
                <BioTree ref="biotree" v-model:tree="tree" :theme="theme" :branch-length="config.branch_length"
                    :time-scale="config.time_scale" :align-tooltip="config.align_tooltip" v-model:width="config.width"
                    v-model:height="config.height" :layout="config.layout" :label-offset="config.label_offset"
                    @wheel="onWheel" @nodeclick.prevent="onNodeClick" resize />
            </div>
            <div class="absolute right-2 top-0 flex flex-row">
                <Popover inline variant="tooltip">
                    <template #trigger>
                        <button class="cursor-pointer inline text-xl rounded-md px-1 py-1 hover:bg-current/5"
                            @click="tree = VVTreeNode.from(VVTreeNode.parseNewick(config.data))">
                            <Icon icon="lucide:undo-2" />
                        </button>
                    </template>
                    reset tree
                </Popover>
            </div>
        </div>
        <AestheticsWizard :config="config.aesthetics" v-model:tab="aes_panel_tab" @apply="applyAesthetics"
            @clear="resetAesthetics" />
    </div>
</template>
