<script setup>
import { computed, useTemplateRef } from 'vue'
import { VVTreeNode } from '#base/js/vvtree.js'
import { vvlabel, vvscale } from 'vvplot'
import { VVPlot, VVAxisX, VVAxisY, VVGeomSegment, VVGeomPoint, VVGeomMarkdownsegment } from 'vvplot'

const {
    branchLength, timeScale,
    color, pointSize, textSize, branchWidth, linetype, theme: $theme,
    showNodeLabels, reverseLabels, labelOffset, tipExtension,
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

const fn_tip_x = d => d.$unrooted.x + tipDelta.value * Math.cos(d.$unrooted.theta)
const fn_tip_y = d => d.$unrooted.y + tipDelta.value * Math.sin(d.$unrooted.theta)
const vbind_tip_label = computed(() => {
    if (reverseLabels) {
        function isRev(theta) { return theta > Math.PI / 2 && theta < 3 * Math.PI / 2 }
        return {
            x: d => isRev(d.$unrooted.theta) ? fn_tip_x(d) : d.$unrooted.parent.$unrooted.x,
            y: d => isRev(d.$unrooted.theta) ? fn_tip_y(d) : d.$unrooted.parent.$unrooted.y,
            xend: d => isRev(d.$unrooted.theta) ? d.$unrooted.parent.$unrooted.x : fn_tip_x(d),
            yend: d => isRev(d.$unrooted.theta) ? d.$unrooted.parent.$unrooted.y : fn_tip_y(d),
            'text-align': d => isRev(d.$unrooted.theta) ? 'pre' : 'post'
        }
    } else {
        return {
            x: d => d.$unrooted.parent.$unrooted.x,
            y: d => d.$unrooted.parent.$unrooted.y,
            xend: fn_tip_x,
            yend: fn_tip_y,
            'text-align': 'post'
        }
    }
})
const vbind_node_label = computed(() => {
    if (reverseLabels) {
        function isRev(theta) { return theta > Math.PI / 2 && theta < 3 * Math.PI / 2 }
        return {
            x: d => isRev(d.$unrooted.theta) ? d.$unrooted.x : d.$unrooted.parent.$unrooted.x,
            y: d => isRev(d.$unrooted.theta) ? d.$unrooted.y : d.$unrooted.parent.$unrooted.y,
            xend: d => isRev(d.$unrooted.theta) ? d.$unrooted.parent.$unrooted.x : d.$unrooted.x,
            yend: d => isRev(d.$unrooted.theta) ? d.$unrooted.parent.$unrooted.y : d.$unrooted.y,
            'text-align': d => isRev(d.$unrooted.theta) ? 'pre' : 'post'
        }
    } else {
        return {
            x: d => d.$unrooted.parent.$unrooted.x,
            y: d => d.$unrooted.parent.$unrooted.y,
            xend: d => d.$unrooted.x,
            yend: d => d.$unrooted.y,
            'text-align': 'post'
        }
    }
})

const emit = defineEmits(["nodeclick", "linkclick"])

function linkclick(...args) {
    emit('linkclick', ...args)
}
function nodeclick(...args) {
    emit('nodeclick', ...args)
}

let labeler = vvlabel.number()
const axisBinding = computed(() => {
    if (!timeScale) return { position: 'none' }
    return { labels: (d, i, a) => labeler(-d, i, a) }
})

const theme = computed(() => [
    { axis_v: null, grid: null, },
    { plot: { margin: 40, padding_bottom: 25 } },
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
const fn_node_anchor_x = d => d.attributes?.node_anchor_x ?? 0.5
const fn_node_anchor_y = d => d.attributes?.node_anchor_y
const fn_node_translate_x = d => d.attributes?.node_translate_x
const fn_node_translate_y = d => d.attributes?.node_translate_y
</script>
<template>
    <VVPlot ref="plot" :theme="theme" :clip="false" @contextmenu.prevent :scales>
        <template #axis>
            <VVAxisY :expand-add="0" :expand-mult="0" position="none" />
            <VVAxisX :expand-mult="0" v-bind="axisBinding" />
        </template>
        <VVGeomPoint v-if="activeNode" :data="[activeNode]" :x="d => d.$unrooted.x" :y="d => d.$unrooted.y"
            :size="fn_point_size" color="#ff7f7f" stroke="#ff7f7f" :linewidth="1" :shape="fn_point_shape"
            class="vvplot-interactive pointer-events-none" render="svg" />
        <VVGeomSegment :data="branchNodes" :x="d => d.$unrooted.x" :y="d => d.$unrooted.y"
            :xend="d => d.parent.$unrooted.x" :yend="d => d.parent.$unrooted.y" :color="fn_branch_color"
            :linewidth="fn_branch_width" :linetype="fn_branch_linetype" fill="none" />
        <VVGeomSegment :data="branchNodes" :x="d => d.$unrooted.x" :y="d => d.$unrooted.y"
            :xend="d => d.parent.$unrooted.x" :yend="d => d.parent.$unrooted.y" color="transparent" :linewidth="10"
            @click="linkclick" @contextmenu="linkclick" class="vvplot-interactive" />
        <VVGeomMarkdownsegment v-if="showNodeLabels" :data="intermediateNodes" v-bind="vbind_node_label"
            :label="fn_text_label" :color="fn_text_color" :size="fn_text_size" :anchor-x="fn_node_anchor_x"
            :anchor-y="fn_node_anchor_y" :translate-x="fn_node_translate_x" :translate-y="fn_node_translate_y" />
        <VVGeomMarkdownsegment :data="tipNodes" v-bind="vbind_tip_label" :label="fn_text_label" :color="fn_text_color"
            :size="fn_text_size" :inset="labelOffset" />
        <VVGeomSegment v-if="tipExtension" :data="tipNodes" :x="fn_tip_x" :y="fn_tip_y" :xend="d => d.$unrooted.x"
            :yend="d => d.$unrooted.y" :color="fn_branch_color" :linewidth="fn_branch_width" linetype="dashed" />
        <VVGeomPoint :data="branchNodes" :x="d => d.$unrooted.x" :y="d => d.$unrooted.y" :size="fn_point_size"
            :color="fn_point_color" :shape="fn_point_shape" @click="nodeclick" @contextmenu="nodeclick"
            class="cursor-pointer" render="svg" />
        <VVGeomPoint :data="nodes" :x="d => d.$unrooted.x" :y="d => d.$unrooted.y" color="transparent"
            @click="nodeclick" @contextmenu="nodeclick" :size="6" class="cursor-pointer vvplot-interactive"
            render="svg" />
    </VVPlot>
</template>
