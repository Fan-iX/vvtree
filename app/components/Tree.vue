<script setup>
import { computed, nextTick, ref, watch, useTemplateRef } from 'vue'
import Contextmenu from './widget/Contextmenu.vue'
import ContextmenuSubmenu from './widget/ContextmenuSubmenu.vue'
import WTextarea from './widget/Textarea.vue'
import { TreeNode } from '#base/js/tree.js'

defineOptions({ inheritAttrs: false })
const { branchLength, layout } = defineProps({
    branchLength: { type: Boolean, default: true },
    layout: { type: String, default: 'rectangular' },
})
const tree = defineModel("tree", { type: Object })
const linkMenu = useTemplateRef('link-menu')
const nodeMenu = useTemplateRef('node-menu')
const emit = defineEmits(['change'])
async function onLinkClick(e, c, d) {
    if (e.button == 2) {
        e.preventDefault()
        let action = await linkMenu.value.show()
        if (action == 'reroot') {
            if (layout == "rectangular") {
                let d0 = d.$rectangular, d1 = d.parent.$rectangular
                let ratio = (c.x - d0.x) / (d1.x - d0.x)
                emit('change', tree.value = TreeNode.reroot(d, ratio))
            } else if (layout == "unrooted") {
                let d0 = d.$unrooted, d1 = d.parent.$unrooted
                let ratio = Math.hypot(c.x - d0.x, c.y - d0.y) / Math.hypot(d1.x - d0.x, d1.y - d0.y)
                emit('change', tree.value = TreeNode.reroot(d, ratio))
            }
        } else if (action == 'cutout') {
            d.parent = null
            emit('change', tree.value = d)
        } else if (action == 'drop') {
            let p = d.parent
            if (!p) return
            p.children.splice(p.children.indexOf(d), 1)
            d.parent = null
            if (p.children.length == 1) {
                let s = p.children[0]
                if (p.parent == null) {
                    p.children = []
                    s.parent = null
                    emit('change', tree.value = s)
                } else {
                    if (s.branch_length && p.branch_length) s.branch_length += p.branch_length
                    else s.branch_length ??= p.branch_length
                    s.parent = p.parent
                    p.parent.children[p.parent.children.indexOf(p)] = s
                    emit('change', tree.value)
                    prerender()
                }
            } else {
                emit('change', tree.value)
                prerender()
            }
        }
    }
}
let rendering = false
function prerender() {
    if (rendering) return
    rendering = true
    tree.value?.prerender({ layout, branch_length: branchLength })
    nextTick(() => rendering = false)
}
watch([tree, () => layout, () => branchLength], prerender, { immediate: true })
const activeNode = ref()
async function onNodeClick(e, c, d) {
    if (e.button == 2) {
        e.preventDefault()
        activeNode.value = d
        let action = await nodeMenu.value.show(d)
        if (action == 'reroot') {
            emit('change', tree.value = TreeNode.reroot(d))
        } else if (action == 'cutout') {
            d.parent = null
            emit('change', tree.value = d)
        } else if (action == 'toggle') {
            if (+d.children?.length == 0) return
            d.$collapsed = !d.$collapsed
            tree.value?.prerender({ layout, branch_length: branchLength })
        } else if (action == 'swap') {
            if (+d.children?.length == 0) return
            d.children.reverse()
            emit('change', tree.value)
            tree.value?.prerender({ layout, branch_length: branchLength })
        } else if (action == 'ladderize') {
            if (+d.children?.length == 0) return
            d.ladderize()
            emit('change', tree.value)
            tree.value?.prerender({ layout, branch_length: branchLength })
        } else if (action == 'drop') {
            let p = d.parent
            if (!p) return
            p.children.splice(p.children.indexOf(d), 1)
            d.parent = null
            if (p.children.length == 1) {
                let s = p.children[0]
                if (p.parent == null) {
                    p.children = []
                    s.parent = null
                    emit('change', tree.value = s)
                } else {
                    if (s.branch_length && p.branch_length) s.branch_length += p.branch_length
                    else s.branch_length ??= p.branch_length
                    s.parent = p.parent
                    p.parent.children[p.parent.children.indexOf(p)] = s
                    emit('change', tree.value)
                    prerender()
                }
            } else {
                emit('change', tree.value)
                prerender()
            }
        }
    }
}
const width = defineModel('width', { type: Number })
const height = defineModel('height', { type: Number })
const nTips = computed(() => tree.value?.allTips?.length)
watch([nTips, height], ([n, h], [on, oh]) => {
    if (layout != "rectangular") return
    if (on <= 1) height.value = n * 20
    else if (h == oh) height.value *= n / on
})
const exportSettings = ref({
    branch_length: true, node_label: true,
    annotation: true, attribute: false,
})
const vvtree = useTemplateRef('vvtree')
defineExpose({ get plot() { return vvtree.value?.plot } })
</script>
<template>
    <VVTree ref="vvtree" v-bind="$attrs" :width="width" @update:width="width = Math.round($event)" :height="height"
        @update:height="height = Math.round($event)" :branchLength v-model:tree="tree" :layout="layout"
        @nodeclick="onNodeClick" @linkclick="onLinkClick" />
    <Contextmenu ref="link-menu" v-slot="{ hide }" align="start">
        <button class="text-left px-2 py-1 hover:bg-current/5" @click="hide('reroot')">
            <Icon icon="lucide:git-commit-horizontal" class="text-xl inline-block align-middle" />
            reroot here
        </button>
        <button class="text-left px-2 py-1 hover:bg-current/5" @click="hide('drop')">
            <Icon icon="lucide:scissors" class="text-xl inline-block align-middle" />
            drop out this branch
        </button>
        <button class="text-left px-2 py-1 hover:bg-current/5" @click="hide('cutout')">
            <Icon icon="lucide:scissors" class="text-xl -scale-x-100 inline-block align-middle" />
            keep subtree from here
        </button>
    </Contextmenu>
    <Contextmenu ref="node-menu" v-slot="{ hide, data }" align="start" class="flex flex-col">
        <button class="text-left px-2 py-1 hover:bg-current/5" @click="hide('reroot')" v-if="data?.parent != null">
            <Icon icon="lucide:git-commit-horizontal" class="text-xl inline-block align-middle" />
            reroot here
        </button>
        <button class="text-left px-2 py-1 hover:bg-current/5" @click="hide('drop')">
            <Icon icon="lucide:scissors" class="text-xl inline-block align-middle" />
            drop out this branch
        </button>
        <button class="text-left px-2 py-1 hover:bg-current/5" @click="hide('cutout')">
            <Icon icon="lucide:scissors" class="text-xl -scale-x-100 inline-block align-middle" />
            keep subtree from here
        </button>
        <button class="text-left px-2 py-1 hover:bg-current/5" @click="hide('toggle')">
            <Icon icon="lucide:eye" class="text-xl inline-block align-middle" />
            show/hide children
        </button>
        <button class="text-left px-2 py-1 hover:bg-current/5" @click="hide('swap')" v-if="data?.children?.length">
            <Icon icon="lucide:git-compare-arrows" class="text-xl inline-block align-middle" />
            swap children
        </button>
        <button class="text-left px-2 py-1 hover:bg-current/5" @click="hide('ladderize')" v-if="data?.children?.length">
            <Icon icon="lucide:arrow-up-narrow-wide" class="text-xl inline-block align-middle" />
            ladderize
        </button>
        <ContextmenuSubmenu>
            <template #trigger>
                <Icon icon="lucide:git-graph" class="text-xl -scale-x-100 inline-block align-middle" />
                tips
            </template>
            <WTextarea class="whitespace-nowrap" :rows="10" :value="activeNode?.allTips?.map(d => d.name).join('\n')"
                readonly />
        </ContextmenuSubmenu>
        <ContextmenuSubmenu>
            <template #trigger>
                <Icon icon="lucide:git-fork" class="text-xl rotate-90 inline-block align-middle" />
                newick
            </template>
            <p class="inline-flex flex-row flex-wrap p-2 gap-2">
                <label v-for="v, k in exportSettings" class="text-sm whitespace-nowrap">
                    <input type="checkbox" v-model="exportSettings[k]">
                    {{ k }}
                </label>
            </p>
            <WTextarea class="text-sm border-2 border-gray-300 rounded-md break-anywhere" readonly
                :modelValue="activeNode?.toNewickString?.(exportSettings)" :rows="10" />
        </ContextmenuSubmenu>
    </Contextmenu>
</template>
