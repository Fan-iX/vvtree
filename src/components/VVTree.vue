<script setup>
import { computed, useTemplateRef } from 'vue'
import { VVTreeNode } from '#base/js/vvtree.js'
import { vvbreak, vvlabel, vvscale } from 'vvplot'
import { VVPlot, VVAxisX, VVAxisY, VVGeomCurve, VVGeomSegment, VVGeomMarkdown, VVGeomPoint, VVGeomMarkdownsegment } from 'vvplot'

const {
    branchLength, timeScale,
    color, pointSize, textSize, branchWidth, linetype,
    layout, theme: $theme, resize,
    alignTooltip, labelOffset
} = defineProps({
    branchLength: { type: Boolean, default: true },
    timeScale: Boolean,
    color: { type: String, default: 'black' },
    pointSize: { type: Number, default: 6 },
    textSize: { type: Number, default: 4 },
    branchWidth: { type: Number, default: 1 },
    linetype: { type: String, default: 'solid' },
    layout: { type: String, default: 'rectangular' },
    alignTooltip: Boolean,
    labelOffset: { type: Number, default: 6 },
    theme: null, resize: null,
})
const tree = defineModel("tree", { type: VVTreeNode })

const nodes = computed(() => tree.value?._allNodes ?? [])
const branchNodes = computed(() => nodes.value.filter(d => !d.isRoot))
const tipNodes = computed(() => nodes.value.filter(d => d.isTip).reverse())
const tipX = computed(() => nodes.value.reduce((a, d) => Math.max(a, d.$rectangular.x), 0))

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
    if (branchLength && layout == 'rectangular') {
        let min = 0, max = tree.value?.height
        let breaks = breaker({ min, max })
        return {
            breaks: breaks.map(x => max - x),
            labels: breaks.map(labeler)
        }
    } else {
        return {
            labels: (d, i, a) => labeler(-d, i, a)
        }
    }
})

const theme = computed(() => [
    { axis_v: null, grid: null, },
    layout == "rectangular" ? { plot: { margin: 0, margin_left: 5, margin_right: 120 } } : null,
    layout == "unrooted" ? { plot: { margin: 40 } } : null,
    { plot: { padding_bottom: 25 } },
].concat($theme).filter(x => x != null))

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

const fn_points = d => [{ x: d.$rectangular.x, y: d.$rectangular.y }, { x: d.parent.$rectangular.x, y: d.$rectangular.y }, { x: d.parent.$rectangular.x, y: d.parent.$rectangular.y }]
</script>
<template>
    <VVPlot ref="plot" :theme="theme" :resize="resize" :clip="false" @contextmenu.prevent :scales>
        <template #axis>
            <VVAxisY :expand-add="layout == 'rectangular' ? 0.5 : 0" :expand-mult="0" position="none" />
            <VVAxisX :expand-mult="0" v-bind="axisBinding" />
        </template>
        <template v-if="layout == 'rectangular'">
            <VVGeomCurve :data="branchNodes" :points="fn_points" :color="fn_branch_color" :linewidth="fn_branch_width"
                :linetype="fn_branch_linetype" fill="none" interpolate="linear" />
            <VVGeomSegment :data="branchNodes" :x="d => d.$rectangular.x" :y="d => d.$rectangular.y"
                :xend="d => d.parent.$rectangular.x" :yend="d => d.$rectangular.y" color="transparent" :linewidth="10"
                @click="linkclick" @contextmenu="linkclick" class="vvplot-interactive" />
            <VVGeomMarkdown :data="tipNodes" :x="alignTooltip ? tipX : d => d.$rectangular.x" :y="d => d.$rectangular.y"
                :label="fn_text_label" :color="fn_text_color" :size="fn_text_size" :anchor-x="0"
                :translate-x="labelOffset" />
            <VVGeomPoint :data="nodes" :x="d => d.$rectangular.x" :y="d => d.$rectangular.y" :size="fn_point_size"
                :color="fn_point_color" :shape="fn_point_shape" @click="nodeclick" @contextmenu="nodeclick"
                class="cursor-pointer" render="svg" />
            <VVGeomPoint :data="nodes" :x="d => d.$rectangular.x" :y="d => d.$rectangular.y" color="transparent"
                @click="nodeclick" @contextmenu="nodeclick" :size="6" class="cursor-pointer vvplot-interactive"
                render="svg" />
            <VVGeomSegment v-if="alignTooltip" :data="tipNodes" :x="d => d.$rectangular.x" :y="d => d.$rectangular.y"
                :xend="tipX" :color="fn_branch_color" :linewidth="fn_branch_width" linetype="dashed" />
        </template>
        <template v-if="layout == 'unrooted'">
            <VVGeomSegment :data="branchNodes" :x="d => d.$unrooted.x" :y="d => d.$unrooted.y"
                :xend="d => d.parent.$unrooted.x" :yend="d => d.parent.$unrooted.y" :color="fn_branch_color"
                :linewidth="fn_branch_width" :linetype="fn_branch_linetype" fill="none" />
            <VVGeomSegment :data="branchNodes" :x="d => d.$unrooted.x" :y="d => d.$unrooted.y"
                :xend="d => d.parent.$unrooted.x" :yend="d => d.parent.$unrooted.y" color="transparent" :linewidth="10"
                @click="linkclick" @contextmenu="linkclick" class="vvplot-interactive" />
            <VVGeomMarkdownsegment :data="tipNodes" :xend="d => d.$unrooted.x" :yend="d => d.$unrooted.y"
                :label="fn_text_label" :x="d => d.$unrooted.parent.$unrooted.x"
                :y="d => d.$unrooted.parent.$unrooted.y" :color="fn_text_color" :size="fn_text_size" text-align="post"
                :inset="labelOffset" />
            <VVGeomPoint :data="branchNodes" :x="d => d.$unrooted.x" :y="d => d.$unrooted.y" :size="fn_point_size"
                :color="fn_point_color" @click="nodeclick" @contextmenu="nodeclick" class="cursor-pointer"
                render="svg" />
            <VVGeomPoint :data="nodes" :x="d => d.$unrooted.x" :y="d => d.$unrooted.y" color="transparent"
                @click="nodeclick" @contextmenu="nodeclick" :size="6" class="cursor-pointer vvplot-interactive"
                render="svg" />
        </template>
    </VVPlot>
</template>
