import { ProjectReport } from "brain/data-contracts";
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

interface Props {
  report: ProjectReport;
}

const ReportHeader = ({ report }: Props) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "#52C41A"; // Green
    if (score >= 40) return "#FFA940"; // Amber
    return "#FF4D4F"; // Red
  };

  const overallScoreColor = getScoreColor(report.overall_score);

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-4 text-crystal-text-primary">{report.project_name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 flex flex-col items-center justify-center crystal-surface p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-crystal-text-secondary">Overall Score</h2>
          <div style={{ width: "100%", height: 150 }}>
            <ResponsiveContainer>
              <RadialBarChart
                innerRadius="70%"
                outerRadius="100%"
                data={[{ name: "score", value: report.overall_score }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background={{ fill: 'var(--crystal-surface-light)' }}
                  dataKey="value"
                  cornerRadius={10}
                  fill={overallScoreColor}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-3xl font-bold"
                  style={{ fill: "var(--crystal-text-primary)" }}
                >
                  {`${Math.round(report.overall_score)}%`}
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-6">
          <div className="crystal-surface p-6 rounded-lg">
            <h3 className="font-semibold text-crystal-text-secondary">Structure & Architecture</h3>
            <p className="text-2xl font-bold text-crystal-text-primary mt-2">{report.structure_score.toFixed(1)}%</p>
          </div>
          <div className="crystal-surface p-6 rounded-lg">
            <h3 className="font-semibold text-crystal-text-secondary">Code Quality & Readability</h3>
            <p className="text-2xl font-bold text-crystal-text-primary mt-2">{report.quality_score.toFixed(1)}%</p>
          </div>
          <div className="crystal-surface p-6 rounded-lg">
            <h3 className="font-semibold text-crystal-text-secondary">Security</h3>
            <p className="text-2xl font-bold text-crystal-text-primary mt-2">{report.security_score.toFixed(1)}%</p>
          </div>
          <div className="crystal-surface p-6 rounded-lg">
            <h3 className="font-semibold text-crystal-text-secondary">Dependencies</h3>
            <p className="text-2xl font-bold text-crystal-text-primary mt-2">{report.dependencies_score.toFixed(1)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportHeader;


