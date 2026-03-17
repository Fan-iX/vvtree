import { TreeNode } from "./tree.js"

export class VVTreeNode extends TreeNode {
    static parseNewick(text) {
        if (!text?.trim?.()) return new this();
        let ancestors = [];
        let tree = new this();
        let tokens = text.split(/\s*('.*?'|\[.*?\]|<.*?>|::|[;(),:])\s*/g).filter(x => x != "");
        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];
            if (token.startsWith("'")) {
                token = token.slice(1, -1);
            }
            if (token == ";") {
                return tree;
            } else if (token == "(") {
                let subtree = new this();
                subtree.parent = tree;
                tree.children = [subtree];
                ancestors.push(tree);
                tree = subtree;
            } else if (token == ",") {
                let subtree = new this();
                subtree.parent = tree.parent;
                ancestors[ancestors.length - 1].children.push(subtree);
                tree = subtree;
            } else if (token == ")") {
                tree = ancestors.pop();
            } else if (token == ":") {
            } else if (token.startsWith("[")) {
                token = token.slice(1, -1);
                if (token.startsWith("&")) token = token.slice(1);
                let tks = token.split(/\s*({.*?}|[,=;])\s*/g).filter(x => x != "");
                let key = ""
                for (let j = 0; j < tks.length; j++) {
                    let tk = tks[j];
                    if (tk != "=" && tk != "," && tk != ";") {
                        let x = tks[j - 1];
                        if (x == "=") {
                            if (tk.startsWith("{")) {
                                tree.annotations[key] = tk.slice(1, -1).split(",").map(x => isNaN(+x) ? x : +x);
                            } else {
                                tree.annotations[key] = isNaN(+tk) ? tk : +tk;
                            }
                        } else {
                            key = tk;
                        }
                    }
                }
            } else if (token.startsWith("<")) {
                token = token.slice(1, -1);
                let tks = token.split(/\s*({.*?}|[,=;])\s*/g).filter(x => x != "");
                let key = ""
                for (let j = 0; j < tks.length; j++) {
                    let tk = tks[j];
                    if (tk != "=" && tk != "," && tk != ";") {
                        let x = tks[j - 1];
                        if (x == "=") {
                            if (tk.startsWith("{")) {
                                tree.attributes[key] = tk.slice(1, -1).split(",").map(x => isNaN(+x) ? x : +x);
                            } else {
                                tree.attributes[key] = isNaN(+tk) ? tk : +tk;
                            }
                        } else {
                            key = tk;
                        }
                    }
                }
            } else {
                let prev = tokens[i - 1];
                if (prev == ')' || prev == '(' || prev == ',') {
                    tree.label = tree.name = token;
                    tree.annotations[":name"] = isNaN(token) ? token : +token;
                } else if (prev == '::') {
                    tree.annotations[":proportion"] = parseFloat(token);
                } else if (prev == ':') {
                    tree.branch_length = parseFloat(token);
                }
            }
        }
    }
    static from(treeNode, attributes) {
        let node = new this({
            name: treeNode.name,
            branch_length: treeNode.branch_length,
            annotations: treeNode.annotations,
            attributes: Object.assign({}, attributes, treeNode.attributes),
            children: treeNode.children.map(x => this.from(x, attributes)),
        })
        node.children.forEach(x => x.parent = node)
        return node
    }

    constructor({ attributes, ...config } = {}) {
        super(config)
        this.attributes = Object.assign({}, attributes)
        this.$rectangular = {} // pre-rendered layout info for rectangular layout
        this.$unrooted = {} // pre-rendered layout info for unrooted layout
    }

    get _isTip() {
        return this.$collapsed || this.children.length == 0;
    }
    get _allChildren() {
        return this._isTip ? [] : this.children.flatMap(x => [x].concat(x._allChildren));
    }
    get _allNodes() {
        return [this].concat(this._allChildren);
    }
    get _allTips() {
        return this._isTip ? [this] : this.children.flatMap(x => x._allTips);
    }

    prerenderRectangular({ branch_length = true } = {}) {
        let root = this.root
        if (root._allChildren.every(x => x.branch_length == null)) branch_length = false
        root._allTips.forEach((x, i) => x.$rectangular.y = i)

        function assignCoordinates(node) {
            if (branch_length) {
                node.$rectangular.x = node.parent == null ? 0 : node.parent.$rectangular.x + (node.branch_length ?? 0)
                if (node._isTip) return
                node.children.forEach(c => assignCoordinates(c))
                node.$rectangular.y = (node.children[0].$rectangular.y + node.children[node.children.length - 1].$rectangular.y) / 2
            } else {
                if (node._isTip) {
                    node.$rectangular.x = 0
                    return
                }
                node.children.forEach(c => assignCoordinates(c))
                node.$rectangular.x = node.children.reduce((v, c) => Math.min(v, c.$rectangular.x), 0) - 1
                node.$rectangular.y = (node.children[0].$rectangular.y + node.children[node.children.length - 1].$rectangular.y) / 2
            }
        }

        assignCoordinates(root)
    }

    prerenderUnrooted({ branch_length = true } = {}) {
        let root = this.root
        if (root._allChildren.every(x => x.branch_length == null)) branch_length = false
        root.$unrooted = { x: 0, y: 0 }

        const assignCoordinates = (node, start, end) => {
            const angle = (start + end) / 2
            if (node.parent == null) {
                node.$unrooted.x = node.$unrooted.y = 0
            } else {
                const length = branch_length ? node.branch_length ?? 0 : 1
                node.$unrooted.x = node.parent.$unrooted.x + length * Math.cos(angle)
                node.$unrooted.y = node.parent.$unrooted.y + length * Math.sin(angle)
            }
            let $node = node
            while (branch_length && $node.parent && !$node.branch_length) $node = $node.parent
            node.$unrooted.parent = $node.parent ?? node
            node.$unrooted.theta = angle

            if (!node.isTip) {
                let currentStart = start
                const totalRange = end - start
                const parentTotalTips = node.allTips.length

                node.children.forEach(child => {
                    const sectorSize = totalRange * (child.allTips.length / parentTotalTips)
                    assignCoordinates(child, currentStart, currentStart + sectorSize)
                    currentStart += sectorSize
                })
            }
        }

        assignCoordinates(root, 0, 2 * Math.PI)
    }

    prerender({ layout = 'rectangular', ...opts } = {}) {
        if (layout === 'unrooted') this.prerenderUnrooted(opts)
        if (layout === 'rectangular') this.prerenderRectangular(opts)
    }

    toNewickString(config = {}) {
        let {
            tip_label = true, node_label = true,
            branch_length = true, annotation = true,
            attribute = true,
        } = config
        let s_label = "", s_branch_length = "", s_annotations = "", s_children = "", s_attributes = "";
        if (tip_label && this.isTip || node_label && !this.isTip) {
            s_label = this.name || "";
        }
        if (branch_length && this.branch_length != null) {
            s_branch_length = `:${this.branch_length}`
        }
        let annotations = Object.entries(this.annotations).filter(([key, value]) => !key.startsWith(":") && value != null);
        if (annotation && annotations.length > 0) {
            s_annotations = "[&" + annotations.map(([key, value]) => {
                return Array.isArray(value) ? `${key}={${value.join(",")}}` : `${key}=${value}`
            }).join(",") + "]";
        }
        let attributes = Object.entries(this.attributes).filter(([key, value]) => value != null);
        if (attribute && attributes.length > 0) {
            s_attributes = "<" + attributes.map(([key, value]) => {
                return Array.isArray(value) ? `${key}={${value.join(",")}}` : `${key}=${value}`
            }).join(",") + ">";
        }
        if (this.children.length > 0) {
            s_children = `(${this.children.map(x => x.toNewickString(config)).join(",")})`;
        }
        let s_end = this.parent == null ? ";" : "";
        return `${s_children}${s_label}${s_annotations}${s_attributes}${s_branch_length}${s_end}`;
    }
}
