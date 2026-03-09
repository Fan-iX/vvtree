<script setup>
import { computed } from 'vue'
import Popover from './Popover.vue'
import Palette from './Palette.vue'
const model = defineModel()
const { disabled, class: $class, variant } = defineProps({
    disabled: Boolean, class: String,
    variant: { type: String, default: "underline" },
})
const textInputClass = computed(() => [
    "font-mono appearance-none min-w-4 field-sizing-content bg-transparent",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:border-none",
    "read-only:bg-current/3",
    variant == "outline" ? "border border-gray-300" : "",
    variant == "underline" ? "border-b outline-none" : "",
    variant == "leftline" ? "border-l outline-none" : "",
])
const colorInputClass = computed(() => [
    "align-middle w-6",
    "disabled:cursor-not-allowed",
])
const nullButtonClass = computed(() => [
    "cursor-pointer",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "bg-[linear-gradient(to_bottom_right,transparent_calc(50%-1px),red_50%,transparent_calc(50%+1px))]",
    "w-10",
    model.value == null ? "border-1 border-black" : "",
])

const palettes = {
    Classic: ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFFFFF"],
    R4: ["#000000", "#DF536B", "#61D04F", "#2297E6", "#28E2E5", "#CD0BBC", "#F5C710", "#9E9E9E"],
    ggplot2: ["#000000", "#F8766D", "#00BA38", "#619CFF", "#00BFC4", "#F564E3", "#B79F00", "#9E9E9E"],
    OkabeIto: ["#000000", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#999999"],
    Accent: ["#7FC97F", "#BEAED4", "#FDC086", "#FFFF99", "#386CB0", "#F0027F", "#BF5B17", "#666666"],
    Dark2: ["#1B9E77", "#D95F02", "#7570B3", "#E7298A", "#66A61E", "#E6AB02", "#A6761D", "#666666"],
    Paired: ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "#FB9A99", "#E31A1C", "#FDBF6F", "#FF7F00", "#CAB2D6", "#6A3D9A", "#FFFF99", "#B15928"],
    Pastel1: ["#FBB4AE", "#B3CDE3", "#CCEBC5", "#DECBE4", "#FED9A6", "#FFFFCC", "#E5D8BD", "#FDDAEC", "#F2F2F2"],
    Pastel2: ["#B3E2CD", "#FDCDAC", "#CBD5E8", "#F4CAE4", "#E6F5C9", "#FFF2AE", "#F1E2CC", "#CCCCCC"],
    Set1: ["#E41A1C", "#377EB8", "#4DAF4A", "#984EA3", "#FF7F00", "#FFFF33", "#A65628", "#F781BF", "#999999"],
    Set2: ["#66C2A5", "#FC8D62", "#8DA0CB", "#E78AC3", "#A6D854", "#FFD92F", "#E5C494", "#B3B3B3"],
    Set3: ["#8DD3C7", "#FFFFB3", "#BEBADA", "#FB8072", "#80B1D3", "#FDB462", "#B3DE69", "#FCCDE5", "#D9D9D9", "#BC80BD", "#CCEBC5", "#FFED6F"],
    Tableau10: ["#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F", "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC"],
    ClassicTableau: ["#1F77B4", "#FF7F0E", "#2CA02C", "#D62728", "#9467BD", "#8C564B", "#E377C2", "#7F7F7F", "#BCBD22", "#17BECF"],
    Polychrome36: ["#5A5156", "#E4E1E3", "#F6222E", "#FE00FA", "#16FF32", "#3283FE", "#FEAF16", "#B00068", "#1CFFCE", "#90AD1C", "#2ED9FF", "#DEA0FD", "#AA0DFE", "#F8A19F", "#325A9B", "#C4451C", "#1C8356", "#85660D", "#B10DA1", "#FBE426", "#1CBE4F", "#FA0087", "#FC1CBF", "#F7E1A0", "#C075A6", "#782AB6", "#AAF400", "#BDCDFF", "#822E1C", "#B5EFB5", "#7ED7D1", "#1C7F93", "#D85FF7", "#683B79", "#66B0FF", "#3B00FB"],
    Alphabet: ["#AA0DFE", "#3283FE", "#85660D", "#782AB6", "#565656", "#1C8356", "#16FF32", "#F7E1A0", "#E2E2E2", "#1CBE4F", "#C4451C", "#DEA0FD", "#FE00FA", "#325A9B", "#FEAF16", "#F8A19F", "#90AD1C", "#F6222E", "#1CFFCE", "#2ED9FF", "#B10DA1", "#C075A6", "#FC1CBF", "#B00068", "#FBE426", "#FA0087"],
}
</script>
<template>
    <Popover class="whitespace-nowrap max-h-40" :trigger-class="['inline-block', $class]" :disabled="disabled">
        <template #trigger>
            <input type="color" v-model="model" :class="colorInputClass" :disabled v-tw-merge
                v-if="variant == 'colorinput'" @click="$event.handled = true">
            <input type="text" v-model.lazy="model" :class="textInputClass" :style="{ color: model }" placeholder="null"
                :disabled v-tw-merge />
        </template>
        <div class="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-sm">
            <div class="text-gray-500">&lt;null&gt;</div>
            <button @click="model = null" :class="nullButtonClass"></button>
            <template v-for="(pal, name) in palettes" :key="name">
                <div>{{ name }}</div>
                <Palette v-model="model" :palette="pal" class="w-80" />
            </template>
        </div>
    </Popover>
</template>
