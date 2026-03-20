<script setup>
import { computed, useTemplateRef, watch } from 'vue'
import { VVTreeNode } from '#base/js/vvtree.js'
import { vvbreak, vvlabel, vvscale } from 'vvplot'
import { VVPlot, VVAxisX, VVAxisY, VVGeomCurve, VVGeomSegment, VVGeomMarkdown, VVGeomPoint, VVGeomMarkdownsegment } from 'vvplot'

const {
    branchLength, timeScale,
    color, pointSize, textSize, branchWidth, linetype,
    layout, theme: $theme, resize, reverseLabels, angleStart, angleExpand,
    alignTooltip, labelOffset, tipExtension,
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
    reverseLabels: Boolean,
    labelOffset: { type: Number, default: 6 },
    tipExtension: { type: Number, default: 0 },
    angleStart: { type: Number, default: 0 },
    angleExpand: { type: Number, default: 360 },
    theme: null, resize: null,
})
const tree = defineModel("tree", { type: VVTreeNode })

const nodes = computed(() => tree.value?._allNodes ?? [])
const branchNodes = computed(() => nodes.value.filter(d => !d.isRoot))
const tipNodes = computed(() => nodes.value.filter(d => d.isTip).reverse())
const treeHeight = computed(() => branchLength ? tree.value?.height ?? 0 : tree.value.step_height ?? 0)
const tipDelta = computed(() => treeHeight.value * tipExtension)
const tipX = computed(() => nodes.value.reduce((a, d) => Math.max(a, d.$rectangular.x), 0) + tipDelta.value)
const tipR = computed(() => nodes.value.reduce((a, d) => Math.max(a, d.$circular.r), 0) + tipDelta.value)
const fn_rectangular_points = d => [
    { x: d.$rectangular.x, y: d.$rectangular.y },
    { x: d.parent.$rectangular.x, y: d.$rectangular.y },
    { x: d.parent.$rectangular.x, y: d.parent.$rectangular.y },
]
const fn_rectangular_tip_x = d => alignTooltip ? tipX.value + tipDelta.value : d.$rectangular.x + tipDelta.value

const fn_circular_points = d => [
    { x: 0, y: 0 },
    circular_xy(d.parent.$circular),
    circular_xy({ r: d.parent.$circular.r, t: d.$circular.t }),
    circular_xy(d.$circular),
]
function circular_x({ r, t }) {
    return r * Math.cos((angleStart + t * angleExpand) / 180 * Math.PI)
}
function circular_y({ r, t }) {
    return r * Math.sin((angleStart + t * angleExpand) / 180 * Math.PI)
}
function circular_xy({ r, t }) {
    return {
        x: r * Math.cos((angleStart + t * angleExpand) / 180 * Math.PI),
        y: r * Math.sin((angleStart + t * angleExpand) / 180 * Math.PI)
    }
}
const fn_circular_tip_x = d => alignTooltip ? circular_x({ r: tipR.value + tipDelta.value, t: d.$circular.t }) : circular_x({ r: d.$circular.r + tipDelta.value, t: d.$circular.t })
const fn_circular_tip_y = d => alignTooltip ? circular_y({ r: tipR.value + tipDelta.value, t: d.$circular.t }) : circular_y({ r: d.$circular.r + tipDelta.value, t: d.$circular.t })
const vbind_circular_label = computed(() => {
    if (reverseLabels) {
        function isRev(t) { return angleStart + t * angleExpand > 90 && angleStart + t * angleExpand < 270 }
        return {
            x: d => isRev(d.$circular.t) ? fn_circular_tip_x(d) : circular_x({ r: d.parent.$circular.r, t: d.$circular.t }),
            y: d => isRev(d.$circular.t) ? fn_circular_tip_y(d) : circular_y({ r: d.parent.$circular.r, t: d.$circular.t }),
            xend: d => isRev(d.$circular.t) ? circular_x({ r: d.parent.$circular.r, t: d.$circular.t }) : fn_circular_tip_x(d),
            yend: d => isRev(d.$circular.t) ? circular_y({ r: d.parent.$circular.r, t: d.$circular.t }) : fn_circular_tip_y(d),
            'text-align': d => isRev(d.$circular.t) ? 'pre' : 'post'
        }
    } else {
        return {
            x: d => circular_x({ r: d.parent.$circular.r, t: d.$circular.t }),
            y: d => circular_y({ r: d.parent.$circular.r, t: d.$circular.t }),
            xend: fn_circular_tip_x,
            yend: fn_circular_tip_y,
            'text-align': 'post'
        }
    }
})

