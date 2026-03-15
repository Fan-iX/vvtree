<script setup>
import { ref } from 'vue'
import { useFileDialog } from '@vueuse/core'
import FloatingPanel from './widget/FloatingPanel.vue'
import Popover from './widget/Popover.vue'
import { TreeNode } from '#base/js/tree.js'
const emit = defineEmits(['load'])

const trees = ref([])

const { open: open_file, onChange } = useFileDialog()
onChange((files) => { for (const file of files) loadFile(file) })
function onpaste(e) {
    if (e.clipboardData.getData('vvtree-tree-list')) {
        for (let tree of JSON.parse(e.clipboardData.getData('vvtree-tree-list'))) {
            trees.value.push({ name: tree.name, format: "vvtree", newick: tree.data, tree })
        }
    } else if (e.clipboardData.files.length > 0) {
        for (const file of e.clipboardData.files) loadFile(file)
    } else if (e.clipboardData.getData('text/plain')) {
        loadFile(new File([e.clipboardData.getData('text/plain')], 'tree', { type: 'text/plain' }))
    }
}
async function loadFile(file) {
    const text = await file.text()
    if (text == null) return
    if (text.match(/begin trees;\s*(?:translate(.*?);)?.*^\s*(tree.*?[;\n$])/sim)) {
        let [, translation, newick] = text.match(/begin trees;\s*(?:translate(.*?);)?.*^\s*(tree.*?[;\n$])/sim)
        newick = newick.replace(/^.*?=(\s+\[\S+\])?\s+/, "")
        let newick2 = newick
        if (translation) {
            let tree = TreeNode.parseNewick(newick)
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
            newick2 = tree.toNewickString()
        }
        trees.value.push({ name: file.name, format: "nexus", translate: false, newick, newick2, translation })
    } else {
        try {
            TreeNode.parseNewick(text).toNewickString()
            trees.value.push({ name: file.name, format: "newick", newick: text })
        } catch {
            trees.value.push({ name: file.name, format: "invalid" })
        }
    }
}
function checkAll(val) {
    for (const tree of trees.value) {
        if (tree.translate != null) tree.translate = val
    }
}

function apply() {
    let tree_data = trees.value.map(({ name, format, tree, translate, newick, newick2 }) => {
        if (format == "invalid") return null
        if (format == "vvtree") return { ...tree, name }
        if (format == "newick") return { name, data: newick }
        if (format == "nexus") return { name, data: translate ? newick2 : newick }
    }).filter(x => x != null).reverse()
    emit('load', tree_data)
    trees.value = []
}
</script>
<template>
    <FloatingPanel :width="800" :height="400" content-class="flex flex-col gap-1" title="Import tree from file"
        class="max-w-full overflow-auto" @paste="onpaste">
        <div>
            <button @click="open_file" title="pick a newick/nexus file"
                class="cursor-pointer rounded-md px-2 py-1 hover:bg-current/5">
                <Icon icon="lucide:file-up" class="inline-block" />
                pick file
            </button>
        </div>
        <div class="flex-1 overflow-auto">
            <table
                class="border-collapse [&_th]:border [&_th]:border-slate-300 [&_td]:border [&_td]:border-slate-300 whitespace-nowrap w-full">
                <tr>
                    <th class="min-w-4"></th>
                    <th class="px-2">Name</th>
                    <th class="px-2">Format</th>
                    <th class="px-2">
                        <input type="checkbox" @change="checkAll($event.currentTarget.checked)"> Translate
                        <Popover inline variant="tooltip">
                            <template #trigger>
                                <Icon icon="lucide:circle-question-mark"
                                    class="text-blue-500 text-lg cursor-help inline-block" />
                            </template>
                            apply nexus translation block to tip labels
                        </Popover>
                    </th>
                    <th class="w-full">Tree</th>
                </tr>
                <tr v-for="tree, i in trees">
                    <td>
                        <Icon icon="lucide:x" @click="trees.splice(i, 1)" class="hover:text-red-500 cursor-pointer" />
                    </td>
                    <td><input type="text" v-model="tree.name" class="outline-none field-sizing-content border-b"></td>
                    <td>{{ tree.format }}</td>
                    <td class="text-center">
                        <Popover side="right" inline variant="tooltip" v-if="tree.translation">
                            <template #trigger>
                                <input type="checkbox" v-model="tree.translate" class="align-middle">
                            </template>
                            <pre>{{Object.entries(tree.translation).map(x => x.join('\t')).join('\n') || '<no translation>'}}</pre>
                        </Popover>
                    </td>
                    <td class="font-mono overflow-x-auto max-w-[40ch]">{{ tree.translate ? tree.newick2 : tree.newick }}
                    </td>
                </tr>
            </table>
        </div>
        <div class="flex flex-row-reverse">
            <button class="text-white bg-green-500 cursor-pointer rounded-md px-2 py-1 hover:bg-green-500/75"
                @click="apply">
                Apply
            </button>
        </div>
    </FloatingPanel>
</template>
