import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface HistoryChartData {
  webCount?: number;
  multimediaCount?: number;
  socialCount?: number;
  maliciousCount?: number;
}

interface HistoryChartProps {
  data: HistoryChartData;
}

const HistoryChart: React.FC<HistoryChartProps> = ({ data }) => {
  const chartData = {
    labels: ['Web', 'Multimedia', 'Social Media', 'Malicious'],
    datasets: [
      {
        label: 'Flow Count',
        data: [
          data.webCount || 0,
          data.multimediaCount || 0,
          data.socialCount || 0,
          data.maliciousCount || 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(196, 181, 253)',
        borderColor: 'rgba(139, 92, 246, 0.5)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(139, 92, 246, 0.1)',
        },
        ticks: {
          color: 'rgb(196, 181, 253)',
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(139, 92, 246, 0.1)',
        },
        ticks: {
          color: 'rgb(196, 181, 253)',
          font: {
            size: 11,
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default HistoryChart;