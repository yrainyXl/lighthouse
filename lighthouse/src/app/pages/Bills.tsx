import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingDown, TrendingUp, Calendar, Filter } from "lucide-react";

export function Bills() {
  const [selectedMonth] = useState("2026-03");

  // 月度支出数据
  const monthlyData = [
    { month: "1月", amount: 8500 },
    { month: "2月", amount: 9200 },
    { month: "3月", amount: 12458 },
  ];

  // 分类支出数据
  const categoryData = [
    { name: "餐饮", value: 3200, color: "#3b82f6" },
    { name: "交通", value: 1200, color: "#10b981" },
    { name: "购物", value: 4500, color: "#f59e0b" },
    { name: "娱乐", value: 1800, color: "#8b5cf6" },
    { name: "房租", value: 2000, color: "#ef4444" },
    { name: "其他", value: 758, color: "#6b7280" },
  ];

  // 每日支出趋势
  const dailyData = [
    { date: "3/18", amount: 256 },
    { date: "3/19", amount: 189 },
    { date: "3/20", amount: 445 },
    { date: "3/21", amount: 312 },
    { date: "3/22", amount: 678 },
    { date: "3/23", amount: 1523 },
    { date: "3/24", amount: 283 },
  ];

  // 详细账单列表
  const billsList = [
    { id: 1, date: "2026-03-24", category: "餐饮", description: "午餐 - 日料", amount: 235, tags: ["美食", "工作日"] },
    { id: 2, date: "2026-03-24", category: "交通", description: "地铁卡充值", amount: 48, tags: ["通勤"] },
    { id: 3, date: "2026-03-23", category: "购物", description: "MacBook Pro 配件", amount: 1280, tags: ["电子产品", "工作"] },
    { id: 4, date: "2026-03-23", category: "餐饮", description: "晚餐 - 火锅", amount: 188, tags: ["美食", "社交"] },
    { id: 5, date: "2026-03-22", category: "娱乐", description: "电影票", amount: 156, tags: ["休闲"] },
    { id: 6, date: "2026-03-22", category: "购物", description: "书籍", amount: 98, tags: ["学习"] },
    { id: 7, date: "2026-03-21", category: "餐饮", description: "咖啡", amount: 38, tags: ["饮品"] },
    { id: 8, date: "2026-03-21", category: "交通", description: "打车", amount: 45, tags: ["出行"] },
  ];

  const totalSpent = categoryData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900">账单统计</h2>
          <p className="text-gray-600 mt-2">
            从 Notion 同步的消费数据分析
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="font-medium">{selectedMonth}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">本月总支出</p>
                <p className="text-3xl font-semibold mt-2 text-gray-900">
                  ¥{totalSpent.toLocaleString()}
                </p>
                <div className="flex items-center mt-2 text-sm text-red-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="ml-1">+8.2% vs 上月</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">日均支出</p>
                <p className="text-3xl font-semibold mt-2 text-gray-900">
                  ¥{Math.round(totalSpent / 25).toLocaleString()}
                </p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <span>预计本月: ¥{Math.round((totalSpent / 25) * 31).toLocaleString()}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">最大支出类别</p>
                <p className="text-3xl font-semibold mt-2 text-gray-900">购物</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <span>占比 {((categoryData[2].value / totalSpent) * 100).toFixed(1)}%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <Filter className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="category" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="category">分类统计</TabsTrigger>
          <TabsTrigger value="trend">趋势分析</TabsTrigger>
          <TabsTrigger value="daily">每日明细</TabsTrigger>
        </TabsList>

        <TabsContent value="category" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>支出分类占比</CardTitle>
                <CardDescription>本月各类别支出分布</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>分类明细</CardTitle>
                <CardDescription>各类别具体金额</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-medium text-gray-900">{item.name}</span>
                        </div>
                        <span className="font-semibold text-gray-900">
                          ¥{item.value.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(item.value / totalSpent) * 100}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trend" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>月度支出趋势</CardTitle>
              <CardDescription>最近三个月的支出对比</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#6b7280', fontSize: 14 }}
                    axisLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 14 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickFormatter={(value) => `¥${(value / 1000).toFixed(1)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                    formatter={(value: number) => [`¥${value.toLocaleString()}`, '支出金额']}
                    labelStyle={{ color: '#111827', fontWeight: 600, marginBottom: '4px' }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="url(#barGradient)" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={80}
                  />
                </BarChart>
              </ResponsiveContainer>
              
              {/* 趋势说明 */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {monthlyData.map((item, index) => {
                  const prevAmount = index > 0 ? monthlyData[index - 1].amount : item.amount;
                  const change = ((item.amount - prevAmount) / prevAmount * 100).toFixed(1);
                  const isIncrease = item.amount > prevAmount;
                  
                  return (
                    <div key={item.month} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">{item.month}</span>
                        {index > 0 && (
                          <span className={`text-xs flex items-center gap-1 ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                            {isIncrease ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {isIncrease ? '+' : ''}{change}%
                          </span>
                        )}
                      </div>
                      <p className="text-2xl font-semibold text-gray-900">
                        ¥{item.amount.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>每日支出趋势</CardTitle>
              <CardDescription>最近7天的支出变化</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    name="支出金额 (¥)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle>最近账单</CardTitle>
          <CardDescription>详细的消费记录列表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {billsList.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">{bill.date}</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                      {bill.category}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 mt-1">{bill.description}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    {bill.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xl font-semibold text-red-600">
                  -¥{bill.amount}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">Notion 集成说明</h4>
              <p className="text-sm text-blue-800 mt-1">
                这些数据来自你的 Notion 账单数据库。你可以在 Notion 中记录消费，数据会自动同步到这里。
                需要配置 Notion API 来实现实时同步功能。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}