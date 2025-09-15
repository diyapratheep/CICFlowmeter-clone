import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface LiveChartData {
  webCount: number;
  multimediaCount: number;
  socialCount: number;
  maliciousCount: number;
}

const LiveChart = ({ data }: { data: LiveChartData }) => {
  const chartData = {
    labels: ['Web', 'Multimedia', 'Social Media', 'Malicious'],
    datasets: [
      {
        data: [
          data.webCount || 0,
          data.multimediaCount || 0,
          data.socialCount || 0,
          data.maliciousCount || 0,
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // Green for Web
          'rgba(59, 130, 246, 0.8)',  // Blue for Multimedia
          'rgba(251, 191, 36, 0.8)',  // Yellow for Social Media
          'rgba(239, 68, 68, 0.8)',   // Red for Malicious
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgb(196, 181, 253)',
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.9)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(196, 181, 253)',
        borderColor: 'rgba(139, 92, 246, 0.5)',
        borderWidth: 1,
      },
    },
    cutout: '60%',
  };

  const totalFlows = data.webCount + data.multimediaCount + data.socialCount + data.maliciousCount;

  return (
    <div className="relative h-64">
      <Doughnut data={chartData} options={options} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{totalFlows}</div>
          <div className="text-sm text-purple-300">Total Flows</div>
        </div>
      </div>
    </div>
  );
};

export default LiveChart;