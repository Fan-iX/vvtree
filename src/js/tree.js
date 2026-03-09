export class TreeNode {
    // parse Newick format phylogeny source file
    // adapted from https://github.com/jasondavies/newick.js
    static parseNewick(text) {
        if (!text?.trim?.()) return new this();
        let ancestors = [];
        let tree = new this();
        let tokens = text.split(/\s*('.*?'|\[.*?\]|[;(),:])\s*/g).filter(x => x != "");
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
                                tree.annotations[key] = tk.slice(1, -1).split(",").map(x => isNaN(x) ? x : +x);
                            } else {
                                tree.annotations[key] = isNaN(tk) ? tk : +tk;
                            }
                        } else {
                            key = tk;
                        }
                    }
                }
            } else {
                let prev = tokens[i - 1];
                if (prev == ')' || prev == '(' || prev == ',') {
                    tree.name = token;
                } else if (prev == ':') {
                    tree.branch_length = parseFloat(token);
                }
            }
        }
    }
    // reroot the tree at the given node
    static reroot(node, branch_ratio = 0.5) {
        function rotate(node) {
            let parent = node.parent;
            if (parent == null) return;
            rotate(parent);
            parent.children = parent.children.filter(x => x != node);
            if (parent.children.length == 1) {
                if (node.branch_length != null)
                    parent.children[0].branch_length += node.branch_length;
                node.children.push(parent.children[0]);
                parent.children[0].parent = node;
            } else {
                if (node.branch_length != null)
                    parent.branch_length = node.branch_length;
                node.children.push(parent);
                parent.parent = node;
            }
        }
        if (!node instanceof this) throw new Error("node must be an instance of TreeNode");
        if (node.isRoot) return node;
        let parent = node.parent;
        rotate(parent);
        let root = new node.constructor();
        let i = parent.children.indexOf(node);
        parent.children = parent.children.filter(x => x != node);
        if (parent.children.length == 1) {
            parent = parent.children[0];
            if (node.branch_length != null)
                parent.branch_length += node.branch_length * (1 - branch_ratio);
        } else {
            if (node.branch_length != null)
                parent.branch_length = node.branch_length * (1 - branch_ratio);
        }
        if (node.branch_length != null)
            node.branch_length = node.branch_length * branch_ratio;
        node.parent = root;
        parent.parent = root;
        root.children = i > 0 ? [parent, node] : [node, parent];
        return root;
    }

    constructor({ name, label, branch_length, children = [], parent, annotations = {} } = {}) {
        this.name = name;
        this.label = label ?? name;
        this.branch_length = branch_length;
        this.children = children;
        this.parent = parent;
        this.annotations = annotations;
    }

    get isTip() {
        return this.children.length == 0;
    }

    get isRoot() {
        return this.parent == null;
    }

    get allParents() {
        return this.isRoot ? [] : [this.parent].concat(this.parent.allParents);
    }

    get allChildren() {
        return this.children.flatMap(x => [x].concat(x.allChildren));
    }

    get root() {
        return this.isRoot ? this : this.parent.root;
    }

    get allTips() {
        return this.isTip ? [this] : this.children.flatMap(x => x.allTips);
    }

    get allNodes() {
        return [this].concat(this.allChildren);
    }

    // length from root to this node
    get depth() {
        return this.parent == null ? 0 : this.parent.depth + (this.branch_length ?? 0);
    }

    // length from this node to the deepest tip
    get height() {
        function getHeight(node) {
            return node.children.reduce((val, n) => Math.max(val, getHeight(n) + (n.branch_length ?? 0)), 0);
        }
        return getHeight(this);
    }

    // depth in terms of steps from root
    get step_depth() {
        return this.parent == null ? 0 : this.parent.step_depth + 1;
    }

    // height in terms of steps to the deepest tip
    get step_height() {
        function getStepHeight(node) {
            return node.children.reduce((val, n) => Math.max(val, getStepHeight(n) + 1), 0);
        }
        return getStepHeight(this);
    }

    clone() {
        return new this.constructor({
            name: this.name,
            branch_length: this.branch_length,
            annotations: { ...this.annotations },
            children: this.children.map(x => x.clone())
        });
    }

    ladderize() {
        if (this.isTip) {
            this._n_tip = 1;
            return this;
        }
        this.children.forEach(x => x.ladderize());
        this._n_tip = this.children.reduce((a, b) => a + b._n_tip, 0);
        this.children.sort((a, b) => b._n_tip - a._n_tip);
        return this;
    }

    toJSON() {
        return {
            name: this.name,
            branch_length: this.branch_length,
            children: this.children.map(x => x.toJSON()),
            annotations: this.annotations
        }
    }

    toNewickString(config = {}) {
        let {
            tip_label = true, node_label = true,
            branch_length = true, annotation = true,
        } = config
        let s_label = "", s_branch_length = "", s_annotations = "", s_children = "";
        if (tip_label && this.isTip || node_label && !this.isTip) {
            s_label = this.name || "";
        }
        if (branch_length && this.branch_length != null) {
            s_branch_length = `:${this.branch_length}`
        }
        if (annotation && Object.keys(this.annotations).length > 0) {
            s_annotations = "[&" + Object.entries(this.annotations).map(([key, value]) => {
                return Array.isArray(value) ? `${key}={${value.join(",")}}` : `${key}=${value}`
            }).join(",") + "]";
        }
        if (this.children.length > 0) {
            s_children = `(${this.children.map(x => x.toNewickString(config)).join(",")})`;
        }
        let s_end = this.parent == null ? ";" : "";
        return `${s_children}${s_label}${s_annotations}${s_branch_length}${s_end}`;
    }
}
