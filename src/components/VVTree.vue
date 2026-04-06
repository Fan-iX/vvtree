<script setup>
import { useTemplateRef } from 'vue'
import VVTreeCircular from './VVTreeCircular.vue';
import VVTreeRectangular from './VVTreeRectangular.vue';
import VVTreeUnrooted from './VVTreeUnrooted.vue';

const { layout } = defineProps({ layout: { type: String, default: 'rectangular' } })

const ele = useTemplateRef('ele')
defineExpose({ get plot() { return ele.value?.plot } })
</script>
<template>
    <VVTreeRectangular v-if="layout == 'rectangular'" ref="ele" />
    <VVTreeCircular v-else-if="layout == 'circular'" ref="ele" />
    <VVTreeUnrooted v-else-if="layout == 'unrooted'" ref="ele" />
</template>
