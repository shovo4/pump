// Add a row to the table
function addRow() {
    const tableBody = document.querySelector('#input-table tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="number" step="any"></td>
        <td><input type="number" step="any"></td>
        <td><input type="number" step="any"></td>
        <td><input type="number" step="any"></td>
        <td><input type="number" step="any"></td>
        <td></td>
        <td></td> <!-- Empty cell for elevation (L) -->
        <td></td> <!-- Empty cell for y = H + L -->
        <td><input type="number" step="any"></td> <!-- Input for TDH -->
        <td></td> <!-- Empty cell for TDH - y -->
    `;
    tableBody.appendChild(newRow);
}

// Calculate H for each row in the table and handle TDH calculations
function calculateH() {
    tdhMinusYData = []; // Resetting the data for new calculations
    const tableRows = document.querySelectorAll('#input-table tbody tr');
    
    tableRows.forEach(row => {
        const from = parseFloat(row.querySelector('td:nth-child(1) input').value);
        const to = parseFloat(row.querySelector('td:nth-child(2) input').value);
        const diameter = parseFloat(row.querySelector('td:nth-child(3) input').value);
        const flow = parseFloat(row.querySelector('td:nth-child(4) input').value);
        const constant = parseFloat(row.querySelector('td:nth-child(5) input').value);

        const exponent1 = 10.67 * (to - from) / Math.pow(diameter, 4.8704);
        const exponent2 = Math.pow(flow / constant, 1.852);
        const result = exponent1 * exponent2;

        const elevationDiff = calculateElevationDifference(from, to);
        const yValue = result + elevationDiff;

        row.querySelector('td:nth-child(6)').textContent = result.toFixed(2);
        row.querySelector('td:nth-child(7)').textContent = elevationDiff.toFixed(2);
        row.querySelector('td:nth-child(8)').textContent = yValue.toFixed(2);

        const tdh = parseFloat(row.querySelector('td:nth-child(9) input').value);
        const tdhMinusY = tdh - yValue;

        row.querySelector('td:nth-child(10)').textContent = tdhMinusY.toFixed(2);

        // Collecting 'TDH - y' against distance for plotting
        const fromDistance = parseFloat(row.querySelector('td:nth-child(1) input').value);
        const toDistance = parseFloat(row.querySelector('td:nth-child(2) input').value);
        tdhMinusYData.push({ fromDistance, toDistance, tdhMinusY });
    });
    plotTDHMinusYGraph(); // Function call to plot new graph
}

// Function to plot 'TDH - y' against distance
function plotTDHMinusYGraph() {
    const ctx = document.getElementById('tdh-graph-container').getContext('2d');
    const tdhMinusYValues = tdhMinusYData.map(data => ({
        x: (data.fromDistance + data.toDistance) / 2, // Averaging the distance for plotting
        y: data.tdhMinusY
    }));

    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'TDH - y vs Distance',
                data: tdhMinusYValues,
                borderColor: 'red',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                showLine: true, // Connect points with a line
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    scaleLabel: {
                        display: true,
                        labelString: 'Distance'
                    }
                },
                y: {
                    scaleLabel: {
                        display: true,
                        labelString: 'TDH - y'
                    }
                }
            }
        }
    });
}


let excelData = []; // Global variable to store Excel data
let tdhMinusYData = []; // Global variable to store 'TDH - y' and distance data

// Read the Excel file and store distance and elevation data
function handleFile(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        excelData = XLSX.utils.sheet_to_json(worksheet, { header: ['Distance', 'Elevation'] });

        plotGraph(); // Call to plot the graph
    };

    reader.readAsArrayBuffer(file);
}

// Helper function to find elevation difference based on from and to distances
function calculateElevationDifference(from, to) {
    const fromElevation = excelData.find(d => d.Distance === from);
    const toElevation = excelData.find(d => d.Distance === to);
    if (fromElevation && toElevation) {
        return toElevation.Elevation - fromElevation.Elevation;
    }
    return NaN; // Return NaN if either 'from' or 'to' elevation is not found
}

// Function to plot the graph
function plotGraph() {
    const ctx = document.getElementById('graph-container').getContext('2d');
    const distances = excelData.map(entry => entry.Distance);
    const elevations = excelData.map(entry => entry.Elevation);

    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: distances,
            datasets: [{
                label: 'Elevation vs Distance',
                data: elevations,
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                x: {
                    scaleLabel: {
                        display: true,
                        labelString: 'Distance'
                    }
                },
                y: {
                    scaleLabel: {
                        display: true,
                        labelString: 'Elevation'
                    }
                }
            }
        }
    });
}
