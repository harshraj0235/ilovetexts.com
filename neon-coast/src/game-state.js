export const CONTRACTS = [
  { title: 'The first run', copy: 'A package. A fast car. A fresh start.', kind: 'COURIER CONTRACT', reward: 800, seconds: 150, points: [[0, -90], [90, -90], [90, 0]], labels: ['Collect the package', 'Take Ocean Avenue', 'Deliver to the marina'] },
  { title: 'Coastline sprint', copy: 'Four corners. One coast. Beat the clock.', kind: 'STREET RACE', reward: 1400, seconds: 115, points: [[0, 90], [-90, 90], [-90, -90], [0, -90]], labels: ['South checkpoint', 'West checkpoint', 'North checkpoint', 'Finish line'] },
  { title: 'Heat of the night', copy: 'Make the drop. Keep moving. Lose the tail.', kind: 'HIGH-RISK DELIVERY', reward: 2400, seconds: 160, points: [[90, -90], [90, 90], [-90, 90], [-90, 0]], labels: ['Collect the cargo', 'Marina checkpoint', 'Cross the district', 'Final drop'] },
];
export function readSave(raw) {
  try {
    const data = JSON.parse(raw);
    return { cash: Number.isFinite(data?.cash) ? Math.max(0, Math.min(1e9, data.cash)) : 500, completed: Number.isInteger(data?.completed) ? Math.max(0, data.completed) : 0 };
  } catch { return { cash: 500, completed: 0 }; }
}
export function advanceMission(mission, x, z, driving) {
  if (!mission || !driving) return false;
  const [tx, tz] = mission.contract.points[mission.stage];
  if (Math.hypot(x - tx, z - tz) >= 10) return false;
  mission.stage += 1;
  return true;
}
