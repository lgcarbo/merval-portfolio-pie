(function() {
    const monthChars = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
    const monthDates = ["January 1", "January 29", "February 29", "March 31", "April 29", "May 31", "June 30", "July 29", "August 31", "September 30", "October 31", "November 30", "December 30"];
    const stockSymbols = ["GGAL", "PAMP", "YPFD", "ERAR", "ALUA"];
    const stockNames = ["Banco Galicia", "Pampa Energía", "YPF", "Siderar", "Aluar"];
    const stockColors = ["blue", "yellow", "orange", "green", "red"]

    const svg = d3.select("#root")
        .append("svg")
        .attr("width", 800)
        .attr("height", 600);

    renderCenteredText(svg, 400, 50, 35, "Merval Portfolio (2016)");
    var data = getData();
    var pie = new Pie(svg, 230, 280, 180, data.portfolioPercentsByMonth[0], stockSymbols, stockColors);
    var table = new PortfolioTable(svg, 450, 145, 360, data.portfolioAmountsByMonth[0], stockNames, stockSymbols, monthDates[0]);
    var tooltip = new Tooltip(svg, 600, 350);
    var slider = new Slider(svg, 50, 520, 60, monthChars);
    pie.onmouseenter = (index) => {
        const currentMonth = slider.getSelectedIndex();
        table.select(index);
        tooltip.show(data.shareCount[index], data.prices[currentMonth][index]);
    };
    pie.onmouseleave = (index) => {
        table.deselect(index);
        tooltip.hide();
    };
    table.onmouseenter = (index) => {
        const currentMonth = slider.getSelectedIndex();
        pie.select(index);
        tooltip.show(data.shareCount[index], data.prices[currentMonth][index]);
    };
    table.onmouseleave = (index) => {
        pie.deselect(index);
        tooltip.hide();
    };
    slider.onchange = (index) => {
        pie.update(data.portfolioPercentsByMonth[index]);
        table.update(data.portfolioAmountsByMonth[index], monthDates[index]);
    };
    pie.render();
    table.render();
    tooltip.render();
    slider.render();

})();

function getData() {
    const initialPrices = [36.80, 11.60, 219.95, 8.57, 11.75];
    const monthClosePrices = [[38.3,12.75,235,7.9,9.47],[46.5,14.25,288,8.48,11.1],[41.15,12.6,262.5,7.34,10.45],
        [40.8,11.75,289.35,6.9,9.97],[39.85,13.1,291.6,6.8,9.17],[46.15,16.35,289,7.47,9.6],
        [44.85,16.55,280.75,8.14,10.2],[44.85,15.1,256,8.15,9.5],[47,19.3,278,9.09,10.6],
        [47.1,20.55,268.35,9.38,10.4],[44.4,22.25,269.7,9.45,10.4],[42.7,22,259,9.35,9.98]];
    let initialPortfolio = [100000, 100000, 100000, 100000, 100000];
    const shareCount = initialPortfolio.map((x,i) => Math.ceil(x / initialPrices[i]));
    initialPortfolio = shareCount.map((x,i) => x * initialPrices[i]);
    const portfolios = [initialPortfolio].concat(monthClosePrices.map(m => m.map((p,i) => shareCount[i] * p)));
    const portfolioTotals = portfolios.map(x => x.reduce((a,b) => a + b));
    const portfolioPercents = portfolios.map((x,i) => x.map(y => y / portfolioTotals[i]));
    
    return { 
        prices: [initialPrices].concat(monthClosePrices), 
        shareCount, 
        portfolioAmountsByMonth: portfolios, 
        portfolioPercentsByMonth: portfolioPercents
    };
}

function renderCenteredText(svg, x, y, size, text) {
    return renderText(svg, x, y, size, text)
        .style("text-anchor", "middle");
}

function renderRightedText(svg, x, y, size, text) {
    return renderText(svg, x, y, size, text)
        .style("text-anchor", "end");
}

function renderText(svg, x, y, size, text) {
    return svg.append("text")
        .attr("x", x)
        .attr("y", y)
        .style("font-family", "Verdana")
        .style("font-size", size)
        .text(text);
}

