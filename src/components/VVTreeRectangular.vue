<script setup>
import { computed, useTemplateRef } from 'vue'
import { VVTreeNode } from '#base/js/vvtree.js'
import { vvbreak, vvlabel, vvscale } from 'vvplot'
import { VVPlot, VVAxisX, VVAxisY, VVGeomCurve, VVGeomSegment, VVGeomMarkdown, VVGeomPoint, } from 'vvplot'

const {
    branchLength, timeScale,
    color, pointSize, textSize, branchWidth, linetype, theme: $theme,
    showNodeLabels, showNodeBars, alignTooltip, labelOffset, tipExtension,
    activeNode,
} = defineProps({
    branchLength: { type: Boolean, default: true },
    timeScale: Boolean,
    color: { type: String, default: 'black' },
    pointSize: { type: Number, default: 6 },
    textSize: { type: Number, default: 4 },
    branchWidth: { type: Number, default: 1 },
    linetype: { type: String, default: 'solid' },
    theme: null,
    showNodeLabels: Boolean, showNodeBars: Boolean,
    alignTooltip: Boolean,
    reverseLabels: Boolean,
    labelOffset: { type: Number, default: 6 },
    tipExtension: { type: Number, default: 0 },
    angleStart: { type: Number, default: 0 },
    angleExpand: { type: Number, default: 360 },
    activeNode: VVTreeNode,
})
const tree = defineModel("tree", { type: VVTreeNode })

const nodes = computed(() => tree.value?._allNodes ?? [])
const branchNodes = computed(() => nodes.value.filter(d => !d.isRoot))
const intermediateNodes = computed(() => branchNodes.value.filter(d => !d.isTip))
const tipNodes = computed(() => nodes.value.filter(d => d.isTip).reverse())
const treeHeight = computed(() => branchLength ? tree.value?.height ?? 0 : tree.value.step_height ?? 0)
const tipDelta = computed(() => treeHeight.value * tipExtension)
const tipX = computed(() => nodes.value.reduce((a, d) => Math.max(a, d.$rectangular.x), 0) + tipDelta.value)
const fn_points = d => [
    { x: d.$rectangular.x, y: d.$rectangular.y },
    { x: d.parent.$rectangular.x, y: d.$rectangular.y },
    { x: d.parent.$rectangular.x, y: d.parent.$rectangular.y },
]
const fn_tip_x = d => alignTooltip ? tipX.value + tipDelta.value : d.$rectangular.x + tipDelta.value
const vbind_node_bar = computed(() => ({
    x: d => d.$rectangular.x + (d.attributes?.bar_range?.[0] || 0),
    y: d => d.$rectangular.y,
    xend: d => d.$rectangular.x + (d.attributes?.bar_range?.[1] || 0),
}))

const emit = defineEmits(["nodeclick", "linkclick"])

function linkclick(...args) {
    emit('linkclick', ...args)
}
function nodeclick(...args) {
    emit('nodeclick', ...args)
}

let breaker = vvbreak.number()
let labeler = vvlabel.number()
const axisBinding = computed(() => {
    if (!timeScale) return { position: 'none' }
    if (branchLength) {
        let min = 0, max = tree.value?.height
        let breaks = breaker({ min, max })
        return {
            breaks: breaks.map(x => max - x),
            labels: breaks.map(labeler)
        }
    } else {
        return { labels: (d, i, a) => labeler(-d, i, a) }
    }
})

const theme = computed(() => [
    { axis_v: null, grid: null, },
    { plot: { margin: 0, margin_left: 5, margin_right: 120, padding_bottom: 25 } },
].concat($theme))

const plot = useTemplateRef('plot')
defineExpose({ plot })