const fn_unrooted_tip_x = d => d.$unrooted.x + (d.isTip ? tipDelta.value * Math.cos(d.$unrooted.theta) : 0)
const fn_unrooted_tip_y = d => d.$unrooted.y + (d.isTip ? tipDelta.value * Math.sin(d.$unrooted.theta) : 0)
const vbind_unrooted_label = computed(() => {
    if (reverseLabels) {
        function isRev(theta) { return theta > Math.PI / 2 && theta < 3 * Math.PI / 2 }
        return {
            x: d => isRev(d.$unrooted.theta) ? fn_unrooted_tip_x(d) : d.$unrooted.parent.$unrooted.x,
            y: d => isRev(d.$unrooted.theta) ? fn_unrooted_tip_y(d) : d.$unrooted.parent.$unrooted.y,
            xend: d => isRev(d.$unrooted.theta) ? d.$unrooted.parent.$unrooted.x : fn_unrooted_tip_x(d),
            yend: d => isRev(d.$unrooted.theta) ? d.$unrooted.parent.$unrooted.y : fn_unrooted_tip_y(d),
            'text-align': d => isRev(d.$unrooted.theta) ? 'pre' : 'post'
        }
    } else {
        return {
            x: d => d.$unrooted.parent.$unrooted.x,
            y: d => d.$unrooted.parent.$unrooted.y,
            xend: fn_unrooted_tip_x,
            yend: fn_unrooted_tip_y,
            'text-align': 'post'
        }
    }
})

