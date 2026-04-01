import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingDown, TrendingUp, Calendar, RefreshCw } from "lucide-react";

const CATEGORY_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#6b7280",
];

type MonthlyItem = { month: string; yearMonth: string; amount: number };
type DailyItem = { date: string; amount: number };
type CategoryItem = { name: string; value: number; color: string };

function getPrevMonths(yearMonth: string, count: number): { from: string; to: string } {
  const [y, m] = yearMonth.split("-").map(Number);
  const fromDate = new Date(y, m - count, 1);
  const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, "0")}`;
  return { from, to: yearMonth };
}

export function Bills() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [monthlyData, setMonthlyData] = useState<MonthlyItem[]>([]);
  const [dailyData, setDailyData] = useState<DailyItem[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchStats = async (yearMonth: string) => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = getPrevMonths(yearMonth, 3);
      const res = await fetch(`/api/ledger/bills-stats?from=${from}&to=${to}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMonthlyData(data.monthly ?? []);
      setDailyData(data.daily ?? []);
      setCategoryData(data.byCategory ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const syncFromNotion = async () => {
    setSyncing(true);
    setError(null);
    try {
      const from = selectedMonth + "-01";
      const to = selectedMonth + "-31";
      const res = await fetch("/api/notion/query-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, forceRefresh: true }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchStats(selectedMonth);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchStats(selectedMonth);
  }, [selectedMonth]);

  const totalSpent = categoryData.reduce((sum, item) => sum + item.value, 0);
  const currentMonthData = monthlyData.find((m) => m.yearMonth === selectedMonth);
  const prevMonthData = monthlyData[monthlyData.length - 2];
  const trend = currentMonthData && prevMonthData
    ? ((currentMonthData.amount - prevMonthData.amount) / prevMonthData.amount) * 100
    : null;

  // 生成月份选项（最近12个月）
  const monthOptions: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900">账单统计</h2>
          <p className="text-gray-600 mt-2">从 Notion 同步的消费数据分析</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select
              className="font-medium bg-transparent outline-none cursor-pointer"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button
            onClick={syncFromNotion}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "同步中…" : "从 Notion 同步"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">加载中…</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600">本月总支出</p>
                    <p className="text-3xl font-semibold mt-2 text-gray-900">
                      ¥{(currentMonthData?.amount ?? totalSpent).toLocaleString()}
                    </p>
                  </div>
                  {trend !== null && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                      trend > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                    }`}>
                      {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(trend).toFixed(1)}%
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">笔数</p>
                <p className="text-3xl font-semibold mt-2 text-gray-900">{dailyData.length > 0 ? "—" : "0"}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600">最大分类</p>
                <p className="text-3xl font-semibold mt-2 text-gray-900">
                  {categoryData[0]?.name ?? "—"}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {categoryData[0] ? `¥${categoryData[0].value.toLocaleString()}` : ""}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="category">
            <TabsList>
              <TabsTrigger value="category">分类支出</TabsTrigger>
              <TabsTrigger value="daily">每日趋势</TabsTrigger>
              <TabsTrigger value="trend">月度对比</TabsTrigger>
            </TabsList>

            {/* 分类支出 */}
            <TabsContent value="category" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>支出分类</CardTitle>
                    <CardDescription>各分类占比</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {categoryData.length === 0 ? (
                      <div className="flex items-center justify-center h-40 text-gray-400">暂无数据，请先从 Notion 同步</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {categoryData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => `¥${v.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>分类明细</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryData.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm text-gray-700">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-100 rounded-full h-2">
                              <div className="h-2 rounded-full" style={{ width: `${totalSpent ? (item.value / totalSpent * 100) : 0}%`, backgroundColor: item.color }} />
                            </div>
                            <span className="text-sm font-medium w-20 text-right">¥{item.value.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                      {categoryData.length === 0 && (
                        <p className="text-gray-400 text-sm text-center py-4">暂无数据</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 每日趋势 */}
            <TabsContent value="daily" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>每日支出</CardTitle>
                  <CardDescription>{selectedMonth} 每日消费趋势</CardDescription>
                </CardHeader>
                <CardContent>
                  {dailyData.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-400">暂无数据，请先从 Notion 同步</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={dailyData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#6b7280" }} />
                        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                        <Tooltip formatter={(v: number) => [`¥${v.toLocaleString()}`, "支出"]} />
                        <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 月度对比 */}
            <TabsContent value="trend" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>月度支出趋势</CardTitle>
                  <CardDescription>最近三个月的支出对比</CardDescription>
                </CardHeader>
                <CardContent>
                  {monthlyData.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-gray-400">暂无数据，请先从 Notion 同步</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 14 }} />
                        <YAxis tick={{ fill: "#6b7280", fontSize: 13 }} />
                        <Tooltip formatter={(v: number) => [`¥${v.toLocaleString()}`, "支出"]} />
                        <Legend />
                        <Bar dataKey="amount" name="支出" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={80} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
