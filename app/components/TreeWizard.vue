<script setup>
import { ref } from 'vue'
import { useFileDialog } from '@vueuse/core'
import FloatingPanel from './widget/FloatingPanel.vue'
import Popover from './widget/Popover.vue'
import { TreeNode } from '#base/js/tree.js'
const emit = defineEmits(['load'])

const tree_data = ref([])

const { open: open_file, onChange } = useFileDialog()
onChange((files) => { for (const file of files) loadFile(file) })
function onpaste(e) {
    if (e.clipboardData.files.length > 0) {
        for (const file of e.clipboardData.files) loadFile(file)
    } else if (e.clipboardData.getData('text')) {
        loadFile(new File([e.clipboardData.getData('text')], 'tree', { type: 'text/plain' }))
    }
}
async function loadFile(file) {
    const text = await file.text()
    if (text == null) return
    let format = "newick", tree, nwk = text, translation = {}
    if (text.match(/begin trees;\s*(?:translate(.*?);)?.*^\s*(tree.*?[;\n$])/sim)) {
        [, translation, nwk] = text.match(/begin trees;\s*(?:translate(.*?);)?.*^\s*(tree.*?[;\n$])/sim)
        if (translation) {
            translation = translation.trim().split(/\s*,\s*/).map(x => x.split(/\s+/))
            translation = Object.assign(
                Object.fromEntries(translation.map((x, i) => [i + 1, x[1]])),
                Object.fromEntries(translation)
            )
            format = "nexus"
        }
        nwk = nwk.replace(/^.*?=(\s+\[\S+\])?\s+/, "")
    }
    try {
        tree = TreeNode.parseNewick(nwk)
        nwk = tree.toNewickString()
    } catch (e) {
        format = "invalid"
        nwk = ""
        translation = {}
    }
    tree_data.value.push({
        name: file.name, format, nwk, translation, tree, translate: false
    })
}
function checkAll(val) {
    for (const tree of tree_data.value) {
        tree.translate = val
    }
}

function apply() {
    let trees = tree_data.value.filter(x => x.format !== "invalid").map(({ name, tree, translate, translation }) => {
        if (translate) {
            for (const tip of tree.allTips) {
                if (tip.name && translation[tip.name]) {
                    tip.name = translation[tip.name]
                }
            }
        }
        return { name, data: tree.toNewickString() }
    })
    emit('load', trees)
    tree_data.value = []
}
</script>
<template>
    <FloatingPanel :width="800" :height="400" content-class="flex flex-col gap-1" title="Import Tree"
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
                class="border-collapse [&_th]:border [&_th]:border-slate-300 [&_td]:border [&_td]:border-slate-300 whitespace-nowrap w-full min-w-max">
                <tr>
                    <th class="w-4"></th>
                    <th>Name</th>
                    <th>Format</th>
                    <th><input type="checkbox" @change="checkAll($event.currentTarget.checked)"> Translate</th>
                    <th>Tree</th>
                </tr>
                <tr v-for="tree, i in tree_data">
                    <td>
                        <Icon icon="lucide:x" @click="tree_data.splice(i, 1)"
                            class="hover:text-red-500 cursor-pointer" />
                    </td>
                    <td><input type="text" v-model="tree.name" class="outline-none field-sizing-content border-b"></td>
                    <td>{{ tree.format }}</td>
                    <td class="text-center">
                        <input type="checkbox" v-model="tree.translate">
                        <Popover side="right" inline variant="tooltip" trigger-class="flex">
                            <template #trigger>
                                <Icon icon="lucide:circle-question-mark"
                                    class="text-blue-500 text-lg cursor-help inline-block" />
                            </template>
                            <pre
                                v-text="Object.entries(tree.translation).map(x => x.join('\t')).join('\n') || '<no translation>'"></pre>
                        </Popover>
                    </td>
                    <td class="font-mono overflow-x-auto max-w-[40ch]">{{ tree.nwk }}</td>
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