function Pie(svg, x, y, radius, pieData, labels, colors) {
    this.render = render;
    this.update = update;
    this.select = select;
    this.deselect = deselect;  
    this.onmouseenter = null;
    this.onmouseleave = null;

    var pie = d3.pie().sort(null).value(x => x);
    var data = pie(pieData);

    arc = d3.arc()
        .outerRadius(radius)
        .innerRadius(0);

    var pieChart;
    var slices;

    function render() {
        const colorScale = d3.scaleOrdinal(colors);

        pieChart = svg.append("g")
            .attr("width", 500)
            .attr("height", 300)
            .attr("transform", "translate("+ [x,y] + ")");

        slices = pieChart.selectAll("g")
            .data(data)
            .enter()
            .append("g")
            .classed("pointed", true)
            .on("mouseenter", (data) => {
                this.select(data.index);
                if(this.onmouseenter) {
                    this.onmouseenter(data.index)
                }
            })
            .on("mouseleave", (data) => {
                this.deselect(data.index);
                if(this.onmouseleave) {
                    this.onmouseleave(data.index);
                }
            });

        slices.append("path")
            .style("stroke", "black")
            .style("stroke-width", 2)
            .style("fill", d => colorScale(d.index));

        slices.append("text")
            .style("font-size", 14)
            .style("text-anchor", "middle")
            .style("font-family", "Verdana")
            .classed("t1", true)
            .text(d => labels[d.index]);

        slices.append("text")
            .style("font-size", 14)
            .style("text-anchor", "middle")
            .style("font-family", "Verdana")
            .classed("t2", true);

        setAttributes();
        transitionAttributes();
    } 

    function update(pieData) {
        pieChart.selectAll("g").data(pie(pieData));
        transitionAttributes();
    }

    function setAttributes() {
        slices.select("path")
            .attr("d", arc);

        slices.select("text.t1")
            .attr("transform", d => "translate(" + arc.centroid(d) + ")");
        
        slices.select("text.t2")
            .attr("transform", (d) => {
                var centroid = arc.centroid(d);
                return "translate(" + [centroid[0], centroid[1] + 20] + ")";
            })
            .text(d => (d.data * 100).toFixed(0) + "%");
    }

    function transitionAttributes() {
        slices.select("path")
            .transition()
            .duration(500)
            .attrTween("d", arcTween);

        slices.select("text.t1")
            .transition()
            .duration(500)
            .attr("transform", d => "translate(" + arc.centroid(d) + ")");

        slices.select("text.t2")
            .transition()
            .duration(500)
            .attr("transform", (d) => {
                var centroid = arc.centroid(d);
                return "translate(" + [centroid[0], centroid[1] + 20] + ")";
            })
            .text(d => (d.data * 100).toFixed(0) + "%");

        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            
            return function(t) {
                return arc(i(t));
            };
        }
    }

    function select(index) {
        var slice = slices.filter((d,i) => i == index);
        var centroid = arc.centroid(slice.data()[0]);
        slice.selectAll("text")
            .style("font-weight", "bold");
        slice.transition()
            .duration(500)
            .attr("transform", "translate(" + [centroid[0] / radius * 40, centroid[1] / radius * 40] + ")");
    }

    function deselect(index) {
        var slice = slices.filter((d,i) => i == index);
        slice.selectAll("text")
            .style("font-weight", "normal");
        slice.transition()
            .duration(500)
            .attr("transform", "translate(0,0)")
    }
}

function Slider(svg, x, y, monthWidth, monthNames) {
    this.render = render;
    this.getSelectedIndex = getSelectedIndex;
    this.onchange = null;
    var state = { selectedIndex: 0 };

    function getSelectedIndex() {
        return state.selectedIndex;
    }

    function render() {
        const slider = svg.append("g")
        .attr("transform", "translate(" + [x,y] + ")");

        slider.append("rect")
            .attr("y", 5)
            .attr("width", monthWidth * 12)
            .attr("height", 4)
            .style("fill", "gray");

        const sliderPointer = slider.append("circle")
            .attr("r", 5)
            .attr("cx", 0)
            .attr("cy", 7)
            .style("fill", "black")
            .style("cursor", "pointer");

        const initialDate = slider.append("g")
            .style("cursor", "pointer");

        initialDate.append("line")
            .attr("x1", 0)
            .attr("y1", 3)
            .attr("x2", 0)
            .attr("y2", 12)
            .style("stroke", "black");

        initialDate.append("line")
            .attr("x1", 0)
            .attr("y1", 3)
            .attr("x2", 0)
            .attr("y2", 12);

        initialDate.append("text")
            .attr("x", 0)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .attr("font-size", 10)
            .text("INITIAL");

        initialDate.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", monthWidth / 2)
            .attr("height", 40)
            .style("cursor", "pointer")
            .style("fill", "transparent")
            .on("click", () => {
                sliderPointer
                    .transition()
                    .duration(500)
                    .attr("cx", 0);
                if(this.onchange) {
                    state.selectedIndex = 0;
                    this.onchange(0);
                }
            });

        monthNames.forEach((x, i) => {
            const monthDate = slider.append("g")
                .attr("transform", "translate(" + [monthWidth / 2 + i * monthWidth, 0] +")");

            monthDate.append("line")
                .attr("x1", monthWidth / 2)
                .attr("y1", 3)
                .attr("x2", monthWidth / 2)
                .attr("y2", 12)
                .style("stroke", "black");

            monthDate.append("text")
                .attr("x", monthWidth / 2)
                .attr("y", 25)
                .attr("text-anchor", "middle")
                .text(x);

            monthDate.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", monthWidth)
                .attr("height", 40)
                .style("cursor", "pointer")
                .style("fill", "transparent")
                .on("click", () => {
                    sliderPointer
                        .transition()
                        .duration(500)
                        .attr("cx", monthWidth + i * monthWidth);
                    if(this.onchange) {
                        state.selectedIndex = i + 1;
                        this.onchange(i + 1);
                    }
                });
        });
    }
}

