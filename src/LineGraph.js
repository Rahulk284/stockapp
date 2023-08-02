import React from 'react'
import { Line } from "react-chartjs-2"
import 'chart.js/auto'


function LineGraph({ chartData }) {

    const addHorizontalLine = () => {
        return {
            type: 'line',
            mode: 'horizontal',
            scaleID: 'y',
            value: 10000,
            borderColor: 'red',
            borderWidth: 2,
            label: {
                enables: true,
                content: '10000',
                position: 'left',
            }
        }
    }
    const options = {
        scales: {
          y: {
            display: false, // Hide the y-axis
          },
          x: {
            display: false, // Hide the x-axis
          },
        },
        interaction: {
            intersect: false,
            mode: "x"
        },
        plugins: {
          legend: {
            display: false, // Hide the legend
          },
          annotations: [addHorizontalLine()],
        },
        elements: {
            point: {
                hoverRadius: 8,
                radius: 10,
            }
        },
      };
    return (
        <div style={{position: 'relative', marginTop: '20px'}}>
            <Line data={chartData} options={options}/>
        </div>
    ) 

}

export default LineGraph