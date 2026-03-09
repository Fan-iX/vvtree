<script setup>
import { useId, useSlots, useTemplateRef, computed, ref } from 'vue'
import { Fragment, Comment } from 'vue'
const { orientation, side: $side, reverse } = defineProps({
    orientation: { type: String, default: 'x' },
    side: String, reverse: Boolean,
})
const vid = useId()
const $slots = useSlots()
const vnodes = computed(() => {
    let vn = $slots.default?.() ?? []
    vn = vn.flatMap(c => c.type == Fragment ? c.children : c)
    if (reverse) vn = vn.reverse()
    return vn.filter(c => c.type != Comment)
})
const side = computed(() => {
    if (["left", "right", "top", "bottom"].includes($side)) return $side
    return orientation == "y" ? "top" : "left"
})
const itemRefs = useTemplateRef('items')
const draggingIndex = ref(null)
function onItemDragstart(e, i) {
    e.dataTransfer.setData('draglist-' + vid, vid)
    draggingIndex.value = i
}
const emit = defineEmits(['reorder'])
function onListDrop(e) {
    if (!e.dataTransfer.types.includes("draglist-" + vid)) return
    let ele = itemRefs.value.find(x => x.contains(e.target))
    ele.style.boxShadow = null
    let i = itemRefs.value.indexOf(ele)
    if (orientation == "y") {
        if (ele.getBoundingClientRect().left + ele.getBoundingClientRect().width / 2 < e.clientX) i++
    } else {
        if (ele.getBoundingClientRect().top + ele.getBoundingClientRect().height / 2 < e.clientY) i++
    }
    let j = draggingIndex.value
    if (j != null) {
        let n = vnodes.value.length
        emit('reorder', reverse ? n - j - 1 : j, reverse ? n - i : i)
    }
    draggingIndex.value = null
}
function onListDragover(e) {
    if (!e.dataTransfer.types.includes("draglist-" + vid)) return
    e.preventDefault()
    let ele = itemRefs.value.find(x => x.contains(e.target))
    if (!ele) return
    if (orientation == "y") {
        if (ele.getBoundingClientRect().left + ele.getBoundingClientRect().width / 2 < e.clientX) {
            ele.style.boxShadow = '1px 0px 0px 0px black, -1px 0px 0px 0px black inset'
        } else {
            ele.style.boxShadow = '-1px 0px 0px 0px black, 1px 0px 0px 0px black inset'
        }
    } else {
        if (ele.getBoundingClientRect().top + ele.getBoundingClientRect().height / 2 < e.clientY) {
            ele.style.boxShadow = '0px 1px 0px 0px black, 0px -1px 0px 0px black inset'
        } else {
            ele.style.boxShadow = '0px -1px 0px 0px black, 0px 1px 0px 0px black inset'
        }
    }
}
function onListDragleave(e) {
    if (!e.dataTransfer.types.includes("draglist-" + vid)) return
    let ele = itemRefs.value.find(x => x.contains(e.target))
    if (ele) ele.style.boxShadow = null
}
const className = computed(() => [
    "flex", orientation == "y" ? "flex-row" : "flex-col",
])
const wrapperClassName = computed(() => [
    "flex",
    orientation == "y" ? "h-full px-1" : "w-full py-1",
    side.value == "top" || side.value == "bottom" ? "flex-col" : "flex-row",
])
const handleClassName = computed(() => [
    "cursor-move inline-block box-content border-gray-300 flex-0", {
        left: "w-2 border-l-8", right: "w-2 border-r-8",
        top: "h-2 border-t-8", bottom: "h-2 border-b-8",
    }[side.value],
])
</script>
<template>
    <div @dragover="onListDragover" @dragleave="onListDragleave" @drop="onListDrop" :class="className" v-tw-merge>
        <div v-for="s, i in vnodes" ref="items" :class="wrapperClassName">
            <div v-if="side == 'left' || side == 'top'" :class="handleClassName" draggable="true"
                @dragstart="onItemDragstart($event, i)" v-tw-merge>&nbsp;</div>
            <component :is="s" />
            <div v-if="side == 'right' || side == 'bottom'" :class="handleClassName" draggable="true"
                @dragstart="onItemDragstart($event, i)" v-tw-merge>&nbsp;</div>
        </div>
    </div>
</template>
