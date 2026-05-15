"use client";

import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

export interface ChartDataPoint {
  date: string;
  value: number;
}

export default function ActivityChart({ data }: { data: ChartDataPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    if (!data || data.length === 0 || !containerRef.current) return;
    const container = containerRef.current;
    d3.select(container).selectAll("*").remove();

    // Set up dimensions
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 250;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("overflow", "visible");

    // Colors — uses design token values
    const primaryColor = "#635BFF";  /* var(--accent) */
    const gradientTop = "rgba(99, 91, 255, 0.25)";
    const gradientBottom = "rgba(99, 91, 255, 0.0)";

    // Defs for gradient and glow
    const defs = svg.append("defs");
    
    const gradient = defs.append("linearGradient")
      .attr("id", "area-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
      
    gradient.append("stop").attr("offset", "0%").attr("stop-color", gradientTop);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", gradientBottom);
    
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");
      
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "blur");
      
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse and prepare data
    const parsedData = data.map(d => ({
      date: new Date(d.date),
      value: d.value
    })).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.date) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, (d3.max(parsedData, d => d.value) as number) * 1.2]) // 20% padding top
      .range([innerHeight, 0]);

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(6)
      .tickFormat((d) => d3.timeFormat("%b %d")(d as Date))
      .tickSizeOuter(0)
      .tickSizeInner(0)
      .tickPadding(12);

    const yAxis = d3.axisLeft(yScale)
      .ticks(4)
      .tickSizeOuter(0)
      .tickSizeInner(-innerWidth)
      .tickPadding(12);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(xAxis as any);

    g.append("g")
      .call(yAxis as any);

    // Style axes
    svg.selectAll(".domain").remove();
    svg.selectAll(".tick line")
      .attr("stroke", "var(--app-border)")
      .attr("stroke-dasharray", "3,3");
    svg.selectAll(".tick text")
      .attr("fill", "var(--app-muted)")
      .style("font-family", "var(--font-inter), sans-serif")
      .style("font-size", "0.75rem");

    // Line and Area generators
    const area = d3.area<{date: Date; value: number}>()
      .x(d => xScale(d.date))
      .y0(innerHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const line = d3.line<{date: Date; value: number}>()
      .x(d => xScale(d.date))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Initial path (starts flat at bottom for animation)
    const initialArea = d3.area<{date: Date; value: number}>()
      .x(d => xScale(d.date))
      .y0(innerHeight)
      .y1(innerHeight)
      .curve(d3.curveMonotoneX);

    const initialLine = d3.line<{date: Date; value: number}>()
      .x(d => xScale(d.date))
      .y(innerHeight)
      .curve(d3.curveMonotoneX);

    // Append Area
    g.append("path")
      .datum(parsedData)
      .attr("fill", "url(#area-gradient)")
      .attr("d", initialArea as any)
      .transition()
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attr("d", area as any);

    // Append Line
    g.append("path")
      .datum(parsedData)
      .attr("fill", "none")
      .attr("stroke", primaryColor)
      .attr("stroke-width", 2.5)
      .attr("filter", "url(#glow)")
      .attr("d", initialLine as any)
      .transition()
      .duration(1200)
      .ease(d3.easeCubicOut)
      .attr("d", line as any);

    // Tooltip scoped to container
    const tooltipEl = d3.select(container)
      .append("div")
      .attr("role", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background", "var(--app-surface)")
      .style("border", "1px solid var(--app-border)")
      .style("padding", "8px 12px")
      .style("border-radius", "8px")
      .style("color", "var(--app-text)")
      .style("font-family", "var(--font-inter), sans-serif")
      .style("font-size", "0.75rem")
      .style("pointer-events", "none")
      .style("box-shadow", "var(--shadow-md)")
      .style("z-index", "10");

    const focusLine = g.append("line")
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "#635BFF")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4")
      .style("opacity", 0)
      .style("pointer-events", "none");

    const focusCircle = g.append("circle")
      .attr("r", 5)
      .attr("fill", "var(--app-surface)")
      .attr("stroke", "#635BFF")
      .attr("stroke-width", 2)
      .style("opacity", 0)
      .style("pointer-events", "none");

    const bisectDate = d3.bisector<{date: Date; value: number}, Date>(d => d.date).left;

    // Overlay for capturing mouse events
    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .on("mouseover", () => {
        focusLine.style("opacity", 0.5);
        focusCircle.style("opacity", 1);
        tooltipEl.style("visibility", "visible");
      })
      .on("mousemove", (event) => {
        const [xPos] = d3.pointer(event);
        const x0 = xScale.invert(xPos);
        let i = bisectDate(parsedData, x0, 1);
        if (i >= parsedData.length) i = parsedData.length - 1;
        
        const d0 = parsedData[i - 1];
        const d1 = parsedData[i];
        let d = d0;
        
        if (d0 && d1) {
          d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;
        }

        const cx = xScale(d.date);
        const cy = yScale(d.value);

        focusLine.attr("x1", cx).attr("x2", cx);
        focusCircle.attr("cx", cx).attr("cy", cy);

        tooltipEl
          .html(`<div style="color:var(--app-muted);margin-bottom:4px;">${d3.timeFormat("%b %d, %Y")(d.date)}</div>
                 <div style="font-weight:700;font-size:0.875rem;color:#635BFF;">${d.value} Matches</div>`)
          .style("top", (event.pageY - 60) + "px")
          .style("left", (event.pageX + 15) + "px");
      })
      .on("mouseout", () => {
        focusLine.style("opacity", 0);
        focusCircle.style("opacity", 0);
        tooltipEl.style("visibility", "hidden");
      });

    // Tooltip scoped to container — declaration above near tooltipEl

  }, [data]);

  useEffect(() => {
    draw();

    // ResizeObserver for responsive redraw
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: "220px", position: "relative" }} />;
}
