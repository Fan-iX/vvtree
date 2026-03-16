<script setup>
import { computed, ref, useTemplateRef, provide } from 'vue'
import BioTreeStudio from './components/TreeStudio.vue'
import WidgetDragList from './components/widget/DragList.vue'
import Popover from './components/widget/Popover.vue'
import TreeImportWizard from './components/TreeImportWizard.vue'
import TreeExportWizard from './components/TreeExportWizard.vue'

import { useLocalStorage } from '@vueuse/core'
provide('panel-z-max', ref(0))
const treeRef = useTemplateRef('tree-ref')

const tree_data = useLocalStorage('tree-studio-storage', [{
    name: "New tree", data: "", layout: 'rectangular', display: {
        rectangular: { margin_left: 5, margin_right: 120, branch_length: true, },
        unrooted: { margin: 120, branch_length: true, }
    },
}])
const idx = ref(0)
const current_tree = computed(() => tree_data.value[idx.value])
const show_import_wizard = ref(false)
const show_export_wizard = ref(false)

function add_tree(tree = {}) {
    tree.name ??= "New tree"
    tree.data ??= ""
    tree.layout ??= 'rectangular'
    tree.display ??= {
        rectangular: { margin_left: 5, margin_right: 120, branch_length: true, },
        unrooted: { margin: 120, branch_length: true, }
    }
    tree_data.value.unshift(tree)
}
function remove_tree(i) {
    tree_data.value.splice(i, 1)
    if (tree_data.value.length == 0) add_tree()
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
                    create new tree
                </Popover>
                <Popover mode="hover" variant="tooltip" side="bottom">
                    <template #trigger>
                        <button class="align-middle hover:text-blue-500 cursor-pointer"
                            @click="show_import_wizard = !show_import_wizard">
                            <Icon icon="lucide:file-input" />
                        </button>
                    </template>
                    import from newick/nexus file or clipboard
                </Popover>
                <Popover mode="hover" variant="tooltip" side="bottom">
                    <template #trigger>
                        <button class="align-middle hover:text-blue-500 cursor-pointer"
                            @click="show_export_wizard = !show_export_wizard">
                            <Icon icon="lucide:clipboard-copy" class="-scale-x-100" />
                        </button>
                    </template>
                    export trees
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
        <BioTreeStudio v-model:config="current_tree" ref="tree-ref" @load="loadtree" />
        <TreeImportWizard v-model:open="show_import_wizard" @load="loadtree" />
        <TreeExportWizard v-model:open="show_export_wizard" :trees="tree_data" />
    </div>
</template>
