<script setup>
import { computed, ref, useTemplateRef } from 'vue'
import BioTreeStudio from './components/TreeStudio.vue'
import WidgetDragList from './components/widget/DragList.vue'
import Popover from './components/widget/Popover.vue'
import TreeWizard from './components/TreeWizard.vue'

import { useLocalStorage } from '@vueuse/core'
const treeRef = useTemplateRef('tree-ref')

const tree_data = useLocalStorage('tree-studio-storage', [{ name: "New tree", data: "" }])
const idx = ref(0)
const current_tree = computed(() => tree_data.value[idx.value])
const show_wizard = ref(false)

function add_tree({
    name = "New tree", data = "", width = 600
} = {}) {
    tree_data.value.unshift({
        name, data, width, margin_left: 5, margin_right: 120, branch_length: true,
        layout: 'rectangular',
    })
    idx.value = 0
}
function remove_tree(i) {
    if (tree_data.value.length == 1) {
        tree_data.value = [{ name: "New tree", data: "" }]
    } else {
        tree_data.value.splice(i, 1)
    }
    idx.value = Math.min(idx.value, tree_data.value.length - 1)
}
function loadtree(trees) {
    for (const tree of trees) {
        add_tree(tree)
    }
}

function reorderTree(i, j) {
    let source = tree_data.value[i]
    tree_data.value.splice(i, 1)
    tree_data.value.splice(j > i ? j - 1 : j, 0, source)
    if (idx.value == i) {
        idx.value = j > i ? j - 1 : j
    } else if (i < idx.value && j >= idx.value) {
        idx.value -= 1
    } else if (i > idx.value && j <= idx.value) {
        idx.value += 1
    }
}
</script>

<template>
    <div class="flex flex-row h-full overflow-hidden" @paste="onpaste">
        <div class="flex flex-col w-64 justify-between gap-1">
            <div class="flex flex-row justify-center items-center gap-1">
                <div>My trees</div>
                <Popover mode="hover" variant="tooltip" side="bottom">
                    <template #trigger>
                        <button class="align-middle hover:text-green-500 cursor-pointer" @click="add_tree()">
                            <Icon icon="lucide:plus" />
                        </button>
                    </template>
                    add new tree
                </Popover>
                <Popover mode="hover" variant="tooltip" side="bottom">
                    <template #trigger>
                        <button class="align-middle hover:text-blue-500 cursor-pointer"
                            @click="show_wizard = !show_wizard">
                            <Icon icon="lucide:file-input" />
                        </button>
                    </template>
                    load from newick/nexus file
                </Popover>
            </div>
            <div class="flex-1 overflow-auto">
                <WidgetDragList @reorder="reorderTree">
                    <div class="flex flex-row flex-1 overflow-auto items-center" v-for="item, i in tree_data">
                        <Icon icon="lucide:x" @click="remove_tree(i)" class="hover:text-red-500 cursor-pointer" />
                        <div @click="idx = i" class="flex-1 overflow-auto scrollbar-none whitespace-nowrap"
                            :class="i == idx ? 'bg-gray-200 hover:bg-gray-300 smooth-scroll' : 'hover:bg-gray-100 cursor-pointer'">
                            <input v-if="i == idx" v-model="item.name"
                                class="outline-none bg-gray-200 field-sizing-content border-b" />
                            <span v-else class="cursor-text" :title="item.name">{{ item.name }}</span>
                        </div>
                    </div>
                </WidgetDragList>
            </div>
            <div class="grid grid-cols-[auto_1fr] gap-x-1 w-full" v-if="current_tree != null">
                <span>name:</span>
                <span class="text-ellipsis overflow-hidden">{{ current_tree.name }}</span>
                <template v-for="v, k in treeRef?.stat">
                    <span>{{ k }}:</span>
                    <span class="text-ellipsis overflow-hidden">{{ v }}</span>
                </template>
            </div>
        </div>
        <BioTreeStudio v-model:config="current_tree" ref="tree-ref" />
        <TreeWizard v-model:open="show_wizard" @load="loadtree" ref="wizard" />
    </div>
</template>
