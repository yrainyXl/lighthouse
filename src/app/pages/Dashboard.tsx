import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Receipt, BookOpen, Library, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router";

export function Dashboard() {
  const features = [
    {
      title: "账单统计",
      description: "记录和分析你的消费数据，从 Notion 同步账单信息，查看支出趋势和分类统计",
      icon: Receipt,
      color: "text-red-600",
      bgColor: "bg-red-50",
      link: "/bills",
      gradient: "from-red-50 to-orange-50",
    },
    {
      title: "文章推荐",
      description: "记录学习文章，AI 自动提取摘要和学习建议，整理到 Notion 知识库",
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      link: "/articles",
      gradient: "from-blue-50 to-cyan-50",
    },
    {
      title: "知识库",
      description: "浏览和搜索整理好的知识内容，支持分类筛选和全文检索",
      icon: Library,
      color: "text-green-600",
      bgColor: "bg-green-50",
      link: "/knowledge",
      gradient: "from-green-50 to-emerald-50",
    },
  ];

  return (
    <div className="space-y-12">
      {/* Welcome Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
          <Library className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-4xl font-semibold text-gray-900">欢迎来到你的知识库</h2>
        <p className="text-lg text-gray-600">
          一个与 Notion 集成的个人学习和管理平台，帮助你记录生活、整理知识、持续成长
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.title} to={feature.link} className="group">
              <Card className={`h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-gray-300 bg-gradient-to-br ${feature.gradient}`}>
                <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                  <div className={`p-4 rounded-2xl ${feature.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 group-hover:text-gray-900 pt-2">
                    <span>进入</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <CardTitle className="text-lg">AI 智能助手</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-700">
              文章推荐功能集成 AI 自动整理，帮你提取关键信息、生成学习建议，让知识管理更高效。
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <CardTitle className="text-lg">Notion 同步</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-gray-700">
              所有数据与 Notion 无缝同步，在这里记录，在 Notion 中编辑，让你的知识管理更加灵活。
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card className="max-w-4xl mx-auto bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">开始使用</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              选择上方任意功能卡片进入对应模块，开始记录你的生活和知识。
              所有数据都将通过 Notion API 进行同步和管理。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}