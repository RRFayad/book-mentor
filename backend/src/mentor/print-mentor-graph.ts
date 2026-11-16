import { mentorGraph } from "./mentor.graph";

const graph = await mentorGraph.getGraphAsync();

console.log(graph.drawMermaid());
