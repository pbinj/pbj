import type { ServiceI } from "../../types";
import { type Edge, type Node, type Options } from "vis-network";
import { DataSet } from "vis-network/standalone";
import { computed, ref, shallowRef, watch } from "vue";
import { useTheme } from "vuetify";
import { useToggle } from "@vueuse/core";
import colors from "vuetify/util/colors";

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const groups = {
  "@pbj": {
    color: colors.purple.accent3,
    label: "PBinJ nodes",
  },
  vue: {
    color: "#42b883",
  },
  ts: {
    color: "#3B86CB",
  },
  js: {
    color: "#d6cb2d",
  },
  json: {
    color: "#cf8f30",
  },
  css: {
    color: "#e6659a",
  },
  html: {
    color: "#e34c26",
  },
  jsx: {
    color: "#54B9D1",
  },
  tsx: {
    color: "#4FC7FF",
  },
  other: {
    color: "#B86542",
  },
} satisfies Record<string, { color: string; label?: string }>;

// #endregion

export const graphOptions = computed<Options>(() => ({
  nodes: {
    shape: "dot",
    size: 16,
    font: {
      color: useTheme().current.value.dark ? "#fff" : "#000",
      multi: "html",
    },
  },
  interaction: {
    hover: true,
  },
  physics: {
    maxVelocity: 146,
    solver: "forceAtlas2Based",
    timestep: 0.35,
    stabilization: {
      enabled: true,
      iterations: 200,
    },
  },
  groups,
}));
// #endregion

// #region graph settings
export interface GraphSettings {
  node_modules: boolean;
  virtual: boolean;
  lib: boolean;
}

// export const graphSettings = computed({
//     get: () => devtoolsClientState.value.graphSettings,
//     set: (value: GraphSettings) => {
//         devtoolsClientState.value.graphSettings = value
//     },
// })

// watch(graphSettings, () => {
//     updateGraph()
// }, { deep: true })
// #endregion

// #region graph search
interface SearcherNode {
  id: string;
  fullId: string;
  node: Node;
  edges: Edge[];
  deps: string[];
}

export const graphSearchText = ref("");

// #endregion

// #region graph data
// NOTE: we can operate DataSet directly to change the graph,
// for performance reasons, just don't parse the whole raw data, instead, we update dataset

interface GraphNodesTotalData {
  mod: ServiceI;
  info: {
    displayName: string;
    displayPath: string;
  };
  node: Node;
  edges: Edge[];
}

export const graphNodes = new DataSet<Node>([]);
export const graphEdges = new DataSet<Edge>([]);
const graphNodesTotal = shallowRef<GraphNodesTotalData[]>([]);
const graphNodesTotalMap = new Map<string, GraphNodesTotalData>();
const modulesMap = new Map<string, GraphNodesTotalData>();
const moduleReferences = new Map<
  string,
  { path: string; displayPath: string; mod: ServiceI }[]
>();

const uniqueNodes = (nodes: Node[]) =>
  nodes.reduce<Node[]>((prev, node) => {
    if (!prev.some((n) => n.id === node.id)) prev.push(node);
    return prev;
  }, []);

const uniqueEdges = (edges: Edge[]) =>
  edges.reduce<Edge[]>((prev, edge) => {
    if (!prev.some((e) => e.from === edge.from && e.to === edge.to))
      prev.push(edge);
    return prev;
  }, []);

export function cleanupGraphRelatedStates() {
  graphNodesTotal.value = [];
  graphNodesTotalMap.clear();
  graphNodes.clear();
  graphEdges.clear();
  modulesMap.clear();
  moduleReferences.clear();
}

function checkIsValidModule(module: ServiceI) {
  return !!module.name;
}

// check valid module need also check it's reference is valid
function checkReferenceIsValid(modId: string) {
  const refer = moduleReferences.get(modId);
  return refer ? refer.some((ref) => checkIsValidModule(ref.mod)) : true;
}

