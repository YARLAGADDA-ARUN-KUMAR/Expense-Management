import React, { useEffect, useState } from "react";
import { Company } from "@/entities/Company";
import { Expense } from "@/entities/Expense";
import { User } from "@/entities/User";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Users as UsersIcon, FileText } from "lucide-react";
import UserManagementTable from "../components/admin/UserManagementTable";
import ApprovalRulesCard from "../components/admin/ApprovalRulesCard";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalAmount: 0,
    pendingCount: 0,
    userCount: 0
  });
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [companyData, expenses, users] = await Promise.all([
      Company.list(),
      Expense.list(),
      User.list()
    ]);

    setCompany(companyData[0]);

    const categoryData = {};
    expenses.forEach(expense => {
      categoryData[expense.category] = (categoryData[expense.category] || 0) + expense.amount;
    });

    const chartArray = Object.entries(categoryData).map(([name, value]) => ({
      name,
      amount: value
    }));

    setStats({
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
      pendingCount: expenses.filter(e => e.status === "pending").length,
      userCount: users.length
    });
    setChartData(chartArray);
    setIsLoading(false);
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card className="relative overflow-hidden shadow-lg border-slate-200">
      <div className={absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${color} rounded-full opacity-10} />
      <CardHeader className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <CardTitle className="text-3xl font-bold mt-2 text-slate-900">
              {value}
            </CardTitle>
          </div>
          <div className={p-3 rounded-xl ${color} bg-opacity-20}>
            <Icon className={w-6 h-6 ${color.replace('bg-', 'text-')}} />
          </div>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">
            {company?.name} • {company?.country} • Default Currency: {company?.default_currency}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Expenses" 
            value={stats.totalExpenses}
            icon={FileText}
            color="bg-blue-600"
          />
          <StatCard 
            title="Total Amount" 
            value={${company?.default_currency} ${stats.totalAmount.toFixed(2)}}
            icon={DollarSign}
            color="bg-green-600"
          />
          <StatCard 
            title="Pending Approvals" 
            value={stats.pendingCount}
            icon={TrendingUp}
            color="bg-yellow-600"
          />
          <StatCard 
            title="Total Users" 
            value={stats.userCount}
            icon={UsersIcon}
            color="bg-purple-600"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-lg border-slate-200">
            <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
              <CardTitle className="text-slate-900">Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">
                  No expense data available
                </div>
              )}
            </CardContent>
          </Card>

          <ApprovalRulesCard />
        </div>

        <UserManagementTable />
      </div>
    </div>
  );
}