const scales = {
    color: vvscale.color.identity(),
    size: vvscale.size.identity(),
    linewidth: vvscale.linewidth.identity(),
    linetype: vvscale.linetype.identity(),
}
const fn_point_color = d => d.attributes?.point_color ?? d.attributes?.color ?? color
const fn_point_size = d => d.attributes?.point_size ?? pointSize
const fn_point_shape = d => d.attributes?.point_shape ?? 'circle'
const fn_branch_color = d => d.attributes?.branch_color ?? d.attributes?.color ?? color
const fn_branch_width = d => d.attributes?.branch_width ?? branchWidth
const fn_branch_linetype = d => d.attributes?.branch_linetype ?? linetype
const fn_text_size = d => d.attributes?.text_size ?? textSize
const fn_text_color = d => d.attributes?.text_color ?? d.attributes?.color ?? color
const fn_text_label = d => d.attributes?.text_label ?? d.label ?? d.name
const fn_bar_width = d => d.attributes?.bar_width ?? branchWidth * 5
const fn_bar_color = d => d.attributes?.bar_color ?? "#0000FF88"
const fn_node_anchor_x = d => d.attributes?.node_anchor_x
const fn_node_anchor_y = d => d.attributes?.node_anchor_y
const fn_node_translate_x = d => d.attributes?.node_translate_x
const fn_node_translate_y = d => d.attributes?.node_translate_y
</script>
<template>
    <VVPlot ref="plot" :theme="theme" :clip="false" @contextmenu.prevent :scales>
        <template #axis>
            <VVAxisY :expand-add="0.5" :expand-mult="0" position="none" />
            <VVAxisX :expand-mult="0" v-bind="axisBinding" />
        </template>
        <VVGeomPoint v-if="activeNode" :data="[activeNode]" :x="d => d.$rectangular.x" :y="d => d.$rectangular.y"
            :size="fn_point_size" color="#ff7f7f" stroke="#ff7f7f" :linewidth="1" :shape="fn_point_shape"
            class="vvplot-interactive pointer-events-none" render="svg" />
        <VVGeomCurve :data="branchNodes" :points="fn_points" :color="fn_branch_color" :linewidth="fn_branch_width"
            :linetype="fn_branch_linetype" fill="none" interpolate="linear" />
        <VVGeomSegment :data="branchNodes" :x="d => d.$rectangular.x" :y="d => d.$rectangular.y"
            :xend="d => d.parent.$rectangular.x" :yend="d => d.$rectangular.y" color="transparent" :linewidth="10"
            @click="linkclick" @contextmenu="linkclick" class="vvplot-interactive" />
        <VVGeomMarkdown v-if="showNodeLabels" :data="intermediateNodes" :x="d => d.$rectangular.x"
            :y="d => d.$rectangular.y" :label="fn_text_label" :color="fn_text_color" :size="fn_text_size"
            :anchor-x="fn_node_anchor_x" :anchor-y="fn_node_anchor_y" :translate-x="fn_node_translate_x"
            :translate-y="fn_node_translate_y" />
        <VVGeomMarkdown :data="tipNodes" :x="fn_tip_x" :y="d => d.$rectangular.y" :label="fn_text_label"
            :color="fn_text_color" :size="fn_text_size" :anchor-x="0" :translate-x="labelOffset" />
        <VVGeomSegment v-if="alignTooltip || tipExtension" :data="tipNodes" :x="fn_tip_x" :y="d => d.$rectangular.y"
            :xend="d => d.$rectangular.x" :color="fn_branch_color" :linewidth="fn_branch_width" linetype="dashed" />
        <VVGeomSegment v-if="showNodeBars" :data="nodes" v-bind="vbind_node_bar" :color="fn_bar_color"
            :linewidth="fn_bar_width" />
        <VVGeomPoint :data="nodes" :x="d => d.$rectangular.x" :y="d => d.$rectangular.y" :size="fn_point_size"
            :color="fn_point_color" :shape="fn_point_shape" @click="nodeclick" @contextmenu="nodeclick"
            class="cursor-pointer" render="svg" />
        <VVGeomPoint :data="nodes" :x="d => d.$rectangular.x" :y="d => d.$rectangular.y" color="transparent"
            @click="nodeclick" @contextmenu="nodeclick" :size="6" class="cursor-pointer vvplot-interactive"
            render="svg" />
    </VVPlot>
</template>