function updateGraph() {
  graphNodes.clear();
  graphEdges.clear();
  closeDrawer();

  const matchedNodes: Node[] = [];
  const matchedSearchNodes: SearcherNode[] = [];
  const matchedEdges: Edge[] = [];

  // reuse cache instead of parse every time
  const filterDataset = getGraphFilterDataset();
  const nodeData = filterDataset
    ? filterDataset.slice()
    : graphNodesTotal.value.slice();
  nodeData.forEach(({ node, edges, mod }) => {
    if (checkIsValidModule(mod) && checkReferenceIsValid(mod.name)) {
      matchedNodes.push(node);
      matchedSearchNodes.push({
        // only search the exactly name(last 3 segments), instead of full path
        id: mod.name,
        fullId: mod.name,
        node,
        edges,
        deps: mod.dependencies,
      });
      matchedEdges.push(...edges);
    }
  });

  // TODO: [fuzzy search graph node] use include, instead of fuse.js, for performance reasons
  // if someone need it, we can add it back
  const searchText = graphSearchText.value;
  if (searchText.trim().length) {
    const result = matchedSearchNodes.filter(({ id }) =>
      id.includes(searchText),
    );
    matchedEdges.length = 0;
    matchedNodes.length = 0;
    if (result.length) {
      const { node, edges } = recursivelyGetNodeByDep(result);
      // need recursively get all nodes and it's dependencies
      matchedNodes.push(...node);
      matchedEdges.push(...edges);
    }
  }

  graphNodes.add(uniqueNodes(matchedNodes));
  graphEdges.add(uniqueEdges(matchedEdges));
}

function recursivelyGetNodeByDep(node: SearcherNode[]) {
  const allNodes = new Map</* fullId */ string, Node>();
  const allEdges = new Map</* from-to */ string, Edge>();
  node.forEach((n) => {
    n = deepClone(n);
    // to highlight current searched node
    if (!n.node.font) n.node.font = { color: "#F19B4A" };
    n.node.label = `<b>${n.node.label}</b>`;
    allNodes.set(n.fullId, n.node);
    n.deps.forEach((dep) => {
      const node = modulesMap.get(dep);
      // also check deps is valid
      if (node && checkIsValidModule(node.mod)) {
        allNodes.set(node.mod.name, node.node);
        allEdges.set(
          `${n.fullId}-${node.mod.name}`,
          getEdge(node.mod.name, n.fullId),
        );
        node.edges.forEach((edge) =>
          allEdges.set(`${edge.from}-${edge.to}`, edge),
        );
      }
    });
  });
  return {
    node: Array.from(allNodes.values()),
    edges: Array.from(allEdges.values()),
  };
}

// #endregion

// #region parse graph raw data
function getEdge(modId: string, dep: string) {
  return {
    from: modId,
    to: dep,
    arrows: {
      to: {
        enabled: true,
        scaleFactor: 0.8,
      },
    },
  };
}

function determineNodeSize(depsLen: number) {
  return 15 + Math.min(depsLen / 2, 8);
}

function getUniqueDeps(deps: string[], processEachDep?: (dep: string) => void) {
  // remove vue style reference, e.g, a.vue -> a.vue?type=style, skip duplicate dep
  // don't use `mod.deps.filter`, will save filter overhead(for performance)
  const uniqueDeps: string[] = [];
  deps.forEach((dep) => {
    // skip duplicate dep
    if (uniqueDeps.includes(dep)) return;
    uniqueDeps.push(dep);
    processEachDep?.(dep);
  });
  return uniqueDeps;
}

