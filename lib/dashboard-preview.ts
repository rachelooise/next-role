export type ChartPoint = { label: string; value: number };

export const researchActivity: ChartPoint[] = [
  { label: "Mon", value: 2 }, { label: "Tue", value: 5 }, { label: "Wed", value: 3 },
  { label: "Thu", value: 8 }, { label: "Fri", value: 12 }, { label: "Sat", value: 4 }, { label: "Sun", value: 1 },
];
export const jobsOverTime: ChartPoint[] = [
  { label: "Mon", value: 12 }, { label: "Tue", value: 45 }, { label: "Wed", value: 32 },
  { label: "Thu", value: 60 }, { label: "Fri", value: 85 }, { label: "Sat", value: 40 }, { label: "Sun", value: 10 },
];
export const matchDistribution: ChartPoint[] = [
  { label: "50-60%", value: 5 }, { label: "60-70%", value: 15 }, { label: "70-80%", value: 45 },
  { label: "80-90%", value: 85 }, { label: "90-100%", value: 35 },
];