function curveCircularBranch(context) {
    let points = []
    return {
        lineStart: () => { points = [] },
        point: (x, y) => { points.push([x, y]) },
        lineEnd: () => {
            if (points.length == 4) {
                const [c, p1, p2, t] = points
                context.moveTo(...p1)
                let x1sq = (p1[0] - c[0]) ** 2, y1sq = (p1[1] - c[1]) ** 2,
                    x2sq = (p2[0] - c[0]) ** 2, y2sq = (p2[1] - c[1]) ** 2,
                    det = x1sq * y2sq - x2sq * y1sq,
                    u = (y2sq - y1sq) / det, v = (x1sq - x2sq) / det
                if (u > 0 && v > 0) {
                    let rx = Math.sqrt(1 / u), ry = Math.sqrt(1 / v)
                    let a1 = Math.atan2((p1[1] - c[1]) / ry, (p1[0] - c[0]) / rx),
                        a2 = Math.atan2((p2[1] - c[1]) / ry, (p2[0] - c[0]) / rx)
                    if (context.ellipse) {
                        context.ellipse(c[0], c[1], rx, ry, 0, a1, a2, Math.sin(a2 - a1) < 0)
                    } else if (context._append) {
                        context._ += `A${rx},${ry},0,0,${Math.sin(a2 - a1) > 0 ? 1 : 0},${p2[0]},${p2[1]}`
                    }
                }
                context.lineTo(...t)
            }
        }
    }
}

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
</script>
<template>
    <VVPlot ref="plot" :theme="theme" :resize="resize" :clip="false" @contextmenu.prevent :scales>
        <template #axis>
            <VVAxisY :expand-add="layout == 'rectangular' ? 0.5 : 0" :expand-mult="0" position="none" />
            <VVAxisX :expand-mult="0" v-bind="axisBinding" />
        </template>
        <template v-if="layout == 'rectangular'">
            <VVGeomCurve :data="branchNodes" :points="fn_rectangular_points" :color="fn_branch_color"
                :linewidth="fn_branch_width" :linetype="fn_branch_linetype" fill="none" interpolate="linear" />
            <VVGeomSegment :data="branchNodes" :x="d => d.$rectangular.x" :y="d => d.$rectangular.y"
                :xend="d => d.parent.$rectangular.x" :yend="d => d.$rectangular.y" color="transparent" :linewidth="10"
                @click="linkclick" @contextmenu="linkclick" class="vvplot-interactive" />
            <VVGeomMarkdown :data="tipNodes" :x="fn_rectangular_tip_x" :y="d => d.$rectangular.y" :label="fn_text_label"
                :color="fn_text_color" :size="fn_text_size" :anchor-x="0" :translate-x="labelOffset" />
            <VVGeomSegment v-if="alignTooltip || tipExtension" :data="tipNodes" :x="fn_rectangular_tip_x"
                :y="d => d.$rectangular.y" :xend="d => d.$rectangular.x" :color="fn_branch_color"
                :linewidth="fn_branch_width" linetype="dashed" />
            <VVGeomPoint :data="nodes" :x="d => d.$rectangular.x" :y="d => d.$rectangular.y" :size="fn_point_size"
                :color="fn_point_color" :shape="fn_point_shape" @click="nodeclick" @contextmenu="nodeclick"
                class="cursor-pointer" render="svg" />
            <VVGeomPoint :data="nodes" :x="d => d.$rectangular.x" :y="d => d.$rectangular.y" color="transparent"
                @click="nodeclick" @contextmenu="nodeclick" :size="6" class="cursor-pointer vvplot-interactive"
                render="svg" />
        </template>
        <template v-if="layout == 'circular'">
            <VVGeomCurve :data="branchNodes" :points="fn_circular_points" :color="fn_branch_color"
                :linewidth="fn_branch_width" :interpolate="curveCircularBranch" :linetype="fn_branch_linetype"
                fill="none" />
            <VVGeomSegment :data="branchNodes" :x="d => circular_x(d.$circular)" :y="d => circular_y(d.$circular)"
                :xend="d => circular_x({ r: d.parent.$circular.r, t: d.$circular.t })"
                :yend="d => circular_y({ r: d.parent.$circular.r, t: d.$circular.t })" color="transparent"
                :linewidth="10" @click="linkclick" @contextmenu="linkclick" class="vvplot-interactive" />
            <VVGeomMarkdownsegment :data="tipNodes" v-bind="vbind_circular_label" :label="fn_text_label"
                :color="fn_text_color" :size="fn_text_size" :anchor-x="0" :inset="labelOffset" />
            <VVGeomSegment v-if="alignTooltip || tipExtension" :data="tipNodes" :x="fn_circular_tip_x"
                :y="fn_circular_tip_y" :xend="d => circular_x(d.$circular)" :yend="d => circular_y(d.$circular)"
                :color="fn_branch_color" :linewidth="fn_branch_width" linetype="dashed" />
            <VVGeomPoint :data="branchNodes" :x="d => circular_x(d.$circular)" :y="d => circular_y(d.$circular)"
                :size="fn_point_size" :color="fn_point_color" @click="nodeclick" @contextmenu="nodeclick"
                class="cursor-pointer" render="svg" />
            <VVGeomPoint :data="nodes" :x="d => circular_x(d.$circular)" :y="d => circular_y(d.$circular)"
                color="transparent" @click="nodeclick" @contextmenu="nodeclick" :size="6"
                class="cursor-pointer vvplot-interactive" render="svg" />
        </template>
        <template v-if="layout == 'unrooted'">
            <VVGeomSegment :data="branchNodes" :x="d => d.$unrooted.x" :y="d => d.$unrooted.y"
                :xend="d => d.parent.$unrooted.x" :yend="d => d.parent.$unrooted.y" :color="fn_branch_color"
                :linewidth="fn_branch_width" :linetype="fn_branch_linetype" fill="none" />
            <VVGeomSegment :data="branchNodes" :x="d => d.$unrooted.x" :y="d => d.$unrooted.y"
                :xend="d => d.parent.$unrooted.x" :yend="d => d.parent.$unrooted.y" color="transparent" :linewidth="10"
                @click="linkclick" @contextmenu="linkclick" class="vvplot-interactive" />
            <VVGeomMarkdownsegment :data="tipNodes" :label="fn_text_label" :color="fn_text_color" :size="fn_text_size"
                v-bind="vbind_unrooted_label" :inset="labelOffset" />
            <VVGeomSegment v-if="tipExtension" :data="tipNodes" :x="fn_unrooted_tip_x" :y="fn_unrooted_tip_y"
                :xend="d => d.$unrooted.x" :yend="d => d.$unrooted.y" :color="fn_branch_color"
                :linewidth="fn_branch_width" linetype="dashed" />
            <VVGeomPoint :data="branchNodes" :x="d => d.$unrooted.x" :y="d => d.$unrooted.y" :size="fn_point_size"
                :color="fn_point_color" @click="nodeclick" @contextmenu="nodeclick" class="cursor-pointer"
                render="svg" />
            <VVGeomPoint :data="nodes" :x="d => d.$unrooted.x" :y="d => d.$unrooted.y" color="transparent"
                @click="nodeclick" @contextmenu="nodeclick" :size="6" class="cursor-pointer vvplot-interactive"
                render="svg" />
        </template>
    </VVPlot>
</template>