export function parseGraphRawData(modules: ServiceI[]) {
  if (!modules) return;
  graphNodes.clear();
  graphEdges.clear();

  const totalEdges: Edge[] = [];
  const totalNode: Node[] = [];

  modules.forEach((mod) => {
    // skip duplicate module, merge their deps
    if (totalNode.some((node) => node.id === mod.name)) {
      const nodeData = modulesMap.get(mod.name)!;
      nodeData.node.size = determineNodeSize(
        nodeData.edges.length + mod.dependencies.length,
      );
      const edges: Edge[] = [];
      const uniqueDeps = getUniqueDeps(mod.dependencies, (dep) => {
        edges.push(getEdge(mod.name, dep));
      });
      const incrementalDeps = uniqueDeps.filter(
        (dep) => !nodeData.mod.dependencies.includes(dep),
      );
      if (!incrementalDeps.length) return;
      nodeData.mod.dependencies.push(...incrementalDeps);
      totalEdges.push(...edges);
      return;
    }
    const path = mod.name;
    const displayPath = path;
    const displayName = mod.name;
    const node: GraphNodesTotalData = {
      mod,
      info: {
        displayName,
        displayPath,
      },
      node: {
        id: mod.name,
        label: displayName,
        group: path.match(/^(@\w+)\//)?.[1] || "unknown",
        size: determineNodeSize(mod.dependencies.length),
        shape:
          mod.invalid || mod.error ? "box" : mod.invoked ? "diamond" : "dot",
      },
      edges: [],
    };

    const uniqueDeps = getUniqueDeps(mod.dependencies, (dep) => {
      node.edges.push(getEdge(mod.name, dep));
      // save references
      if (!moduleReferences.has(dep)) moduleReferences.set(dep, []);
      const moduleReferencesValue = moduleReferences.get(dep)!;
      const displayPath = path;
      const isExist = !!moduleReferencesValue.find(
        (item) =>
          item.path === path &&
          item.displayPath === displayPath &&
          item.mod.name === mod.name,
      );
      if (isExist) return;

      moduleReferencesValue.push({
        path,
        displayPath,
        mod,
      });
    });
    mod.dependencies = uniqueDeps;
    graphNodesTotal.value.push(node);
    graphNodesTotalMap.set(mod.name, node);

    // save cache, to speed up search
    modulesMap.set(mod.name, node);

    // first time, we also need check
    if (checkIsValidModule(mod) && checkReferenceIsValid(mod.name)) {
      totalNode.push(node.node);
      totalEdges.push(...node.edges);
    }
  });
  // set initial data
  // nodes has been unique in `modules.forEach`
  graphNodes.add(totalNode.slice());
  graphEdges.add(uniqueEdges(totalEdges));
}
// #endregion

// #region drawer
export interface DrawerData {
  name: string;
  path: string;
  displayPath: string;
  refs: { path: string; displayPath: string }[];
  deps: { path: string; displayPath: string }[];
  service: ServiceI;
}

export const graphDrawerData = ref<DrawerData>();
export const [graphDrawerShow, toggleGraphDrawer] = useToggle(false);

export function closeDrawer() {
  toggleGraphDrawer(false);
  graphDrawerData.value = undefined;
}

export function openDrawer(service: ServiceI | string) {
  updateGraphDrawerData(typeof service === "string" ? service : service.name);
  toggleGraphDrawer(true);
}
export function updateGraphDrawerData(nodeId: string): DrawerData | undefined {
  const node = modulesMap.get(nodeId);
  if (!node) return;

  const deps = node.mod.dependencies.reduce<DrawerData["deps"]>(
    (prev: { path: string; displayPath: string }[], dep: string) => {
      const moduleData = modulesMap.get(dep);
      if (!moduleData) return prev;
      if (checkIsValidModule(moduleData.mod)) {
        prev.push({
          path: dep,
          displayPath: dep,
        });
      }
      return prev;
    },
    [],
  );

  const refsData = moduleReferences.get(node.mod.name) || [];
  const refs = refsData.reduce<DrawerData["deps"]>((prev, ref) => {
    const moduleData = modulesMap.get(ref.path);
    if (!moduleData) return prev;
    if (checkIsValidModule(moduleData.mod)) {
      prev.push({
        path: ref.path,
        displayPath: ref.displayPath,
      });
    }
    return prev;
  }, []);

  graphDrawerData.value = {
    name: node.info.displayName,
    displayPath: node.info.displayPath,
    path: node.mod.name,
    service: node.mod,
    deps,
    refs,
  };
}
// #endregion

// #region graph filter
export const graphFilterNodeId = ref("");

watch(graphFilterNodeId, updateGraph);

export function getGraphFilterDataset() {
  const nodeId = graphFilterNodeId.value;
  graphFilterNodeId.value = nodeId;
  if (!nodeId) return null;
  const node = modulesMap.get(nodeId);
  if (!node) return null;
  const dataset = recursivelyGetGraphNodeData(nodeId);
  return dataset;
}

// max depth is 20
function recursivelyGetGraphNodeData(
  nodeId: string,
  depth = 0,
): GraphNodesTotalData[] {
  const node = modulesMap.get(nodeId);
  depth += 1;
  if (!node || depth > 20) return [];
  const result = [node];
  node.mod.dependencies.forEach((dep: string) => {
    const node = modulesMap.get(dep);
    if (node) result.push(...recursivelyGetGraphNodeData(node.mod.name, depth));
  });
  // unique result
  return result.reduce<GraphNodesTotalData[]>((prev, node) => {
    if (!prev.some((n) => n.mod.name === node.mod.name)) prev.push(node);
    return prev;
  }, []);
}
