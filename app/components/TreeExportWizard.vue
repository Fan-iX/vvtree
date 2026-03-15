<script setup>
import { ref, watch } from 'vue'
import FloatingPanel from './widget/FloatingPanel.vue'
const emit = defineEmits(['load'])

const { trees } = defineProps({
    trees: { type: Array, default: () => [] },
})
const selected = ref([])
function checkAll(val) {
    for (let i = 0; i < trees.length; i++) {
        selected.value[i] = val
    }
}
watch(() => trees.length, () => { selected.value = trees.map(() => true) }, { immediate: true })
function oncopy(e) {
    let tree_data = trees.filter((x, i) => selected.value[i])
    e.preventDefault()
    e.clipboardData.setData('text/plain', tree_data.map(x => x.name + "\t" + x.data).join("\n"))
    e.clipboardData.setData('vvtree-tree-list', JSON.stringify(tree_data))
}
function copy() {
    if (navigator.clipboard) {
        let tree_data = trees.filter((x, i) => selected.value[i])
        navigator.clipboard.write([
            new ClipboardItem({
                "text/plain": tree_data.map(x => x.name + "\t" + x.data).join("\n"),
                "vvtree-tree-list": JSON.stringify(tree_data),
            })
        ])
    } else {
        document.execCommand('copy')
    }
}
</script>
<template>
    <FloatingPanel :width="800" :height="400" content-class="flex flex-col gap-1" title="Export trees"
        class="max-w-full overflow-auto" @copy="oncopy">
        <div class="flex-1 overflow-auto">
            <table
                class="border-collapse [&_th]:border [&_th]:border-slate-300 [&_td]:border [&_td]:border-slate-300 whitespace-nowrap w-full">
                <tr>
                    <th class="min-w-4">
                        <input type="checkbox" @change="checkAll($event.target.checked)"
                            :indeterminate="selected.every(x => x) && !selected.some(x => !x)">
                    </th>
                    <th class="px-2">Name</th>
                    <th class="w-full">Tree</th>
                </tr>
                <tr v-for="tree, i in trees">
                    <td class="text-center">
                        <input type="checkbox" v-model="selected[i]">
                    </td>
                    <td>{{ tree.name }}</td>
                    <td class="font-mono overflow-x-auto max-w-[40ch]">{{ tree.data }}</td>
                </tr>
            </table>
        </div>
        <div class="flex flex-row-reverse">
            <button class="text-white bg-green-500 cursor-pointer rounded-md px-2 py-1 hover:bg-green-500/75"
                @click="copy">
                copy
            </button>
        </div>
    </FloatingPanel>
</template>
