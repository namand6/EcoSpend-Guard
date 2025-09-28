// src/components/CategoryChart.tsx
import { Bar } from "react-chartjs-2";
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function CategoryChart({ byCategory }: { byCategory: Record<string,{usd:number; co2e_kg:number}> }) {
  const labels = Object.keys(byCategory);
  const usd = labels.map(k => byCategory[k].usd);
  const kg  = labels.map(k => byCategory[k].co2e_kg);

  const data = {
    labels,
    datasets: [
      { label: "USD", data: usd, borderRadius: 10 },
      { label: "CO₂e (kg)", data: kg, borderRadius: 10 }
    ]
  };
  const options:any = {
    responsive: true,
    plugins: {
      legend: { display: true, position: "bottom" },
      tooltip: { callbacks: { label: (ctx:any) =>
        `${ctx.dataset.label}: ${ctx.dataset.label.includes("USD") ? `$${ctx.parsed.y.toFixed(2)}` : `${ctx.parsed.y.toFixed(0)} kg`}` } }
    },
    scales: {
      x: { grid: { display:false } },
      y: { ticks: { callback:(v:number)=> v>=1000?`$${(v/1000).toFixed(1)}k`:`${v}` } }
    }
  };
  return (
    <div className="p-5">
      <h3 className="mb-3 text-lg font-medium">By Category</h3>
      <Bar data={data} options={options} height={110}/>
    </div>
  );
}