function PortfolioTable(svg, x, y, height, portfolio, stockNames, stockSymbols, monthDate) {
    this.render = render;
    this.update = update;
    this.select = select;
    this.deselect = deselect;    
    this.onmouseenter = null;
    this.onmouseleave = null;
    var state = { portfolio, monthDate };
    var table, title, amounts = [], total;

    function render() {
        table = svg.append("g")
            .attr("id", "table")
            .attr("transform", "translate(" + [x,y] + ")");

        table.append("rect")
            .attr("y", -40)
            .attr("fill", "gray")
            .attr("width", 320)
            .attr("height", height)
            .attr("stroke", "black");
        
        stockNames.forEach((x,i) => {
            stock = renderText(table, 10, 30 + i*30, 14, x + " (" + stockSymbols[i] + ")");
            table.append("rect")
                .attr("x", 10)
                .attr("y", 10 + i*30)
                .attr("width", 300)
                .attr("height", 30)
                .style("fill", "transparent")
                .classed("pointed", true)
                .on("mouseenter", () => {
                    if(this.onmouseenter){
                        this.select(i);
                        this.onmouseenter(i);
                    }
                })
                .on("mouseleave", () => {
                    if(this.onmouseleave) {
                        this.deselect(i);
                        this.onmouseleave(i);
                    }
                });
        });
        renderText(table, 10, height - 70, 20, "Total");

        title = renderCenteredText(table, 160, 0, 20, "").style("font-weight", "bold");
        stockNames.forEach((x,i) => {
            amounts.push(renderRightedText(table, 300, 30 + i*30, 17, ""));
        });
        total = renderRightedText(table, 300, height - 70, 20, "");

        renderState();
    }

    function renderState() {
        title.text(state.monthDate + ", 2016");
        stockNames.forEach((x,i) => {
            amounts[i].text(state.portfolio[i].toFixed(2));
        });
        total.text((state.portfolio.reduce((a,b) => a + b)).toFixed(2));
    }

    function update(portfolio, monthDate) {
        if(table) {
            state = { portfolio, monthDate };
            renderState();
        }
    }

    function select(index) {
        table.selectAll("text")
            .filter((d,i) => i == index || i == 7 + index)
            .style("font-weight", "bold");
    }

    function deselect(index) {
        table.selectAll("text")
            .filter((d,i) => i == index || i == 7 + index)
            .style("font-weight", "normal");
    }
    
}

function Tooltip(svg, x, y) {
    this.render = render;
    this.show = show;
    this.hide = hide;

    var state = { };
    var tooltip;

    function render() {
        tooltip = svg.append("g").attr("transform", "translate(" + [x,y] +")");
        renderCenteredText(tooltip, 0, 10, 14, "");        
    }

    function renderState() {
        tooltip.select("text")
            .style("font-weight", "bold")
            .text(state.shareCount + " shares x $" + state.price + " = $" + (state.shareCount * state.price).toFixed(2));
        tooltip.attr("visibility", "visible");
    }

    function show(shareCount, price) {
        state.shareCount = shareCount;
        state.price = price;
        renderState();
    }

    function hide() {
        tooltip.attr("visibility", "hidden");
    }

}